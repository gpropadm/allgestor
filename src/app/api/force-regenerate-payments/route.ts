import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// API EMERGENCIAL - LIMPAR E RECRIAR TODOS OS PAGAMENTOS
export async function GET(request: NextRequest) {
  try {
    console.log('🚨 EMERGÊNCIA: FORÇANDO REGENERAÇÃO COMPLETA DE PAGAMENTOS...')
    
    // 1. DELETAR TODOS OS PAGAMENTOS EXISTENTES
    const deletedCount = await prisma.payment.deleteMany({})
    console.log(`🗑️ ${deletedCount.count} pagamentos deletados`)
    
    // 2. Buscar TODOS os contratos ativos
    const contracts = await prisma.contract.findMany({
      where: { status: 'ACTIVE' },
      include: {
        tenant: { select: { name: true } },
        property: { select: { title: true } }
      }
    })
    
    console.log(`📊 Encontrados ${contracts.length} contratos ativos`)
    
    if (contracts.length === 0) {
      return NextResponse.json({
        error: 'Nenhum contrato ativo encontrado',
        deleted: deletedCount.count
      })
    }
    
    let results = []
    let totalCreated = 0
    
    // 3. Para cada contrato, gerar pagamentos
    for (const contract of contracts) {
      try {
        console.log(`\n💰 Processando: ${contract.tenant?.name} - ${contract.property?.title}`)
        
        const startDate = new Date(contract.startDate)
        const endDate = new Date(contract.endDate)
        const dayOfMonth = startDate.getDate()
        
        // Data atual
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        
        // Primeira data de pagamento
        let paymentDate = new Date(startDate.getFullYear(), startDate.getMonth(), dayOfMonth)
        
        // Se a data é anterior ao início do contrato, usar próximo mês
        if (paymentDate < startDate) {
          paymentDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, dayOfMonth)
        }
        
        const payments = []
        let count = 0
        
        // Gerar pagamentos até o fim do contrato
        while (paymentDate <= endDate && count < 60) {
          const paymentMonth = paymentDate.getMonth()
          const paymentYear = paymentDate.getFullYear()
          
          // Status: meses passados = OVERDUE, outros = PENDING
          let status: 'PENDING' | 'OVERDUE' = 'PENDING'
          if (paymentYear < currentYear || (paymentYear === currentYear && paymentMonth < currentMonth)) {
            status = 'OVERDUE'
          }
          
          // Criar o pagamento SIMPLES (sem campos de gateway)
          const payment = await prisma.payment.create({
            data: {
              contractId: contract.id,
              amount: contract.rentAmount,
              dueDate: paymentDate,
              status: status
            }
          })
          
          payments.push(payment)
          console.log(`     ✅ ${paymentDate.toLocaleDateString('pt-BR')} - R$ ${contract.rentAmount} - ${status}`)
          
          // Próximo mês
          paymentDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, dayOfMonth)
          count++
        }
        
        totalCreated += payments.length
        results.push({
          contract: contract.tenant?.name,
          property: contract.property?.title,
          status: 'success',
          created: payments.length,
          payments: payments.map(p => ({
            date: p.dueDate.toISOString().split('T')[0],
            amount: p.amount,
            status: p.status
          }))
        })
        
        console.log(`   🎉 ${payments.length} pagamentos criados!`)
        
      } catch (error) {
        console.error(`   ❌ Erro no contrato ${contract.id}:`, error)
        results.push({
          contract: contract.tenant?.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }
    
    console.log(`\n🎉 CONCLUÍDO! ${totalCreated} pagamentos criados no total`)
    
    return NextResponse.json({
      success: true,
      message: `${totalCreated} pagamentos criados com sucesso!`,
      deletedPrevious: deletedCount.count,
      summary: {
        contractsProcessed: contracts.length,
        paymentsCreated: totalCreated,
        success: results.filter(r => r.status === 'success').length,
        errors: results.filter(r => r.status === 'error').length
      },
      results: results
    })
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

// Também permitir POST
export async function POST(request: NextRequest) {
  return GET(request)
}