import { NextRequest, NextResponse } from 'next/server'
import { UnifiedPaymentService } from '@/lib/unified-payment-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!companyId) {
      return NextResponse.json({ error: 'companyId é obrigatório' }, { status: 400 })
    }

    // Definir datas padrão se não fornecidas (último mês)
    const defaultEndDate = new Date()
    const defaultStartDate = new Date()
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 1)

    const finalStartDate = startDate || defaultStartDate.toISOString().split('T')[0]
    const finalEndDate = endDate || defaultEndDate.toISOString().split('T')[0]

    const paymentService = new UnifiedPaymentService()
    
    const summary = await paymentService.getFinancialSummary(
      companyId,
      finalStartDate,
      finalEndDate
    )

    await paymentService.disconnect()

    return NextResponse.json({
      success: true,
      data: {
        ...summary,
        period: {
          startDate: finalStartDate,
          endDate: finalEndDate
        }
      }
    })

  } catch (error) {
    console.error('Error getting financial summary:', error)
    return NextResponse.json({
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}