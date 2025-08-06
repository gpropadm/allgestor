import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// CÓPIA EXATA DA API PRODUCTION MARK-PAID PARA TESTE
export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST PRODUCTION MARK-PAID (NO AUTH) ===')
    
    const { paymentId } = await request.json()
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID obrigatório' },
        { status: 400 }
      )
    }

    console.log('🔍 Procurando pagamento no banco...')
    
    // EXATAMENTE IGUAL À API DE PRODUÇÃO (com include corrigido)
    const payment = await prisma.payment.findFirst({
      where: { 
        id: paymentId,
        // Removendo filtro de user para teste
        contract: {
          status: 'ACTIVE'
        }
      },
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
      tenant: payment.contract.tenant.name
    })

    if (payment.status === 'PAID') {
      return NextResponse.json({ 
        error: 'Pagamento já foi marcado como pago' 
      }, { status: 400 })
    }

    // Update payment - IGUAL À API DE PRODUÇÃO
    console.log('💾 Atualizando pagamento no banco...')
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod: 'TEST_PRODUCTION',
        notes: `Teste produção automático - ${new Date().toLocaleString('pt-BR')}`
      },
      include: {
        contract: {
          include: {
            property: { include: { owner: true } },
            tenant: true
          }
        }
      }
    })

    console.log('✅ Pagamento atualizado com sucesso!')

    // 🧾 GERAR RECIBO - CÓDIGO EXATO DA API DE PRODUÇÃO
    console.log('🧾 INICIANDO GERAÇÃO DE RECIBO...')
    let recibo = null
    
    try {
      const now = new Date()
      const numeroRecibo = `PROD-TEST-${Date.now()}`
      const valorTotal = Number(updatedPayment.amount)
      
      console.log('🧾 Inserindo recibo simples...')
      
      const novoRecibo = await prisma.recibo.create({
        data: {
          userId: payment.contract.userId,
          contractId: updatedPayment.contractId,
          paymentId: updatedPayment.id,
          numeroRecibo: numeroRecibo,
          competencia: now,
          dataPagamento: now,
          valorTotal: valorTotal,
          taxaAdministracao: valorTotal * 0.1,
          percentualTaxa: 10,
          valorRepassado: valorTotal * 0.9,
          pdfUrl: '/api/auto.pdf',
          proprietarioNome: payment.contract.property.owner?.name || 'Proprietário',
          proprietarioDoc: payment.contract.property.owner?.document || '000.000.000-00',
          inquilinoNome: payment.contract.tenant?.name || 'Inquilino',
          inquilinoDoc: payment.contract.tenant?.document || '000.000.000-00',
          imovelEndereco: payment.contract.property?.address || 'Endereço',
          observacoes: 'Recibo automático'
        }
      })

      recibo = { 
        id: novoRecibo.id.toString(),
        numeroRecibo, 
        valorTotal 
      }
      console.log('✅ RECIBO CRIADO:', numeroRecibo)
      
    } catch (error: any) {
      console.error('❌ ERRO CRÍTICO AO GERAR RECIBO:', error)
      console.error('❌ Error message:', error.message)
      console.error('❌ Error stack:', error.stack)
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
        ? `✅ Pagamento marcado como pago e recibo ${recibo.numeroRecibo} gerado com CÓDIGO DE PRODUÇÃO!` 
        : '⚠️ Pagamento marcado como pago, mas recibo falhou'
    })

  } catch (error) {
    console.error('❌ Erro na API test-production-mark-paid:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro no teste de produção',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\\n').slice(0, 5) : []
    }, { status: 500 })
  }
}