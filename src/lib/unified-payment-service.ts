import { AsaasService } from './asaas-service'
import { PJBankService } from './pjbank-service'
import { PrismaClient } from '@prisma/client'

interface BoletoRequest {
  contractId: string
  tenantName: string
  tenantEmail: string
  tenantDocument: string
  tenantPhone?: string
  amount: number
  dueDate: string
  description: string
  administrationFeePercentage: number
  ownerId: string
  forceGateway?: 'ASAAS' | 'PJBANK'
}

interface BoletoResponse {
  paymentId: string
  gateway: 'ASAAS' | 'PJBANK'
  gatewayPaymentId: string
  boletoUrl: string
  boletoCode?: string
  pixQrCode?: string
  splits: {
    ownerAmount: number
    companyAmount: number
    gatewayFee: number
  }
  estimatedCosts: {
    gateway: string
    fee: number
    reason: string
  }
}

interface WebhookPayload {
  gateway: 'ASAAS' | 'PJBANK'
  data: any
}

export class UnifiedPaymentService {
  private asaasService: AsaasService
  private pjbankService: PJBankService
  private prisma: PrismaClient

  constructor() {
    this.asaasService = new AsaasService()
    this.pjbankService = new PJBankService()
    this.prisma = new PrismaClient()
  }

  async selectOptimalGateway(amount: number, forceGateway?: 'ASAAS' | 'PJBANK'): Promise<{
    gateway: 'ASAAS' | 'PJBANK'
    estimatedFee: number
    reason: string
  }> {
    if (forceGateway) {
      const fee = forceGateway === 'PJBANK' ? 8.00 : amount * 0.035
      return {
        gateway: forceGateway,
        estimatedFee: fee,
        reason: `Gateway forçado pelo usuário: ${forceGateway}`
      }
    }

    return this.pjbankService.calculateOptimalGateway(amount)
  }

  async createBoletoWithSplit(request: BoletoRequest): Promise<BoletoResponse> {
    try {
      // Buscar dados do proprietário e conta bancária
      const owner = await this.prisma.owner.findUnique({
        where: { id: request.ownerId },
        include: {
          bankAccounts: {
            where: { isActive: true },
            orderBy: { isDefault: 'desc' }
          }
        }
      })

      if (!owner) {
        throw new Error('Proprietário não encontrado')
      }

      if (!owner.bankAccounts || owner.bankAccounts.length === 0) {
        throw new Error('Proprietário não possui conta bancária cadastrada')
      }

      const bankAccount = owner.bankAccounts[0]

      // Selecionar gateway ótimo
      const gatewaySelection = await this.selectOptimalGateway(request.amount, request.forceGateway)
      
      let boletoResult: any
      let gatewayPaymentId: string
      let splits: any

      if (gatewaySelection.gateway === 'ASAAS') {
        // Verificar/criar wallet do proprietário no Asaas
        let walletId = bankAccount.asaasWalletId

        if (!walletId) {
          const wallet = await this.asaasService.createWallet({
            name: owner.name,
            email: owner.email,
            cpfCnpj: owner.document,
            phone: owner.phone,
            bankAccount: {
              bank: { code: bankAccount.bankCode },
              accountName: owner.name,
              ownerName: owner.name,
              cpfCnpj: owner.document,
              agency: bankAccount.agency,
              account: bankAccount.account,
              accountDigit: bankAccount.accountDigit || '',
              bankAccountType: bankAccount.accountType === 'poupanca' ? 'CONTA_POUPANCA' : 'CONTA_CORRENTE'
            }
          })

          walletId = wallet.id!

          // Atualizar conta bancária com wallet ID
          await this.prisma.bankAccount.update({
            where: { id: bankAccount.id },
            data: { asaasWalletId: walletId }
          })
        }

        // Criar boleto no Asaas
        const asaasResult = await this.asaasService.createBoletoWithSplit(
          {
            name: request.tenantName,
            email: request.tenantEmail,
            cpfCnpj: request.tenantDocument,
            phone: request.tenantPhone || ''
          },
          request.amount,
          request.dueDate,
          request.description,
          walletId,
          request.administrationFeePercentage,
          request.contractId
        )

        boletoResult = asaasResult
        gatewayPaymentId = asaasResult.payment.id
        splits = asaasResult.splits

      } else {
        // Verificar/criar conta do proprietário no PJBank
        let accountId = bankAccount.pjbankAccountId

        if (!accountId) {
          const account = await this.pjbankService.createAccount({
            banco: bankAccount.bankCode,
            agencia: bankAccount.agency,
            conta: bankAccount.account,
            tipo_conta: bankAccount.accountType === 'poupanca' ? 'poupanca' : 'corrente',
            documento: owner.document,
            nome_favorecido: owner.name,
            email_favorecido: owner.email,
            telefone_favorecido: owner.phone
          })

          accountId = account.conta_favorecida

          // Atualizar conta bancária com account ID
          await this.prisma.bankAccount.update({
            where: { id: bankAccount.id },
            data: { pjbankAccountId: accountId }
          })
        }

        // Criar boleto no PJBank
        const pjbankResult = await this.pjbankService.createBoletoWithSplit(
          {
            nome_cliente: request.tenantName,
            email_cliente: request.tenantEmail,
            cpf_cliente: request.tenantDocument.replace(/\D/g, '').length === 11 ? request.tenantDocument : undefined,
            cnpj_cliente: request.tenantDocument.replace(/\D/g, '').length === 14 ? request.tenantDocument : undefined,
            telefone_cliente: request.tenantPhone
          },
          request.amount,
          request.dueDate,
          request.description,
          accountId,
          request.administrationFeePercentage,
          request.contractId
        )

        boletoResult = pjbankResult
        gatewayPaymentId = pjbankResult.boleto.id_unico
        splits = pjbankResult.splits

      }

      // Criar registro de pagamento no banco
      const payment = await this.prisma.payment.create({
        data: {
          contractId: request.contractId,
          amount: request.amount,
          dueDate: new Date(request.dueDate),
          status: 'PENDING',
          paymentMethod: 'BOLETO',
          gateway: gatewaySelection.gateway,
          gatewayPaymentId,
          boletoUrl: gatewaySelection.gateway === 'ASAAS' ? boletoResult.boletoUrl : boletoResult.boleto.link_boleto,
          boletoCode: gatewaySelection.gateway === 'ASAAS' ? undefined : boletoResult.boleto.linha_digitavel,
          pixQrCode: gatewaySelection.gateway === 'ASAAS' ? boletoResult.pixQrCode : boletoResult.boleto.qr_code_pix,
          ownerAmount: gatewaySelection.gateway === 'ASAAS' ? splits.ownerAmount : splits.ownerAmount,
          companyAmount: gatewaySelection.gateway === 'ASAAS' ? splits.companyAmount : splits.companyAmount,
          gatewayFee: gatewaySelection.gateway === 'ASAAS' ? splits.fee : splits.fees.total,
          splitData: JSON.stringify(splits)
        }
      })

      return {
        paymentId: payment.id,
        gateway: gatewaySelection.gateway,
        gatewayPaymentId,
        boletoUrl: gatewaySelection.gateway === 'ASAAS' ? boletoResult.boletoUrl : boletoResult.boleto.link_boleto,
        boletoCode: gatewaySelection.gateway === 'ASAAS' ? undefined : boletoResult.boleto.linha_digitavel,
        pixQrCode: gatewaySelection.gateway === 'ASAAS' ? boletoResult.pixQrCode : boletoResult.boleto.qr_code_pix,
        splits: {
          ownerAmount: gatewaySelection.gateway === 'ASAAS' ? splits.ownerAmount : splits.ownerAmount,
          companyAmount: gatewaySelection.gateway === 'ASAAS' ? splits.companyAmount : splits.companyAmount,
          gatewayFee: gatewaySelection.gateway === 'ASAAS' ? splits.fee : splits.fees.total
        },
        estimatedCosts: gatewaySelection
      }

    } catch (error) {
      console.error('Error creating boleto with split:', error)
      throw new Error(`Erro ao gerar boleto: ${error.message}`)
    }
  }

  async processWebhook(payload: WebhookPayload): Promise<boolean> {
    try {
      let webhookResult: any

      if (payload.gateway === 'ASAAS') {
        webhookResult = await this.asaasService.processWebhook(payload.data)
      } else {
        webhookResult = await this.pjbankService.processWebhook(payload.data)
      }

      // Buscar pagamento no banco pelo ID externo
      const payment = await this.prisma.payment.findFirst({
        where: {
          OR: [
            { gatewayPaymentId: webhookResult.paymentId },
            { contractId: webhookResult.paymentId }
          ]
        }
      })

      if (!payment) {
        console.warn(`Payment not found for webhook: ${webhookResult.paymentId}`)
        return false
      }

      // Atualizar status do pagamento
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: webhookResult.status,
          paidDate: webhookResult.paidDate ? new Date(webhookResult.paidDate) : null,
          webhookReceived: true,
          lastWebhookAt: new Date()
        }
      })

      // Se pago, atualizar contrato se necessário
      if (webhookResult.status === 'PAID') {
        // Aqui você pode adicionar lógica adicional quando o pagamento for confirmado
        console.log(`Payment confirmed: ${payment.id}`)
      }

      return true

    } catch (error) {
      console.error('Error processing webhook:', error)
      return false
    }
  }

  async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          contract: {
            include: {
              tenant: true,
              property: {
                include: {
                  owner: true
                }
              }
            }
          }
        }
      })

      if (!payment) {
        throw new Error('Pagamento não encontrado')
      }

      // Buscar dados atualizados no gateway
      let gatewayData: any = null
      
      if (payment.gatewayPaymentId) {
        try {
          if (payment.gateway === 'ASAAS') {
            gatewayData = await this.asaasService.getPayment(payment.gatewayPaymentId)
          } else {
            gatewayData = await this.pjbankService.getBoleto(payment.gatewayPaymentId)
          }
        } catch (error) {
          console.warn('Error fetching gateway data:', error)
        }
      }

      return {
        ...payment,
        gatewayData,
        splitDetails: payment.splitData ? JSON.parse(payment.splitData) : null
      }

    } catch (error) {
      console.error('Error getting payment details:', error)
      throw new Error('Erro ao buscar detalhes do pagamento')
    }
  }

  async getFinancialSummary(companyId: string, startDate: string, endDate: string): Promise<{
    totalReceived: number
    totalPending: number
    totalOverdue: number
    gatewayBreakdown: {
      asaas: { count: number; amount: number; fees: number }
      pjbank: { count: number; amount: number; fees: number }
    }
    ownerBreakdown: Array<{
      ownerId: string
      ownerName: string
      totalAmount: number
      totalFees: number
      paymentsCount: number
    }>
  }> {
    try {
      const payments = await this.prisma.payment.findMany({
        where: {
          contract: { companyId },
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        include: {
          contract: {
            include: {
              property: {
                include: {
                  owner: true
                }
              }
            }
          }
        }
      })

      const summary = {
        totalReceived: 0,
        totalPending: 0,
        totalOverdue: 0,
        gatewayBreakdown: {
          asaas: { count: 0, amount: 0, fees: 0 },
          pjbank: { count: 0, amount: 0, fees: 0 }
        },
        ownerBreakdown: new Map()
      }

      payments.forEach(payment => {
        const owner = payment.contract.property.owner

        // Totais por status
        switch (payment.status) {
          case 'PAID':
            summary.totalReceived += payment.amount
            break
          case 'PENDING':
            summary.totalPending += payment.amount
            break
          case 'OVERDUE':
            summary.totalOverdue += payment.amount
            break
        }

        // Breakdown por gateway
        const gateway = payment.gateway.toLowerCase() as 'asaas' | 'pjbank'
        summary.gatewayBreakdown[gateway].count++
        summary.gatewayBreakdown[gateway].amount += payment.amount
        summary.gatewayBreakdown[gateway].fees += payment.gatewayFee || 0

        // Breakdown por proprietário
        if (!summary.ownerBreakdown.has(owner.id)) {
          summary.ownerBreakdown.set(owner.id, {
            ownerId: owner.id,
            ownerName: owner.name,
            totalAmount: 0,
            totalFees: 0,
            paymentsCount: 0
          })
        }

        const ownerData = summary.ownerBreakdown.get(owner.id)!
        ownerData.totalAmount += payment.ownerAmount || 0
        ownerData.totalFees += payment.gatewayFee || 0
        ownerData.paymentsCount++
      })

      return {
        ...summary,
        ownerBreakdown: Array.from(summary.ownerBreakdown.values())
      }

    } catch (error) {
      console.error('Error getting financial summary:', error)
      throw new Error('Erro ao gerar relatório financeiro')
    }
  }

  async disconnect() {
    await this.prisma.$disconnect()
  }
}