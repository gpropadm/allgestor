import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { generatePaymentsForContract } from '@/lib/payment-generator'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { contractId } = await request.json()
    
    if (!contractId) {
      return NextResponse.json({ error: 'contractId é obrigatório' }, { status: 400 })
    }
    
    console.log('🔄 Forçando geração de pagamentos para contrato:', contractId)
    
    // Verificar se o contrato existe e pertence ao usuário
    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        userId: user.id
      },
      include: {
        tenant: { select: { name: true } },
        property: { select: { title: true } }
      }
    })
    
    if (!contract) {
      return NextResponse.json({ 
        error: 'Contrato não encontrado ou você não tem permissão para acessá-lo' 
      }, { status: 404 })
    }
    
    console.log('📋 Contrato encontrado:', contract.property?.title, '-', contract.tenant?.name)
    
    // Verificar quantos pagamentos já existem
    const existingPayments = await prisma.payment.count({
      where: { contractId }
    })
    
    console.log('📊 Pagamentos existentes:', existingPayments)
    
    // Forçar geração (mesmo se já existem pagamentos)
    const payments = await generatePaymentsForContract(contractId, true)
    
    console.log('✅ Pagamentos gerados:', payments.length)
    
    return NextResponse.json({
      success: true,
      message: `${payments.length} pagamentos gerados com sucesso para o contrato`,
      contract: {
        id: contract.id,
        tenant: contract.tenant?.name,
        property: contract.property?.title
      },
      existingPayments,
      newPayments: payments.length,
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        dueDate: p.dueDate.toISOString().split('T')[0],
        status: p.status
      }))
    })
    
  } catch (error) {
    console.error('❌ Erro ao forçar geração de pagamentos:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}