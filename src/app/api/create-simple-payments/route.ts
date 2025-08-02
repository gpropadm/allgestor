import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// API ULTRA SIMPLES QUE USA SQL RAW PARA CRIAR PAGAMENTOS
export async function GET(request: NextRequest) {
  try {
    console.log('🚨 CRIANDO PAGAMENTOS COM SQL RAW...')
    
    // 1. Buscar contratos ativos
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
        error: 'Nenhum contrato ativo encontrado'
      })
    }
    
    let results = []
    let totalCreated = 0
    
    // 2. Para cada contrato
    for (const contract of contracts) {
      try {
        console.log(`\n💰 Processando: ${contract.tenant?.name}`)
        
        // Verificar pagamentos existentes via SQL RAW
        const existingResult = await prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM payments 
          WHERE "contractId" = ${contract.id}
        `
        
        const existingCount = Number((existingResult as any)[0]?.count || 0)
        
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
        
        // Gerar apenas 12 pagamentos (1 ano) usando SQL RAW
        const startDate = new Date(contract.startDate)
        let paymentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        
        // Se a data é anterior ao início do contrato, usar próximo mês
        if (paymentDate < startDate) {
          paymentDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, paymentDate.getDate())
        }
        
        let paymentsCreated = 0
        
        for (let i = 0; i < 12; i++) {
          const currentMonth = new Date().getMonth()
          const currentYear = new Date().getFullYear()
          const paymentMonth = paymentDate.getMonth()
          const paymentYear = paymentDate.getFullYear()
          
          // Status baseado na data
          let status = 'PENDING'
          if (paymentYear < currentYear || (paymentYear === currentYear && paymentMonth < currentMonth)) {
            status = 'OVERDUE'
          }
          
          // Criar via SQL RAW
          await prisma.$executeRaw`
            INSERT INTO payments (
              id, 
              "contractId", 
              amount, 
              "dueDate", 
              status,
              "createdAt",
              "updatedAt"
            ) VALUES (
              gen_random_uuid(),
              ${contract.id},
              ${contract.rentAmount},
              ${paymentDate.toISOString()},
              ${status},
              NOW(),
              NOW()
            )
          `
          
          console.log(`     ✅ ${paymentDate.toLocaleDateString('pt-BR')} - R$ ${contract.rentAmount} - ${status}`)
          
          paymentsCreated++
          
          // Próximo mês
          paymentDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, paymentDate.getDate())
        }
        
        totalCreated += paymentsCreated
        results.push({
          contract: contract.tenant?.name,
          property: contract.property?.title,
          status: 'success',
          created: paymentsCreated
        })
        
        console.log(`   🎉 ${paymentsCreated} pagamentos criados!`)
        
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
      message: `${totalCreated} pagamentos criados com sucesso usando SQL RAW!`,
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