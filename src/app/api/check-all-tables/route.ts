import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando todas as tabelas do banco...')
    
    const results = {
      timestamp: new Date().toISOString(),
      database_connected: false,
      existing_tables: [],
      prisma_models: [],
      missing_tables: [],
      schema_status: 'unknown'
    }
    
    // Teste de conexão
    try {
      await prisma.$queryRaw`SELECT 1`
      results.database_connected = true
    } catch (error) {
      return NextResponse.json({
        error: 'Conexão com banco falhou',
        details: error.message,
        ...results
      }, { status: 500 })
    }
    
    // Listar tabelas existentes no banco
    try {
      const tables = await prisma.$queryRaw`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `
      
      results.existing_tables = (tables as any[]).map(t => t.tablename)
      
    } catch (error) {
      results.existing_tables = ['Error querying tables: ' + error.message]
    }
    
    // Modelos que o Prisma espera
    results.prisma_models = [
      'User', 'Company', 'Owner', 'Tenant', 'Property', 
      'Contract', 'Payment', 'Lead', 'CapturedLead',
      'PartnershipNotification', 'MarketAnalysis', 
      'ScrapingJob', 'AIAssistant', 'AIConversation',
      'NFSe', 'DimobCommission', 'DimobDeduction', 'Recibo'
    ]
    
    // Verificar tabelas faltando
    const existingLower = results.existing_tables.map(t => t.toLowerCase())
    results.missing_tables = results.prisma_models.filter(model => 
      !existingLower.includes(model.toLowerCase())
    )
    
    // Status geral
    if (results.missing_tables.length === 0) {
      results.schema_status = '✅ All tables exist'
    } else if (results.missing_tables.length < 5) {
      results.schema_status = '⚠️ Some tables missing'
    } else {
      results.schema_status = '❌ Major schema issues - needs full migration'
    }
    
    // Diagnóstico específico
    const hasCoreEntities = ['user', 'owner', 'property', 'tenant', 'contract'].every(
      table => existingLower.includes(table)
    )
    
    return NextResponse.json({
      success: results.database_connected,
      core_entities_exist: hasCoreEntities,
      needs_full_migration: !hasCoreEntities,
      recommended_action: !hasCoreEntities ? 
        'EXECUTE: npx prisma db push (full schema migration needed)' : 
        'Schema mostly OK, minor fixes needed',
      ...results
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Critical error checking tables',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}