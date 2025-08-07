import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔍 Verificando status do banco de dados...')
    
    const results: any = {
      timestamp: new Date().toISOString(),
      database: 'Connected',
      tables: {},
      schema_issues: []
    }
    
    // Teste básico de conexão
    try {
      await prisma.$queryRaw`SELECT 1 as test`
      results.database = 'Connected ✅'
    } catch (error: any) {
      results.database = `Connection Error: ${error.message}`
      return NextResponse.json(results, { status: 500 })
    }
    
    // Verificar tabelas principais usando Prisma methods
    const tableTests = {
      Contract: () => prisma.contract.count(),
      Property: () => prisma.property.count(), 
      Owner: () => prisma.owner.count(),
      Tenant: () => prisma.tenant.count(),
      Payment: () => prisma.payment.count(),
      User: () => prisma.user.count()
    }
    
    for (const [table, countFn] of Object.entries(tableTests)) {
      try {
        const count = await countFn()
        results.tables[table] = {
          status: '✅ OK',
          count: count
        }
      } catch (error: any) {
        results.tables[table] = {
          status: '❌ ERROR',
          error: error.message
        }
        results.schema_issues.push(`Table ${table}: ${error.message}`)
      }
    }
    
    // Verificar especificamente o campo contractNumber
    try {
      // Tentar buscar um contrato com contractNumber
      await prisma.$queryRaw`
        SELECT id, "contractNumber" 
        FROM "contracts" 
        LIMIT 1
      `
      
      results.contractNumber_field = '✅ Exists'
      results.contract_schema = 'Field exists and accessible'
      
    } catch (error: any) {
      if (error.message.includes('contractNumber') || error.message.includes('column') || error.message.includes('does not exist')) {
        results.contractNumber_field = '❌ Missing'
        results.contract_schema = 'Field does not exist in database'
        results.schema_issues.push('Campo contractNumber não existe na tabela Contract')
      } else {
        results.contractNumber_field = '⚠️ Unknown'
        results.contract_schema = `Error checking: ${error.message}`
        results.schema_issues.push(`Schema check error: ${error.message}`)
      }
    }
    
    // Verificar se há problemas de Prisma Client
    try {
      const sampleContract = await prisma.contract.findFirst({
        select: {
          id: true,
          startDate: true,
          status: true
        }
      })
      
      results.prisma_client = '✅ Working'
      results.sample_data = !!sampleContract
      
    } catch (error: any) {
      results.prisma_client = `❌ Error: ${error.message}`
      results.schema_issues.push(`Prisma Client error: ${error.message}`)
    }
    
    // Resumo final
    results.overall_status = results.schema_issues.length === 0 ? '✅ All Good' : '⚠️ Issues Found'
    results.needs_migration = results.contractNumber_field === '❌ Missing'
    
    if (results.needs_migration) {
      results.recommended_action = 'Execute: npx prisma db push'
    }
    
    return NextResponse.json(results)
    
  } catch (error: any) {
    console.error('❌ Erro crítico no debug:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Critical database error',
      message: error.message,
      timestamp: new Date().toISOString(),
      recommended_action: 'Check database connection and Prisma configuration'
    }, { status: 500 })
  }
}