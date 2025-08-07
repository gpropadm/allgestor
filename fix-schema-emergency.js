/**
 * SCRIPT DE EMERGÊNCIA: Aplicar schema contractNumber
 * Execute com: node fix-schema-emergency.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function applySchemaFix() {
  try {
    console.log('🚨 EMERGENCY FIX: Aplicando schema contractNumber...')
    
    // Verificar se o campo já existe
    try {
      await prisma.$queryRaw`SELECT "contractNumber" FROM "Contract" LIMIT 1`
      console.log('✅ Campo contractNumber já existe!')
      return
    } catch (error) {
      console.log('⚠️ Campo contractNumber não existe, aplicando...')
    }
    
    // Passo 1: Adicionar coluna
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Contract" 
        ADD COLUMN "contractNumber" VARCHAR(50)
      `
      console.log('✅ Coluna contractNumber adicionada')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Coluna já existia')
      } else {
        throw error
      }
    }
    
    // Passo 2: Criar índice
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "Contract_contractNumber_idx" 
        ON "Contract"("contractNumber")
      `
      console.log('✅ Índice criado')
    } catch (error) {
      console.log('⚠️ Erro no índice (não crítico):', error.message)
    }
    
    // Passo 3: Migrar contratos existentes
    const contracts = await prisma.contract.findMany({
      select: {
        id: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    
    console.log(`📋 Migrando ${contracts.length} contratos...`)
    
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
      
      console.log(`✅ ${contract.id} → ${contractNumber}`)
    }
    
    // Passo 4: Verificar
    const testResult = await prisma.$queryRaw`
      SELECT id, "contractNumber" FROM "Contract" LIMIT 1
    `
    
    console.log('🎉 SUCESSO! Schema aplicado e testado!')
    console.log('📋 Teste:', testResult)
    
  } catch (error) {
    console.error('❌ ERRO:', error)
  } finally {
    await prisma.$disconnect()
  }
}

applySchemaFix()