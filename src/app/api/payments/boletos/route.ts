import { NextRequest, NextResponse } from 'next/server'
import { UnifiedPaymentService } from '@/lib/unified-payment-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    
    const {
      contractId,
      tenantName,
      tenantEmail,
      tenantDocument,
      tenantPhone,
      amount,
      dueDate,
      description,
      administrationFeePercentage,
      ownerId,
      forceGateway
    } = body

    // Validações básicas
    if (!contractId || !tenantName || !tenantEmail || !tenantDocument || !amount || !dueDate || !ownerId) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: contractId, tenantName, tenantEmail, tenantDocument, amount, dueDate, ownerId' 
      }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Valor deve ser maior que zero' }, { status: 400 })
    }

    if (administrationFeePercentage < 0 || administrationFeePercentage > 100) {
      return NextResponse.json({ error: 'Taxa de administração deve estar entre 0 e 100%' }, { status: 400 })
    }

    const paymentService = new UnifiedPaymentService()

    const result = await paymentService.createBoletoWithSplit({
      contractId,
      tenantName,
      tenantEmail,
      tenantDocument,
      tenantPhone,
      amount: parseFloat(amount),
      dueDate,
      description: description || `Aluguel - Contrato ${contractId}`,
      administrationFeePercentage: parseFloat(administrationFeePercentage),
      ownerId,
      forceGateway
    })

    await paymentService.disconnect()

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error creating boleto:', error)
    return NextResponse.json({
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId é obrigatório' }, { status: 400 })
    }

    const paymentService = new UnifiedPaymentService()
    const paymentDetails = await paymentService.getPaymentDetails(paymentId)
    await paymentService.disconnect()

    return NextResponse.json({
      success: true,
      data: paymentDetails
    })

  } catch (error) {
    console.error('Error getting payment details:', error)
    return NextResponse.json({
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}