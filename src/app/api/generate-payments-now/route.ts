import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { generatePaymentsForContract } from '@/lib/payment-generator'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Buscar todos os contratos do usuário
    const contracts = await prisma.contract.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      }
    })
    
    if (contracts.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum contrato ativo encontrado',
        message: 'Crie um contrato primeiro para gerar pagamentos'
      }, { status: 404 })
    }
    
    let totalPayments = 0
    const results = []
    
    // Gerar pagamentos para cada contrato
    for (const contract of contracts) {
      try {
        console.log(`💰 Gerando pagamentos para contrato ${contract.id}`)
        const payments = await generatePaymentsForContract(contract.id)
        totalPayments += payments.length
        results.push({
          contractId: contract.id,
          paymentsGenerated: payments.length,
          success: true
        })
      } catch (error) {
        console.error(`❌ Erro ao gerar pagamentos para contrato ${contract.id}:`, error)
        results.push({
          contractId: contract.id,
          paymentsGenerated: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Pagamentos gerados com sucesso!`,
      contractsProcessed: contracts.length,
      totalPaymentsGenerated: totalPayments,
      results
    })
    
  } catch (error) {
    console.error('❌ Erro ao gerar pagamentos:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}