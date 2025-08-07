import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// API DE EMERGÊNCIA - Corrige o schema sem autenticação
export async function GET(request: NextRequest) {
  try {
    console.log('🚨 EMERGENCY FIX: Aplicando schema contractNumber...')
    
    const results = {
      timestamp: new Date().toISOString(),
      steps: [],
      success: false
    }
    
    // Verificar se já existe
    try {
      await prisma.$queryRaw`SELECT "contractNumber" FROM "Contract" LIMIT 1`
      return NextResponse.json({
        success: true,
        message: 'Campo contractNumber já existe - sistema OK!',
        ...results
      })
    } catch (error) {
      results.steps.push('❌ Campo contractNumber não existe')
    }
    
    // Aplicar fix
    try {
      // Adicionar coluna
      await prisma.$executeRaw`ALTER TABLE "Contract" ADD COLUMN "contractNumber" VARCHAR(50)`
      results.steps.push('✅ Coluna adicionada')
      
      // Criar índice
      await prisma.$executeRaw`CREATE INDEX "Contract_contractNumber_idx" ON "Contract"("contractNumber")`
      results.steps.push('✅ Índice criado')
      
      // Contar contratos
      const count = await prisma.contract.count()
      results.steps.push(`📋 ${count} contratos encontrados`)
      
      // Migrar se houver contratos
      if (count > 0) {
        const contracts = await prisma.contract.findMany({
          select: { id: true, createdAt: true },
          orderBy: { createdAt: 'asc' }
        })
        
        for (let i = 0; i < contracts.length; i++) {
          const contract = contracts[i]
          const year = new Date(contract.createdAt).getFullYear()
          const seq = String(i + 1).padStart(3, '0')
          const contractNumber = `CTR-${year}-${seq}`
          
          await prisma.$executeRaw`
            UPDATE "Contract" 
            SET "contractNumber" = ${contractNumber}
            WHERE id = ${contract.id}
          `
        }
        
        results.steps.push(`✅ ${contracts.length} contratos migrados`)
      }
      
      // Teste final
      await prisma.$queryRaw`SELECT "contractNumber" FROM "Contract" LIMIT 1`
      results.steps.push('✅ Teste final OK')
      
      results.success = true
      
      return NextResponse.json({
        success: true,
        message: 'SCHEMA APLICADO COM SUCESSO! 🎉',
        recommendation: 'Teste agora: /api/debug-db-status',
        ...results
      })
      
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        message: 'Erro ao aplicar schema',
        ...results
      }, { status: 500 })
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro crítico',
      message: error.message
    }, { status: 500 })
  }
}