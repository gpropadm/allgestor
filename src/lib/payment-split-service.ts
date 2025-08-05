// Serviço de integração G-PROP + ASAAS Split
// Gerencia automaticamente o split de pagamentos entre proprietário e imobiliária

import { PrismaClient } from '@prisma/client'
import { AsaasSplitService } from './asaas-split-service'

const prisma = new PrismaClient()

interface ContractSplitData {
  contractId: string
  propertyTitle: string
  tenantName: string
  tenantEmail: string
  tenantPhone: string
  tenantDocument: string
  ownerName: string
  ownerEmail: string
  ownerDocument: string
  ownerPhone: string
  rentAmount: number
  administrationFeePercentage: number
  dueDate: string
  companyId: string
}

export class PaymentSplitService {
  private asaasService: AsaasSplitService | null = null

  constructor(private companyApiKey?: string) {
    if (companyApiKey) {
      this.asaasService = new AsaasSplitService(companyApiKey)
    }
  }

  /**
   * Inicializa o serviço ASAAS para uma empresa específica
   */
  private async initializeAsaasService(companyId: string): Promise<AsaasSplitService> {
    if (this.asaasService) {
      return this.asaasService
    }

    // Buscar configurações ASAAS da empresa
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        asaasApiKey: true,
        asaasEnabled: true,
        name: true
      }
    })

    if (!company) {
      throw new Error('Empresa não encontrada')
    }

    if (!company.asaasEnabled || !company.asaasApiKey) {
      throw new Error('ASAAS não está configurado para esta empresa. Configure nas configurações da empresa.')
    }

    this.asaasService = new AsaasSplitService(company.asaasApiKey)
    return this.asaasService
  }

  /**
   * Configura subconta ASAAS para um proprietário (se não existir)
   */
  async setupOwnerAsaasAccount(ownerId: string, companyId: string): Promise<{
    walletId: string
    success: boolean
    message: string
  }> {
    try {
      const asaasService = await this.initializeAsaasService(companyId)

      // Buscar dados do proprietário
      const owner = await prisma.owner.findUnique({
        where: { id: ownerId },
        include: {
          bankAccounts: true,
          properties: {
            select: {
              rentPrice: true
            }
          }
        }
      })

      if (!owner) {
        throw new Error('Proprietário não encontrado')
      }

      // Verificar se já tem wallet ASAAS
      const existingBankAccount = owner.bankAccounts.find(account => account.asaasWalletId)

      if (existingBankAccount?.asaasWalletId && existingBankAccount.validated) {
        return {
          walletId: existingBankAccount.asaasWalletId,
          success: true,
          message: 'Proprietário já possui conta ASAAS configurada'
        }
      }

      // Estimar renda baseada nos imóveis
      const averageRent = owner.properties.reduce((sum, prop) => sum + prop.rentPrice, 0) / owner.properties.length
      const estimatedIncome = Math.max(averageRent * 10, 3000) // 10x o aluguel médio ou mínimo R$ 3.000

      console.log('Criando subconta ASAAS para proprietário:', {
        name: owner.name,
        email: owner.email,
        estimatedIncome
      })

      // Criar subconta no ASAAS
      const subAccount = await asaasService.createOwnerSubAccount({
        name: owner.name,
        email: owner.email,
        document: owner.document,
        phone: owner.phone,
        address: owner.address,
        city: owner.city,
        state: owner.state,
        zipCode: owner.zipCode,
        estimatedIncome
      })

      // Salvar ou atualizar conta bancária com dados ASAAS
      if (existingBankAccount) {
        await prisma.bankAccount.update({
          where: { id: existingBankAccount.id },
          data: {
            asaasWalletId: subAccount.walletId,
            validated: true,
            validatedAt: new Date()
          }
        })
      } else {
        await prisma.bankAccount.create({
          data: {
            ownerId: owner.id,
            bankName: 'ASAAS',
            bankCode: 'ASAAS',
            accountType: 'DIGITAL',
            agency: 'ASAAS',
            account: subAccount.accountId,
            asaasWalletId: subAccount.walletId,
            validated: true,
            validatedAt: new Date(),
            isDefault: true,
            isActive: true
          }
        })
      }

      console.log('Subconta ASAAS criada com sucesso:', {
        walletId: subAccount.walletId,
        accountId: subAccount.accountId
      })

      return {
        walletId: subAccount.walletId,
        success: true,
        message: 'Conta ASAAS criada com sucesso para o proprietário'
      }
    } catch (error) {
      console.error('Erro ao configurar conta ASAAS do proprietário:', error)
      return {
        walletId: '',
        success: false,
        message: `Erro ao configurar conta ASAAS: ${error.message}`
      }
    }
  }

  /**
   * Gera boleto com split automático para um contrato
   */
  async generateSplitPayment(contractData: ContractSplitData): Promise<{
    success: boolean
    paymentId?: string
    boletoUrl?: string
    pixQrCode?: string
    message: string
    splitDetails?: {
      ownerAmount: number
      companyAmount: number
      asaasFee: number
    }
  }> {
    try {
      const asaasService = await this.initializeAsaasService(contractData.companyId)

      // Buscar contrato completo
      const contract = await prisma.contract.findUnique({
        where: { id: contractData.contractId },
        include: {
          property: {
            include: {
              owner: {
                include: {
                  bankAccounts: true
                }
              }
            }
          },
          tenant: true
        }
      })

      if (!contract) {
        throw new Error('Contrato não encontrado')
      }

      // Verificar se proprietário tem wallet ASAAS
      const ownerWallet = contract.property.owner.bankAccounts.find(acc => acc.asaasWalletId && acc.validated)

      if (!ownerWallet?.asaasWalletId) {
        // Tentar configurar automaticamente
        const setupResult = await this.setupOwnerAsaasAccount(contract.property.owner.id, contractData.companyId)
        
        if (!setupResult.success) {
          return {
            success: false,
            message: `Proprietário não possui conta ASAAS configurada. ${setupResult.message}`
          }
        }
      }

      const finalWalletId = ownerWallet?.asaasWalletId || (await this.setupOwnerAsaasAccount(contract.property.owner.id, contractData.companyId)).walletId

      // Criar boleto com split
      const splitResult = await asaasService.createBoletoWithAutomaticSplit({
        contractId: contractData.contractId,
        tenantData: {
          name: contract.tenant.name,
          email: contract.tenant.email,
          phone: contract.tenant.phone,
          cpfCnpj: contract.tenant.document,
          address: contract.tenant.address,
          city: contract.tenant.city,
          state: contract.tenant.state,
          postalCode: contract.tenant.zipCode
        },
        amount: contractData.rentAmount,
        dueDate: contractData.dueDate,
        description: `Aluguel - ${contractData.propertyTitle} - ${new Date(contractData.dueDate).toLocaleDateString('pt-BR')}`,
        ownerWalletId: finalWalletId,
        administrationFeePercentage: contractData.administrationFeePercentage
      })

      // Criar registro de pagamento no banco
      const payment = await prisma.payment.create({
        data: {
          contractId: contractData.contractId,
          amount: contractData.rentAmount,
          dueDate: new Date(contractData.dueDate),
          status: 'PENDING',
          paymentMethod: 'BOLETO',
          boletoUrl: splitResult.boletoUrl,
          boletoCode: splitResult.payment.id,
          asaasPaymentId: splitResult.asaasPaymentId,
          asaasCustomerId: splitResult.asaasCustomerId,
          ownerAmount: splitResult.splits.ownerAmount,
          companyAmount: splitResult.splits.companyAmount,
          asaasFee: splitResult.splits.asaasFee,
          pixQrCode: splitResult.pixQrCode,
          splitStatus: 'PENDING',
          splitData: JSON.stringify({
            ownerWalletId: finalWalletId,
            administrationFeePercentage: contractData.administrationFeePercentage,
            createdAt: new Date().toISOString()
          })
        }
      })

      console.log('Pagamento com split criado:', {
        paymentId: payment.id,
        asaasPaymentId: splitResult.asaasPaymentId,
        ownerAmount: splitResult.splits.ownerAmount,
        companyAmount: splitResult.splits.companyAmount
      })

      return {
        success: true,
        paymentId: payment.id,
        boletoUrl: splitResult.boletoUrl,
        pixQrCode: splitResult.pixQrCode,
        message: 'Boleto gerado com sucesso. O valor será dividido automaticamente.',
        splitDetails: {
          ownerAmount: splitResult.splits.ownerAmount,
          companyAmount: splitResult.splits.companyAmount,
          asaasFee: splitResult.splits.asaasFee
        }
      }
    } catch (error) {
      console.error('Erro ao gerar pagamento com split:', error)
      return {
        success: false,
        message: `Erro ao gerar boleto: ${error.message}`
      }
    }
  }

  /**
   * Processa webhook do ASAAS e atualiza status do pagamento
   */
  async processAsaasWebhook(webhookData: any, companyId: string): Promise<{
    success: boolean
    paymentUpdated?: string
    message: string
  }> {
    try {
      const asaasService = await this.initializeAsaasService(companyId)
      
      // Processar webhook
      const webhookResult = await asaasService.processPaymentWebhook(webhookData)

      // Buscar pagamento no banco pelo external reference (contractId) ou asaasPaymentId
      const payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { asaasPaymentId: webhookResult.paymentId },
            { contractId: webhookResult.externalReference }
          ]
        }
      })

      if (!payment) {
        console.warn('Pagamento não encontrado para webhook:', {
          paymentId: webhookResult.paymentId,
          externalReference: webhookResult.externalReference
        })
        return {
          success: false,
          message: 'Pagamento não encontrado no sistema'
        }
      }

      // Atualizar status do pagamento
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: webhookResult.status,
          paidDate: webhookResult.paidDate ? new Date(webhookResult.paidDate) : null,
          splitStatus: webhookResult.splitProcessed ? 'DONE' : 'PENDING',
          updatedAt: new Date()
        }
      })

      // 🧾 GERAR RECIBO AUTOMATICAMENTE SE PAGAMENTO FOI CONFIRMADO
      if (webhookResult.status === 'PAID') {
        console.log('🧾 Gerando recibo automaticamente para pagamento ASAAS:', updatedPayment.id)
        
        try {
          // Chamar API de geração de recibo
          await this.gerarReciboAutomatico(updatedPayment.id)
          console.log('✅ Recibo gerado automaticamente via webhook ASAAS')
        } catch (error) {
          console.error('⚠️ Erro ao gerar recibo via webhook:', error)
          // Não falhar o webhook por causa do recibo
        }
      }

      console.log('Webhook processado:', {
        paymentId: payment.id,
        status: webhookResult.status,
        splitProcessed: webhookResult.splitProcessed
      })

      return {
        success: true,
        paymentUpdated: updatedPayment.id,
        message: `Status atualizado para: ${webhookResult.status}`
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error)
      return {
        success: false,
        message: `Erro ao processar webhook: ${error.message}`
      }
    }
  }

  /**
   * Gera pagamentos mensais automáticos com split para um contrato
   */
  async generateMonthlyPaymentsWithSplit(
    contractId: string, 
    startDate: string, 
    endDate: string,
    companyId: string
  ): Promise<{
    success: boolean
    paymentsGenerated: number
    message: string
    errors?: string[]
  }> {
    try {
      // Buscar dados do contrato
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          property: {
            include: {
              owner: true
            }
          },
          tenant: true
        }
      })

      if (!contract) {
        throw new Error('Contrato não encontrado')
      }

      const start = new Date(startDate)
      const end = new Date(endDate)
      const payments: string[] = []
      const errors: string[] = []
      
      const currentDate = new Date(start)
      
      while (currentDate <= end) {
        try {
          const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 10) // Dia 10 de cada mês
          
          // Verificar se já existe pagamento para este mês
          const existingPayment = await prisma.payment.findFirst({
            where: {
              contractId: contractId,
              dueDate: {
                gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
                lt: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
              }
            }
          })

          if (existingPayment) {
            console.log(`Pagamento já existe para ${currentDate.getFullYear()}/${currentDate.getMonth() + 1}`)
            currentDate.setMonth(currentDate.getMonth() + 1)
            continue
          }

          // Gerar pagamento com split
          const result = await this.generateSplitPayment({
            contractId: contract.id,
            propertyTitle: contract.property.title,
            tenantName: contract.tenant.name,
            tenantEmail: contract.tenant.email,
            tenantPhone: contract.tenant.phone,
            tenantDocument: contract.tenant.document,
            ownerName: contract.property.owner.name,
            ownerEmail: contract.property.owner.email,
            ownerDocument: contract.property.owner.document,
            ownerPhone: contract.property.owner.phone,
            rentAmount: contract.rentAmount,
            administrationFeePercentage: contract.administrationFeePercentage,
            dueDate: dueDate.toISOString(),
            companyId: companyId
          })

          if (result.success && result.paymentId) {
            payments.push(result.paymentId)
          } else {
            errors.push(`${currentDate.toLocaleDateString('pt-BR')}: ${result.message}`)
          }
        } catch (error) {
          errors.push(`${currentDate.toLocaleDateString('pt-BR')}: ${error.message}`)
        }
        
        // Próximo mês
        currentDate.setMonth(currentDate.getMonth() + 1)
      }
      
      return {
        success: payments.length > 0,
        paymentsGenerated: payments.length,
        message: `${payments.length} pagamentos gerados com sucesso`,
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error) {
      console.error('Erro ao gerar pagamentos mensais:', error)
      return {
        success: false,
        paymentsGenerated: 0,
        message: `Erro ao gerar pagamentos: ${error.message}`
      }
    }
  }

  /**
   * Testa configuração ASAAS de uma empresa
   */
  async testCompanyAsaasSetup(companyId: string): Promise<{
    success: boolean
    accountInfo?: any
    message: string
  }> {
    try {
      const asaasService = await this.initializeAsaasService(companyId)
      const testResult = await asaasService.testConnection()
      
      if (testResult.success) {
        return {
          success: true,
          accountInfo: testResult.accountInfo,
          message: 'Conexão com ASAAS funcionando corretamente'
        }
      } else {
        return {
          success: false,
          message: `Erro na conexão: ${testResult.error}`
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Erro ao testar configuração: ${error.message}`
      }
    }
  }

  /**
   * Gera recibo automaticamente para um pagamento
   */
  private async gerarReciboAutomatico(paymentId: string): Promise<void> {
    try {
      const { ReciboGenerator } = await import('./recibo-generator')
      
      // Buscar o pagamento com todas as informações necessárias
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          contract: {
            include: {
              property: {
                include: {
                  owner: true
                }
              },
              tenant: true,
              company: true
            }
          },
          recibo: true // Verificar se já existe recibo
        }
      })

      if (!payment) {
        throw new Error('Pagamento não encontrado')
      }

      if (payment.recibo) {
        console.log('Recibo já existe para este pagamento:', payment.recibo.numeroRecibo)
        return
      }

      if (payment.status !== 'PAID') {
        throw new Error('Pagamento ainda não foi marcado como pago')
      }

      // Gerar número do recibo
      const competencia = new Date(payment.paidDate || payment.dueDate)
      const ano = competencia.getFullYear()
      const mes = competencia.getMonth() + 1

      // Contar recibos existentes para gerar sequencial
      const recibosExistentes = await prisma.recibo.count({
        where: {
          userId: payment.contract.userId,
          competencia: {
            gte: new Date(ano, mes - 1, 1),
            lt: new Date(ano, mes, 1)
          }
        }
      })

      const numeroRecibo = ReciboGenerator.gerarNumeroRecibo(payment.contract.userId, ano, mes, recibosExistentes + 1)

      // Calcular valores
      const valorTotal = payment.amount
      const percentualTaxa = payment.contract.administrationFeePercentage
      const { taxaAdministracao, valorRepassado } = ReciboGenerator.calcularValores(valorTotal, percentualTaxa)

      // Criar registro do recibo no banco
      await prisma.recibo.create({
        data: {
          userId: payment.contract.userId,
          contractId: payment.contractId,
          paymentId: payment.id,
          numeroRecibo,
          competencia,
          dataPagamento: payment.paidDate || new Date(),
          valorTotal,
          taxaAdministracao,
          percentualTaxa,
          valorRepassado,
          pdfUrl: `/api/recibos/${numeroRecibo}/pdf`,
          proprietarioNome: payment.contract.property.owner.name,
          proprietarioDoc: payment.contract.property.owner.document,
          inquilinoNome: payment.contract.tenant.name,
          inquilinoDoc: payment.contract.tenant.document,
          imovelEndereco: `${payment.contract.property.address}, ${payment.contract.property.city} - ${payment.contract.property.state}`,
        }
      })

      console.log(`✅ Recibo ${numeroRecibo} criado automaticamente via webhook`)

    } catch (error) {
      console.error('Erro ao gerar recibo automaticamente:', error)
      throw error
    }
  }
}