import { NextRequest, NextResponse } from 'next/server'
import { crmMCP } from '@/lib/mcp-server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'summary':
        const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined
        const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined
        
        const summary = await crmMCP.getFinancialSummary(session.user.id, month, year)
        return NextResponse.json(summary)

      case 'payments':
        const paymentFilters = {
          status: searchParams.get('status') as any,
          overdue: searchParams.get('overdue') === 'true',
          userId: session.user.id,
          contractId: searchParams.get('contractId') || undefined,
          fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
          toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined
        }

        const payments = await crmMCP.getPayments(paymentFilters)
        return NextResponse.json(payments)

      default:
        return NextResponse.json({ error: 'Ação não especificada' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro na API MCP Financial:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}