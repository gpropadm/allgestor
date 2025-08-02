import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 PJBank Webhook received')
    
    const data = await request.json()
    console.log('📋 Webhook data:', data)
    
    // PJBank envia notificações com esses campos principais:
    // - id_unico: ID único do boleto
    // - status: Status do pagamento (paid, canceled, etc)
    // - valor: Valor do pagamento
    // - data_pagamento: Data do pagamento
    
    const {
      id_unico,
      status,
      valor,
      data_pagamento,
      forma_pagamento,
      linha_digitavel
    } = data
    
    console.log('💰 Payment notification:', {
      id: id_unico,
      status,
      amount: valor,
      date: data_pagamento
    })
    
    // Buscar o pagamento no banco pelo ID externo
    const payment = await prisma.payment.findFirst({
      where: {
        gatewayPaymentId: id_unico
      },
      include: {
        contract: {
          include: {
            tenant: true,
            property: true
          }
        }
      }
    })
    
    if (!payment) {
      console.warn('⚠️ Payment not found for webhook:', id_unico)
      return NextResponse.json({ 
        success: false, 
        message: 'Payment not found' 
      }, { status: 404 })
    }
    
    // Atualizar status do pagamento baseado no webhook
    let newStatus = payment.status
    let paidDate = payment.paidDate
    
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'liquidado':
        newStatus = 'PAID'
        paidDate = data_pagamento ? new Date(data_pagamento) : new Date()
        break
      case 'canceled':
      case 'cancelado':
        newStatus = 'CANCELLED'
        break
      case 'expired':
      case 'vencido':
        newStatus = 'OVERDUE'
        break
      default:
        console.log('📝 Status not mapped:', status)
    }
    
    // Atualizar pagamento no banco
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paidDate: paidDate,
        paymentMethod: forma_pagamento || payment.paymentMethod,
        webhookReceived: true,
        lastWebhookAt: new Date(),
        // Atualizar dados do gateway
        gatewayPaymentId: id_unico,
        boletoCode: linha_digitavel || payment.boletoCode
      }
    })
    
    console.log('✅ Payment updated:', {
      id: updatedPayment.id,
      status: newStatus,
      paidDate: paidDate
    })
    
    // TODO: Enviar notificação para o inquilino/proprietário
    // TODO: Gerar recibo automático
    // TODO: Atualizar dashboard em tempo real
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      payment_id: payment.id,
      new_status: newStatus
    })
    
  } catch (error) {
    console.error('❌ PJBank webhook error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Método GET para verificação do webhook
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'PJBank webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}