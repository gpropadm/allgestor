import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log('🔄 Iniciando migração de números de contrato para user:', user.id)
    
    // Verificar se o campo contractNumber existe
    try {
      await prisma.$queryRaw`SELECT "contractNumber" FROM "Contract" LIMIT 1`
    } catch (error: any) {
      if (error.message?.includes('contractNumber')) {
        return NextResponse.json({
          error: 'Campo contractNumber não existe no banco',
          message: 'Execute primeiro: npx prisma db push',
          needsSchemaUpdate: true
        }, { status: 500 })
      }
      throw error
    }
    
    // Buscar contratos do usuário sem contractNumber
    const contractsToMigrate = await prisma.$queryRaw`
      SELECT id, "createdAt"
      FROM "Contract" 
      WHERE "userId" = ${user.id}
        AND ("contractNumber" IS NULL OR "contractNumber" = '')
      ORDER BY "createdAt" ASC
    ` as Array<{
      id: string
      createdAt: Date
    }>
    
    console.log(`📋 Encontrados ${contractsToMigrate.length} contratos para migrar`)
    
    if (contractsToMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todos os contratos já possuem números amigáveis',
        migratedCount: 0
      })
    }
    
    // Agrupar por ano
    const contractsByYear: Record<string, Array<{id: string, createdAt: Date}>> = {}
    
    contractsToMigrate.forEach(contract => {
      const year = new Date(contract.createdAt).getFullYear().toString()
      if (!contractsByYear[year]) {
        contractsByYear[year] = []
      }
      contractsByYear[year].push(contract)
    })
    
    let totalMigrated = 0
    const results = []
    
    // Migrar por ano
    for (const [year, contracts] of Object.entries(contractsByYear)) {
      // Verificar último número usado neste ano para este usuário
      const lastContract = await prisma.$queryRaw`
        SELECT "contractNumber"
        FROM "Contract"
        WHERE "userId" = ${user.id}
          AND "contractNumber" LIKE ${'CTR-' + year + '-%'}
        ORDER BY "contractNumber" DESC
        LIMIT 1
      ` as Array<{contractNumber: string}>
      
      let nextSeq = 1
      if (lastContract.length > 0) {
        const match = lastContract[0].contractNumber.match(/CTR-\d{4}-(\d+)/)
        nextSeq = match ? parseInt(match[1]) + 1 : 1
      }
      
      // Migrar contratos do ano
      for (const contract of contracts) {
        const contractNumber = `CTR-${year}-${String(nextSeq).padStart(3, '0')}`
        
        await prisma.$executeRaw`
          UPDATE "Contract" 
          SET "contractNumber" = ${contractNumber}
          WHERE id = ${contract.id}
        `
        
        results.push({
          contractId: contract.id,
          contractNumber: contractNumber,
          year: year,
          sequence: nextSeq
        })
        
        console.log(`✅ ${contract.id} → ${contractNumber}`)
        nextSeq++
        totalMigrated++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Migração concluída com sucesso!`,
      migratedCount: totalMigrated,
      results: results
    })
    
  } catch (error: any) {
    console.error('❌ Erro na migração:', error)
    return NextResponse.json({
      error: 'Erro na migração de contratos',
      details: error.message
    }, { status: 500 })
  }
}