import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// API SIMPLES QUE SEMPRE FUNCIONA - SEM AUTENTICAÇÃO PARA TESTE
export async function GET(request: NextRequest) {
  try {
    console.log('🚨 EMERGÊNCIA: FORÇANDO GERAÇÃO DE PAGAMENTOS...')
    
    // 1. Buscar TODOS os contratos ativos (sem filtro de usuário)
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
        debug: 'Verifique se existem contratos com status ACTIVE no banco'
      })
    }
    
    let results = []
    let totalCreated = 0
    
    // 2. Para cada contrato, gerar pagamentos
    for (const contract of contracts) {
      try {
        console.log(`\n💰 Processando: ${contract.tenant?.name} - ${contract.property?.title}`)
        
        // Verificar se já tem pagamentos
        const existingCount = await prisma.payment.count({
          where: { contractId: contract.id }
        })
        
        if (existingCount > 0) {
          console.log(`   ⚠️ Já tem ${existingCount} pagamentos - PULANDO`)
          results.push({
            contract: contract.tenant?.name,
            status: 'skipped',
            reason: `Já tem ${existingCount} pagamentos`,
            created: 0
          })
          continue
        }
        
        // GERAR PAGAMENTOS DE FORMA SIMPLES
        console.log(`   🎯 Gerando pagamentos...`)
        
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
          
          // Criar o pagamento com campos que existem no banco
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
      summary: {
        contractsProcessed: contracts.length,
        paymentsCreated: totalCreated,
        success: results.filter(r => r.status === 'success').length,
        skipped: results.filter(r => r.status === 'skipped').length,
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