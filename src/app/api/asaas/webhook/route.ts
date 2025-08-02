// Webhook para receber notificações do ASAAS sobre pagamentos
// Endpoint: POST /api/asaas/webhook

import { NextRequest, NextResponse } from 'next/server'
import { PaymentSplitService } from '@/lib/payment-split-service'

export async function POST(request: NextRequest) {
  try {
    console.log('Webhook ASAAS recebido')
    
    const webhookData = await request.json()
    
    console.log('Dados do webhook:', {
      event: webhookData.event,
      paymentId: webhookData.payment?.id,
      externalReference: webhookData.payment?.externalReference,
      status: webhookData.payment?.status
    })

    // Validar estrutura do webhook
    if (!webhookData.event || !webhookData.payment) {
      console.error('Webhook inválido - faltam dados obrigatórios')
      return NextResponse.json(
        { error: 'Dados do webhook inválidos' },
        { status: 400 }
      )
    }

    // Buscar contrato para identificar a empresa
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { asaasPaymentId: webhookData.payment.id },
          { contractId: webhookData.payment.externalReference }
        ]
      },
      include: {
        contract: {
          include: {
            company: true
          }
        }
      }
    })

    if (!payment) {
      console.warn('Pagamento não encontrado para webhook:', {
        asaasPaymentId: webhookData.payment.id,
        externalReference: webhookData.payment.externalReference
      })
      // Retornar sucesso mesmo assim para evitar reenvios
      return NextResponse.json({ success: true, message: 'Pagamento não encontrado, mas webhook processado' })
    }

    const companyId = payment.contract.companyId

    // Processar webhook
    const splitService = new PaymentSplitService()
    const result = await splitService.processAsaasWebhook(webhookData, companyId)

    await prisma.$disconnect()

    console.log('Resultado do processamento:', result)

    return NextResponse.json({
      success: result.success,
      paymentUpdated: result.paymentUpdated,
      message: result.message
    })
  } catch (error) {
    console.error('Erro ao processar webhook ASAAS:', error)
    
    // Retornar sucesso para evitar reenvios do ASAAS
    return NextResponse.json({
      success: false,
      error: 'Erro interno, mas webhook recebido',
      message: error.message
    })
  }
}

// Endpoint para teste de webhook (desenvolvimento)
export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de webhook ASAAS ativo',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}