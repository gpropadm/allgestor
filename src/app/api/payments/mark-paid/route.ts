import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { getFinancialSettings, calculateInterestAndPenalty } from '@/lib/financial-settings'

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

  console.log('🧾 [RECIBO] Inserindo com parâmetros seguros...')

  // Verificar se já existe recibo para este pagamento
  const existingRecibo = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM recibos WHERE "paymentId" = ${payment.id}
  `
  
  if (Array.isArray(existingRecibo) && existingRecibo[0] && Number(existingRecibo[0].count) > 0) {
    console.log('🧾 [RECIBO] Já existe recibo para este pagamento')
    return null
  }

  // Inserção com parâmetros seguros
  // IMPORTANTE: Competência deve ser a data de vencimento, não a data atual
  const competenciaDate = new Date(payment.dueDate)
  
  console.log('🧾 [RECIBO] Competência:', {
    vencimento: payment.dueDate,
    competencia: competenciaDate,
    mes: competenciaDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  })
  
  await prisma.$executeRaw`
    INSERT INTO recibos (
      id, "userId", "contractId", "paymentId", "numeroRecibo", 
      competencia, "dataPagamento", "valorTotal", "taxaAdministracao", 
      "percentualTaxa", "valorRepassado", "pdfUrl", "proprietarioNome", 
      "proprietarioDoc", "inquilinoNome", "inquilinoDoc", "imovelEndereco",
      "observacoes", "createdAt", "updatedAt"
    ) VALUES (
      ${reciboId}, ${userId}, ${payment.contractId}, ${payment.id}, ${numeroRecibo},
      ${competenciaDate}, ${competenciaDate}, 
      ${valorTotal}, ${taxaAdministracao}, ${percentualTaxa}, ${valorRepassado},
      ${'/api/auto.pdf'}, ${payment.contract.property.owner.name}, 
      ${payment.contract.property.owner.document}, ${payment.contract.tenant.name}, 
      ${payment.contract.tenant.document}, ${'Endereço do imóvel'},
      ${'Recibo gerado automaticamente'}, ${now}, ${now}
    )
  `

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

    // Buscar configurações financeiras do usuário
    const paymentSettings = await getFinancialSettings(user.id)
    console.log('💰 Configurações financeiras do usuário:', paymentSettings)

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
            property: { include: { owner: true } },
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

    // Calcular multa e juros usando as configurações do usuário
    console.log('💰 Calculando multa e juros com configurações personalizadas...')
    const calculation = calculateInterestAndPenalty(
      payment.amount, 
      new Date(payment.dueDate), 
      paymentSettings, 
      includeInterest
    )
    
    console.log(`📊 Resultado do cálculo:`)
    console.log(`  - Dias de atraso: ${calculation.daysPastDue}`)
    console.log(`  - Valor original: R$ ${calculation.originalAmount.toFixed(2)}`)
    console.log(`  - Multa (${paymentSettings.penaltyRate}%): R$ ${calculation.penalty.toFixed(2)}`)
    console.log(`  - Juros (${paymentSettings.dailyInterestRate}% ao dia): R$ ${calculation.interest.toFixed(2)}`)
    console.log(`  - Carência: ${paymentSettings.gracePeriodDays} dias`)
    console.log(`  - Valor final: R$ ${calculation.finalAmount.toFixed(2)}`)
    
    const { penalty, interest, finalAmount } = calculation

    // Update payment
    console.log('💾 Atualizando pagamento no banco...')
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod: paymentMethod,
        amount: finalAmount, // Já arredondado na função
        penalty: penalty,    // Já arredondado na função
        interest: interest,  // Já arredondado na função
        receipts: receipts ? JSON.stringify(receipts) : null, // Usar apenas receipts
        notes: notes || `Pagamento via ${paymentMethod} - ${new Date().toLocaleString('pt-BR')}${penalty > 0 || interest > 0 ? ` - Multa: R$ ${penalty.toFixed(2)} - Juros: R$ ${interest.toFixed(2)}` : ''}${calculation.daysPastDue > 0 && !includeInterest ? ' - Pagamento sem juros por escolha' : ''}`
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

    // 🧾 GERAR RECIBO AUTOMATICAMENTE - VERSÃO ULTRA SIMPLES
    console.log('🧾 INICIANDO GERAÇÃO DE RECIBO...')
    let recibo = null
    
    try {
      const now = new Date()
      const numeroRecibo = `AUTO-${Date.now()}`
      const valorTotal = Number(updatedPayment.amount)
      
      console.log('🧾 Inserindo recibo simples...')
      
      await prisma.recibo.create({
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

      recibo = { numeroRecibo, valorTotal }
      console.log('✅ RECIBO CRIADO:', numeroRecibo)
      
    } catch (error: any) {
      console.error('❌ ERRO CRÍTICO AO GERAR RECIBO:', error)
      console.error('❌ Error message:', error.message)
      console.error('❌ Error stack:', error.stack)
      
      // Se já existe recibo para este pagamento, apenas continue
      if (error.code === 'P2002' && error.meta?.target?.includes('paymentId')) {
        console.log('⚠️ Recibo já existe para este pagamento')
      }
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