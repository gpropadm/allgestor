import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
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
    
    // Verificar tabelas principais
    const tables = ['Contract', 'Property', 'Owner', 'Tenant', 'Payment', 'User']
    
    for (const table of tables) {
      try {
        const count = await prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM ${table}
        `
        results.tables[table] = {
          status: '✅ OK',
          count: Number((count as any)[0].count)
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
      const contractFields = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'Contract' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `
      
      results.contract_schema = contractFields
      
      const hasContractNumber = (contractFields as any[]).some(
        field => field.column_name === 'contractNumber'
      )
      
      results.contractNumber_field = hasContractNumber ? '✅ Exists' : '❌ Missing'
      
      if (!hasContractNumber) {
        results.schema_issues.push('Campo contractNumber não existe na tabela Contract')
      }
      
    } catch (error: any) {
      results.contract_schema = 'Error checking schema'
      results.schema_issues.push(`Schema check error: ${error.message}`)
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