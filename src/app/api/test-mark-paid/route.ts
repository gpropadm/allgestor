import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST MARK-PAID API (NO AUTH) ===')
    
    const { paymentId } = await request.json()
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID obrigatório para teste' },
        { status: 400 }
      )
    }

    console.log('🔍 Procurando pagamento:', paymentId)
    
    // Buscar o pagamento sem filtro de userId para teste
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        contract: {
          include: {
            property: { include: { owner: true } },
            tenant: true
          }
        }
      }
    })

    if (!payment) {
      console.log('❌ Pagamento não encontrado:', paymentId)
      return NextResponse.json({ 
        error: 'Pagamento não encontrado',
        paymentId
      }, { status: 404 })
    }

    console.log('✅ Pagamento encontrado:', {
      id: payment.id,
      status: payment.status,
      amount: payment.amount
    })

    if (payment.status === 'PAID') {
      return NextResponse.json({ 
        error: 'Pagamento já foi marcado como pago' 
      }, { status: 400 })
    }

    // Atualizar o pagamento para PAID
    console.log('💾 Marcando como pago...')
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod: 'TEST',
        notes: `Teste automático - ${new Date().toLocaleString('pt-BR')}`
      }
    })

    console.log('✅ Pagamento marcado como PAID!')

    // 🧾 GERAR RECIBO AUTOMATICAMENTE
    console.log('🧾 INICIANDO GERAÇÃO DE RECIBO DE TESTE...')
    let recibo = null
    
    try {
      const now = new Date()
      const numeroRecibo = `TEST-${Date.now()}`
      const valorTotal = Number(updatedPayment.amount)
      
      console.log('🧾 Criando recibo com Prisma.recibo.create()...')
      
      const novoRecibo = await prisma.recibo.create({
        data: {
          userId: payment.contract.userId, // Usar userId do contrato
          contractId: payment.contractId,
          paymentId: payment.id,
          numeroRecibo: numeroRecibo,
          competencia: now,
          dataPagamento: now,
          valorTotal: valorTotal,
          taxaAdministracao: valorTotal * 0.1,
          percentualTaxa: 10,
          valorRepassado: valorTotal * 0.9,
          pdfUrl: '/api/test.pdf',
          proprietarioNome: payment.contract.property.owner.name || 'Proprietário Teste',
          proprietarioDoc: payment.contract.property.owner.document || '000.000.000-00',
          inquilinoNome: payment.contract.tenant.name || 'Inquilino Teste',
          inquilinoDoc: payment.contract.tenant.document || '000.000.000-00',
          imovelEndereco: 'Endereço de Teste',
          observacoes: 'Recibo de teste automático'
        }
      })

      recibo = { 
        id: novoRecibo.id.toString(),
        numeroRecibo: novoRecibo.numeroRecibo, 
        valorTotal: novoRecibo.valorTotal 
      }
      console.log('✅ RECIBO TESTE CRIADO:', numeroRecibo)
      
    } catch (reciboError: any) {
      console.error('❌ ERRO AO GERAR RECIBO:', reciboError)
      console.error('❌ Error message:', reciboError.message)
      console.error('❌ Error code:', reciboError.code)
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        amount: updatedPayment.amount,
        paidDate: updatedPayment.paidDate
      },
      recibo: recibo,
      message: recibo 
        ? `✅ Pagamento marcado como pago e recibo ${recibo.numeroRecibo} gerado!` 
        : '⚠️ Pagamento marcado como pago, mas recibo falhou'
    })

  } catch (error) {
    console.error('❌ Erro na API test-mark-paid:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro no teste',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\\n').slice(0, 5) : []
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('=== TEST MARK-PAID INFO ===')
    
    // Buscar pagamentos pendentes para teste
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING'
      },
      take: 5,
      include: {
        contract: {
          include: {
            property: true,
            tenant: true
          }
        }
      }
    })

    console.log('📋 Pagamentos pendentes encontrados:', pendingPayments.length)

    return NextResponse.json({
      success: true,
      pendingPayments: pendingPayments.map(p => ({
        id: p.id,
        amount: p.amount,
        dueDate: p.dueDate,
        tenant: p.contract.tenant.name,
        status: p.status
      })),
      message: `Encontrados ${pendingPayments.length} pagamentos para teste`
    })

  } catch (error) {
    console.error('❌ Erro ao listar pagamentos:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao listar pagamentos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}