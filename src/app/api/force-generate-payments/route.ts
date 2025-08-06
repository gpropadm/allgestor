import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { generatePaymentsForContract } from '@/lib/payment-generator'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { contractId } = await request.json()
    
    console.log('=== FORCE GENERATE PAYMENTS ===')
    console.log('User ID:', user.id)
    console.log('Contract ID:', contractId)
    
    // Verificar se o contrato pertence ao usuário
    const contract = await prisma.contract.findFirst({
      where: { 
        id: contractId,
        userId: user.id 
      },
      include: {
        property: { select: { title: true } },
        tenant: { select: { name: true } }
      }
    })
    
    if (!contract) {
      return NextResponse.json({
        error: 'Contrato não encontrado ou não pertence ao usuário'
      }, { status: 404 })
    }
    
    console.log(`📋 Contrato encontrado: ${contract.property.title} - ${contract.tenant.name}`)
    
    // Contar pagamentos existentes
    const existingPayments = await prisma.payment.count({
      where: { contractId }
    })
    
    console.log(`💰 Pagamentos existentes: ${existingPayments}`)
    
    // Forçar geração (mesmo se já existem)
    const generatedPayments = await generatePaymentsForContract(contractId, true)
    
    console.log(`✅ ${generatedPayments.length} pagamentos gerados/atualizados!`)
    
    return NextResponse.json({
      success: true,
      contract: {
        id: contract.id,
        property: contract.property.title,
        tenant: contract.tenant.name,
        status: contract.status
      },
      existingPayments,
      generatedPayments: generatedPayments.length,
      payments: generatedPayments.map(p => ({
        id: p.id,
        dueDate: p.dueDate.toLocaleDateString('pt-BR'),
        amount: p.amount,
        status: p.status
      }))
    })
    
  } catch (error) {
    console.error('❌ Erro ao forçar geração:', error)
    return NextResponse.json({
      error: 'Erro ao gerar pagamentos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}