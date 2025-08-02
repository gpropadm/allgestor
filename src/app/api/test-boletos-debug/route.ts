// API FUNCIONAL para boletos mensais
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 === API BOLETOS MENSAIS FUNCIONANDO ===')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      console.log('❌ Usuário não autorizado')
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    console.log('✅ Usuário autorizado:', session.user.companyId)

    const body = await request.json()
    console.log('📥 Dados recebidos:', JSON.stringify(body, null, 2))
    
    const { contractId, months = 3 } = body

    if (!contractId) {
      console.log('❌ contractId é obrigatório')
      return NextResponse.json(
        { 
          success: false,
          paymentsGenerated: 0,
          message: 'contractId é obrigatório',
          contractInfo: null
        }
      )
    }

    console.log(`📋 Processando: contractId=${contractId}, months=${months}`)

    // Conectar ao banco
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    console.log('🔍 Buscando contrato no banco...')

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        property: {
          include: {
            owner: {
              include: {
                bankAccounts: {
                  where: {
                    asaasWalletId: { not: null },
                    validated: true
                  }
                }
              }
            }
          }
        },
        tenant: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!contract) {
      console.log('❌ Contrato não encontrado')
      await prisma.$disconnect()
      return NextResponse.json({
        success: false,
        paymentsGenerated: 0,
        message: 'Contrato não encontrado',
        contractInfo: null
      })
    }

    console.log('✅ Contrato encontrado:', {
      id: contract.id,
      tenant: contract.tenant.name,
      owner: contract.property.owner.name,
      rent: contract.rentAmount,
      adminFee: contract.administrationFeePercentage,
      wallets: contract.property.owner.bankAccounts.length
    })

    // Verificar ASAAS wallet
    if (contract.property.owner.bankAccounts.length === 0) {
      console.log('❌ Proprietário sem wallet ASAAS')
      await prisma.$disconnect()
      return NextResponse.json({
        success: false,
        paymentsGenerated: 0,
        message: 'Proprietário não tem conta ASAAS configurada',
        contractInfo: {
          tenant: contract.tenant.name,
          owner: contract.property.owner.name,
          months: months
        }
      })
    }

    console.log('✅ Wallet ASAAS encontrado:', contract.property.owner.bankAccounts[0].asaasWalletId)

    // Gerar boletos reais
    const successful = []
    const failed = []

    for (let i = 0; i < months; i++) {
      try {
        const dueDate = new Date()
        dueDate.setMonth(dueDate.getMonth() + i + 1)
        dueDate.setDate(10)

        console.log(`📅 Gerando boleto ${i + 1}/${months} para ${dueDate.toLocaleDateString('pt-BR')}`)

        // Verificar se já existe
        const existing = await prisma.payment.findFirst({
          where: {
            contractId: contractId,
            dueDate: {
              gte: new Date(dueDate.getFullYear(), dueDate.getMonth(), 1),
              lt: new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 1)
            }
          }
        })

        if (existing) {
          console.log(`⚠️ Boleto já existe para ${dueDate.toLocaleDateString('pt-BR')}`)
          failed.push(`${dueDate.toLocaleDateString('pt-BR')}: Já existe`)
          continue
        }

        // Gerar boleto via API interna
        console.log(`🎯 Gerando boleto real para ${dueDate.toLocaleDateString('pt-BR')}...`)
        
        const boletoPayload = {
          contractId: contract.id,
          amount: contract.rentAmount,
          dueDate: dueDate.toISOString(),
          description: `Aluguel - ${contract.property.title} - ${dueDate.toLocaleDateString('pt-BR')}`
        }

        // Usar a API de geração de boleto existente
        const boletoResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://app.gprop.com.br'}/api/asaas/generate-boleto`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('Cookie') || ''
          },
          body: JSON.stringify(boletoPayload)
        })

        const boletoResult = await boletoResponse.json()
        console.log(`📋 Resultado boleto ${i + 1}:`, boletoResult.success ? 'SUCESSO' : 'FALHA')

        if (boletoResult.success) {
          successful.push({
            month: dueDate.toLocaleDateString('pt-BR'),
            amount: contract.rentAmount,
            paymentId: boletoResult.paymentId
          })
          console.log(`✅ Boleto ${i + 1} criado com sucesso`)
        } else {
          failed.push(`${dueDate.toLocaleDateString('pt-BR')}: ${boletoResult.message}`)
          console.log(`❌ Boleto ${i + 1} falhou:`, boletoResult.message)
        }

      } catch (error) {
        console.log(`❌ Erro no boleto ${i + 1}:`, error.message)
        failed.push(`Boleto ${i + 1}: ${error.message}`)
      }
    }

    await prisma.$disconnect()

    console.log('📊 RESULTADO FINAL:')
    console.log(`✅ Sucessos: ${successful.length}`)
    console.log(`❌ Falhas: ${failed.length}`)

    return NextResponse.json({
      success: successful.length > 0,
      paymentsGenerated: successful.length,
      message: `${successful.length} de ${months} boletos criados com sucesso`,
      errors: failed.length > 0 ? failed : undefined,
      contractInfo: {
        tenant: contract.tenant.name,
        owner: contract.property.owner.name,
        months: months
      }
    })

  } catch (error) {
    console.error('💥 ERRO CRÍTICO:', error)
    return NextResponse.json({
      success: false,
      paymentsGenerated: 0,
      message: `Erro interno: ${error.message}`,
      contractInfo: null
    })
  }
}