import { NextRequest, NextResponse } from 'next/server'
import { UnifiedPaymentService } from '@/lib/unified-payment-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log do webhook para debug
    console.log('Asaas Webhook received:', JSON.stringify(body, null, 2))

    const paymentService = new UnifiedPaymentService()
    
    const success = await paymentService.processWebhook({
      gateway: 'ASAAS',
      data: body
    })

    await paymentService.disconnect()

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error processing Asaas webhook:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// Endpoint para validação do webhook (alguns gateways fazem GET para verificar)
export async function GET() {
  return NextResponse.json({ 
    status: 'webhook_endpoint_active',
    gateway: 'asaas',
    timestamp: new Date().toISOString()
  })
}