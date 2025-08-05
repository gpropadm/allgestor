import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

// Função helper para gerar recibo - VERSAO SIMPLIFICADA
async function gerarReciboParaPagamento(paymentId: string, userId: string) {
  console.log('🧾 [RECIBO] Iniciando geração SIMPLES para payment:', paymentId)
  
  // Buscar o pagamento
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

  if (!payment || payment.status !== 'PAID') {
    console.log('🧾 [RECIBO] Payment não encontrado ou não PAID')
    return null
  }

  console.log('🧾 [RECIBO] Payment OK, criando recibo...')

  // Dados simples
  const now = new Date()
  const reciboId = `recibo_${Date.now()}_auto`
  const numeroRecibo = `AUTO-${Date.now()}`
  
  // Valores fixos por enquanto (depois podemos calcular)
  const valorTotal = Number(payment.amount)
  const percentualTaxa = 10
  const taxaAdministracao = valorTotal * 0.1
  const valorRepassado = valorTotal - taxaAdministracao

  console.log('🧾 [RECIBO] Inserindo diretamente...')

  // Inserção direta igual ao endpoint que funcionou
  await prisma.$executeRawUnsafe(`
    INSERT INTO recibos (
      id, "userId", "contractId", "paymentId", "numeroRecibo", 
      competencia, "dataPagamento", "valorTotal", "taxaAdministracao", 
      "percentualTaxa", "valorRepassado", "pdfUrl", "proprietarioNome", 
      "proprietarioDoc", "inquilinoNome", "inquilinoDoc", "imovelEndereco",
      "observacoes", "createdAt", "updatedAt"
    ) VALUES (
      '${reciboId}', '${userId}', '${payment.contractId}', '${payment.id}', '${numeroRecibo}',
      '${now.toISOString()}', '${now.toISOString()}', 
      ${valorTotal}, ${taxaAdministracao}, ${percentualTaxa}, ${valorRepassado},
      '/api/auto.pdf', '${payment.contract.property.owner.name}', 
      '${payment.contract.property.owner.document}', '${payment.contract.tenant.name}', 
      '${payment.contract.tenant.document}', 'Endereco Auto',
      'Recibo gerado automaticamente', '${now.toISOString()}', '${now.toISOString()}'
    )
  `)

  console.log('🧾 [RECIBO] ✅ Recibo auto criado!')

  return {
    id: reciboId,
    numeroRecibo,
    valorTotal,
    taxaAdministracao
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== MARK-PAID API CALLED ===')
    
    // Verificar autenticação
    const user = await requireAuth(request)
    console.log('👤 Usuário autenticado:', user.email)
    
    const { paymentId, paymentMethod, receipts, notes, includeInterest = true } = await request.json()
    
    // Extrair URL do comprovante
    const receiptUrl = receipts && receipts[0] ? receipts[0].url : null
    
    console.log('Payment ID:', paymentId)
    console.log('Payment Method:', paymentMethod)
    console.log('Include Interest:', includeInterest)
    console.log('📎 Receipt URL:', receiptUrl)
    console.log('📎 Receipts data:', receipts)
    
    if (!paymentId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Payment ID e método de pagamento são obrigatórios' },
        { status: 400 }
      )
    }

    // Configurações de multa e juros (mesmo que o frontend)
    const paymentSettings = {
      penaltyRate: 2.0,          // 2% padrão
      dailyInterestRate: 0.033,  // 0.033% ao dia padrão
      gracePeriodDays: 0,        // sem carência padrão
      maxInterestDays: 365       // máximo 1 ano padrão
    }

    // Find the payment and verify ownership (only active contracts)
    console.log('🔍 Procurando pagamento no banco...')
    const payment = await prisma.payment.findFirst({
      where: { 
        id: paymentId,
        contract: {
          userId: user.id,
          status: 'ACTIVE'
        }
      },
      include: {
        contract: {
          include: {
            property: true,
            tenant: true
          }
        }
      }
    })

    if (!payment) {
      console.log('❌ Pagamento não encontrado ou não pertence ao usuário:', paymentId)
      return NextResponse.json({ 
        error: 'Pagamento não encontrado ou acesso negado',
        paymentId,
        debug: {
          userId: user.id,
          searchedPaymentId: paymentId
        }
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

    // Calcular multa e juros se o pagamento está atrasado
    console.log('💰 Calculando multa e juros...')
    const dueDate = new Date(payment.dueDate)
    const currentDate = new Date()
    const daysPastDue = Math.max(0, Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
    
    let finalAmount = payment.amount
    let penalty = 0
    let interest = 0
    
    if (daysPastDue > 0 && includeInterest) {
      // Aplicar período de carência
      const effectiveDays = Math.max(0, daysPastDue - paymentSettings.gracePeriodDays)
      
      if (effectiveDays > 0) {
        // Calcular multa e juros
        penalty = payment.amount * (paymentSettings.penaltyRate / 100)
        const daysForInterest = Math.min(effectiveDays, paymentSettings.maxInterestDays)
        interest = payment.amount * (paymentSettings.dailyInterestRate / 100) * daysForInterest
        finalAmount = payment.amount + penalty + interest
        
        console.log(`📊 Pagamento em atraso: ${daysPastDue} dias (COM juros)`)
        console.log(`💸 Multa: R$ ${penalty.toFixed(2)}`)
        console.log(`💸 Juros: R$ ${interest.toFixed(2)}`)
        console.log(`💰 Valor final: R$ ${finalAmount.toFixed(2)}`)
        console.log(`🔢 Valores arredondados: Amount=${Math.round(finalAmount * 100) / 100}, Penalty=${Math.round(penalty * 100) / 100}, Interest=${Math.round(interest * 100) / 100}`)
      }
    } else if (daysPastDue > 0 && !includeInterest) {
      console.log(`📊 Pagamento em atraso: ${daysPastDue} dias (SEM juros - por escolha do usuário)`)
      console.log(`💰 Valor registrado: R$ ${finalAmount.toFixed(2)} (apenas valor original)`)
    } else {
      console.log('✅ Pagamento em dia, sem multa ou juros')
    }

    // Update payment
    console.log('💾 Atualizando pagamento no banco...')
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod: paymentMethod,
        amount: Math.round(finalAmount * 100) / 100, // Atualizar com valor total
        penalty: Math.round(penalty * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        receipts: receipts ? JSON.stringify(receipts) : null, // Usar apenas receipts
        notes: notes || `Pagamento via ${paymentMethod} - ${new Date().toLocaleString('pt-BR')}${penalty > 0 || interest > 0 ? ` - Multa: R$ ${penalty.toFixed(2)} - Juros: R$ ${interest.toFixed(2)}` : ''}${daysPastDue > 0 && !includeInterest ? ' - Pagamento sem juros por escolha' : ''}`
      },
      include: {
        contract: {
          include: {
            property: true,
            tenant: true
          }
        }
      }
    })

    console.log('✅ Pagamento atualizado com sucesso!')
    console.log('🔄 Dados retornados para o frontend:')
    console.log(`  - ID: ${updatedPayment.id}`)
    console.log(`  - Amount: ${updatedPayment.amount}`)
    console.log(`  - Penalty: ${updatedPayment.penalty}`)
    console.log(`  - Interest: ${updatedPayment.interest}`)
    console.log(`  - Status: ${updatedPayment.status}`)

    // 🧾 GERAR RECIBO AUTOMATICAMENTE
    console.log('🧾 Gerando recibo automaticamente...')
    let recibo = null
    
    try {
      // Gerar recibo diretamente (sem fetch interno)
      recibo = await gerarReciboParaPagamento(updatedPayment.id, user.id)
      console.log('✅ Recibo gerado com sucesso:', recibo?.numeroRecibo)
    } catch (error: any) {
      console.error('❌ ERRO DETALHADO AO GERAR RECIBO:', error)
      console.error('❌ Error message:', error.message)
      console.error('❌ Error stack:', error.stack)
      // Não falhar o pagamento por causa do recibo
    }

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      recibo: recibo,
      message: recibo 
        ? `Pagamento marcado como pago e recibo ${recibo.numeroRecibo} gerado com sucesso` 
        : 'Pagamento marcado como pago com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro na API mark-paid:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}