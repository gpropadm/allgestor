import { NextRequest, NextResponse } from 'next/server'
import { PJBankService } from '@/lib/pjbank-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valor deve ser maior que zero' }, { status: 400 })
    }

    const pjbankService = new PJBankService()
    const recommendation = pjbankService.calculateOptimalGateway(parseFloat(amount))

    return NextResponse.json({
      success: true,
      data: {
        recommendation,
        comparison: {
          pjbank: {
            gateway: 'PJBANK',
            fee: 8.00,
            feeType: 'fixed',
            description: 'R$ 4,00 boleto + R$ 4,00 split'
          },
          asaas: {
            gateway: 'ASAAS',
            fee: parseFloat(amount) * 0.035,
            feeType: 'percentage',
            description: '3,5% sobre o valor (estimativa)'
          }
        },
        breakEvenPoint: 8.00 / 0.035 // ~R$ 228,57
      }
    })

  } catch (error) {
    console.error('Error calculating gateway recommendation:', error)
    return NextResponse.json({
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}