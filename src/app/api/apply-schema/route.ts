import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log('🚀 Aplicando schema contractNumber no banco...')
    
    // Verificar se o campo já existe
    try {
      await prisma.$queryRaw`SELECT "contractNumber" FROM "Contract" LIMIT 1`
      return NextResponse.json({
        success: true,
        message: 'Campo contractNumber já existe no banco',
        action: 'none'
      })
    } catch (error: any) {
      console.log('Campo contractNumber não existe, criando...')
    }
    
    // Aplicar mudanças no schema
    try {
      // Adicionar coluna contractNumber
      await prisma.$executeRaw`
        ALTER TABLE "Contract" 
        ADD COLUMN "contractNumber" VARCHAR(50)
      `
      
      console.log('✅ Coluna contractNumber adicionada')
      
      // Criar índice
      await prisma.$executeRaw`
        CREATE INDEX "Contract_contractNumber_idx" 
        ON "Contract"("contractNumber")
      `
      
      console.log('✅ Índice criado')
      
      // Gerar números para contratos existentes
      const existingContracts = await prisma.contract.findMany({
        where: {
          userId: user.id
        },
        select: {
          id: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      })
      
      console.log(`📋 Encontrados ${existingContracts.length} contratos para migrar`)
      
      // Gerar números sequenciais
      for (let i = 0; i < existingContracts.length; i++) {
        const contract = existingContracts[i]
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
      
      return NextResponse.json({
        success: true,
        message: 'Schema aplicado com sucesso!',
        actions: [
          'Campo contractNumber criado',
          'Índice criado',
          `${existingContracts.length} contratos migrados`
        ],
        migratedContracts: existingContracts.length
      })
      
    } catch (error: any) {
      console.error('❌ Erro ao aplicar schema:', error)
      
      return NextResponse.json({
        success: false,
        error: 'Erro ao aplicar schema',
        message: error.message,
        recommendation: 'Execute manualmente: npx prisma db push'
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('❌ Erro na aplicação do schema:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro na aplicação do schema',
      message: error.message
    }, { status: 500 })
  }
}