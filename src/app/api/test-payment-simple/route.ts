import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// API ULTRA SIMPLES PARA TESTAR CRIAÇÃO DE PAGAMENTO
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 TESTE SIMPLES DE CRIAÇÃO DE PAGAMENTO...')
    
    // Buscar primeiro contrato ativo
    const contract = await prisma.contract.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        tenant: { select: { name: true } },
        property: { select: { title: true } }
      }
    })
    
    if (!contract) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum contrato ativo encontrado'
      })
    }
    
    console.log(`📋 Contrato encontrado: ${contract.tenant?.name}`)
    
    // Verificar quantos pagamentos já existem
    const existingCount = await prisma.payment.count({
      where: { contractId: contract.id }
    })
    
    console.log(`💰 Pagamentos existentes: ${existingCount}`)
    
    // Tentar criar UM pagamento simples
    const newPayment = await prisma.payment.create({
      data: {
        contractId: contract.id,
        amount: 1500.00,
        dueDate: new Date('2025-07-15'),
        status: 'PENDING'
      }
    })
    
    console.log(`✅ Pagamento criado: ${newPayment.id}`)
    
    return NextResponse.json({
      success: true,
      message: 'Pagamento criado com sucesso!',
      payment: {
        id: newPayment.id,
        amount: newPayment.amount,
        dueDate: newPayment.dueDate,
        status: newPayment.status,
        contractId: newPayment.contractId
      },
      contract: {
        tenant: contract.tenant?.name,
        property: contract.property?.title,
        existingPayments: existingCount
      }
    })
    
  } catch (error) {
    console.error('❌ ERRO:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

// Também permitir POST
export async function POST(request: NextRequest) {
  return GET(request)
}