import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log('=== TESTE FILTRO PAGAMENTOS ===')
    
    // Buscar TODOS os pagamentos do usuário (sem filtro)
    const allPayments = await prisma.payment.findMany({
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
      orderBy: { dueDate: 'desc' }
    })
    
    console.log(`📊 Total de pagamentos no banco: ${allPayments.length}`)
    
    // Agrupar por ano/mês
    const byMonth: Record<string, any[]> = {}
    const byTenant: Record<string, any[]> = {}
    
    allPayments.forEach(payment => {
      const monthKey = payment.dueDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      const tenantName = payment.contract.tenant.name
      
      if (!byMonth[monthKey]) byMonth[monthKey] = []
      if (!byTenant[tenantName]) byTenant[tenantName] = []
      
      byMonth[monthKey].push({
        id: payment.id,
        dueDate: payment.dueDate.toLocaleDateString('pt-BR'),
        status: payment.status,
        amount: payment.amount,
        tenant: tenantName,
        property: payment.contract.property.title
      })
      
      byTenant[tenantName].push({
        id: payment.id,
        dueDate: payment.dueDate.toLocaleDateString('pt-BR'),
        monthKey,
        status: payment.status,
        amount: payment.amount
      })
    })
    
    // Simular filtro atual da interface
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const currentMonthKey = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    
    const currentMonthPayments = allPayments.filter(payment => {
      const paymentMonth = payment.dueDate.getMonth()
      const paymentYear = payment.dueDate.getFullYear()
      return paymentMonth === currentMonth && paymentYear === currentYear
    })
    
    console.log(`📅 Mês atual (${currentMonthKey}): ${currentMonthPayments.length} pagamentos`)
    
    // Simular expansão de "CASAS BAHIA LTDA"
    const casasBahiaPayments = byTenant['CASAS BAHIA LTDA'] || []
    console.log(`🏢 CASAS BAHIA LTDA: ${casasBahiaPayments.length} pagamentos`)
    
    return NextResponse.json({
      success: true,
      totalPayments: allPayments.length,
      currentMonth: currentMonthKey,
      currentMonthPayments: currentMonthPayments.length,
      paymentsByMonth: Object.keys(byMonth).map(month => ({
        month,
        count: byMonth[month].length,
        payments: byMonth[month].slice(0, 3) // Primeiros 3 como amostra
      })),
      paymentsByTenant: Object.keys(byTenant).map(tenant => ({
        tenant,
        count: byTenant[tenant].length,
        months: [...new Set(byTenant[tenant].map(p => p.monthKey))],
        samplePayments: byTenant[tenant].slice(0, 5)
      })),
      filterTest: {
        onlyCurrentMonth: currentMonthPayments.map(p => ({
          dueDate: p.dueDate.toLocaleDateString('pt-BR'),
          tenant: p.contract.tenant.name
        })),
        casasBahiaExpanded: casasBahiaPayments
      }
    })
    
  } catch (error) {
    console.error('❌ Erro no teste de filtro:', error)
    return NextResponse.json({
      error: 'Erro no teste',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}