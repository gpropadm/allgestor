import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Buscar TODOS os pagamentos do usuário
    const payments = await prisma.payment.findMany({
      where: {
        contract: {
          userId: user.id
        }
      },
      include: {
        contract: {
          include: {
            property: { select: { title: true } },
            tenant: { select: { name: true } }
          }
        }
      },
      orderBy: { dueDate: 'desc' },
      take: 20
    })
    
    console.log(`✅ Encontrados ${payments.length} pagamentos no total`)
    
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      dueDate: payment.dueDate.toLocaleDateString('pt-BR'),
      dueDateMonth: payment.dueDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      amount: `R$ ${payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      status: payment.status,
      property: payment.contract.property.title,
      tenant: payment.contract.tenant.name,
      contractId: payment.contractId
    }))
    
    // Agrupar por mês
    const paymentsByMonth: Record<string, any[]> = {}
    formattedPayments.forEach(payment => {
      const month = payment.dueDateMonth
      if (!paymentsByMonth[month]) {
        paymentsByMonth[month] = []
      }
      paymentsByMonth[month].push(payment)
    })
    
    const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const currentMonthPayments = paymentsByMonth[currentMonth] || []
    
    return NextResponse.json({
      success: true,
      totalPayments: payments.length,
      currentMonth,
      currentMonthPayments: currentMonthPayments.length,
      paymentsByMonth,
      recentPayments: formattedPayments.slice(0, 10)
    })
    
  } catch (error) {
    console.error('❌ Erro ao verificar pagamentos:', error)
    return NextResponse.json({
      error: 'Erro ao verificar pagamentos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}