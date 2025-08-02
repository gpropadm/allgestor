// API simplificada para gerar boletos mensais - versão debug
// Endpoint: POST /api/asaas/generate-monthly-simple

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('=== INÍCIO GENERATE MONTHLY SIMPLE ===')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      console.log('❌ Sem sessão ou companyId')
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    console.log('✅ Usuário autorizado:', session.user.companyId)

    const body = await request.json()
    console.log('📥 Body recebido:', body)
    
    const { contractId, months = 3 } = body

    if (!contractId) {
      console.log('❌ ContractId missing')
      return NextResponse.json(
        { error: 'contractId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar contrato
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    console.log('🔍 Buscando contrato:', contractId)

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        property: {
          include: {
            owner: {
              include: {
                bankAccounts: {
                  where: {
                    asaasWalletId: { not: null }
                  }
                }
              }
            }
          }
        },
        tenant: true
      }
    })

    if (!contract) {
      console.log('❌ Contrato não encontrado')
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ Contrato encontrado:', {
      id: contract.id,
      tenant: contract.tenant.name,
      owner: contract.property.owner.name,
      rentAmount: contract.rentAmount,
      administrationFeePercentage: contract.administrationFeePercentage,
      hasAsaasWallet: contract.property.owner.bankAccounts.length > 0
    })

    // Verificar se proprietário tem wallet ASAAS
    if (contract.property.owner.bankAccounts.length === 0) {
      console.log('❌ Proprietário sem wallet ASAAS')
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'Proprietário não possui conta ASAAS configurada' },
        { status: 400 }
      )
    }

    // Gerar boletos um por um (método mais simples)
    const results = []
    const errors = []

    for (let i = 0; i < months; i++) {
      try {
        const dueDate = new Date()
        dueDate.setMonth(dueDate.getMonth() + i + 1) // Próximo mês + i
        dueDate.setDate(10) // Dia 10

        console.log(`📅 Gerando boleto ${i + 1}/${months} para ${dueDate.toLocaleDateString('pt-BR')}`)

        // Verificar se já existe pagamento para este mês
        const existingPayment = await prisma.payment.findFirst({
          where: {
            contractId: contractId,
            dueDate: {
              gte: new Date(dueDate.getFullYear(), dueDate.getMonth(), 1),
              lt: new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 1)
            }
          }
        })

        if (existingPayment) {
          console.log(`⚠️ Boleto já existe para ${dueDate.toLocaleDateString('pt-BR')}`)
          continue
        }

        // Chamar API individual de boleto
        const boletoResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://app.gprop.com.br'}/api/asaas/generate-boleto`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('Cookie') || ''
          },
          body: JSON.stringify({
            contractId: contract.id,
            amount: contract.rentAmount,
            dueDate: dueDate.toISOString(),
            description: `Aluguel - ${contract.property.title} - ${dueDate.toLocaleDateString('pt-BR')}`
          })
        })

        const boletoResult = await boletoResponse.json()
        
        if (boletoResult.success) {
          console.log(`✅ Boleto ${i + 1} criado com sucesso`)
          results.push({
            month: dueDate.toLocaleDateString('pt-BR'),
            paymentId: boletoResult.paymentId
          })
        } else {
          console.log(`❌ Erro no boleto ${i + 1}:`, boletoResult.message)
          errors.push(`${dueDate.toLocaleDateString('pt-BR')}: ${boletoResult.message}`)
        }
      } catch (error) {
        console.log(`❌ Exception no boleto ${i + 1}:`, error.message)
        errors.push(`Boleto ${i + 1}: ${error.message}`)
      }
    }

    await prisma.$disconnect()

    console.log('📊 Resultado final:', {
      successful: results.length,
      errors: errors.length,
      total: months
    })

    return NextResponse.json({
      success: results.length > 0,
      paymentsGenerated: results.length,
      message: `${results.length} boletos gerados com sucesso de ${months} solicitados`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      contractInfo: {
        tenant: contract.tenant.name,
        owner: contract.property.owner.name,
        months: months
      }
    })

  } catch (error) {
    console.error('💥 ERRO GERAL:', error)
    return NextResponse.json(
      { error: `Erro interno: ${error.message}` },
      { status: 500 }
    )
  }
}