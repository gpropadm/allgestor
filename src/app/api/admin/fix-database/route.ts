import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🗄️ FORÇANDO CRIAÇÃO DA TABELA RECIBOS...')

    // Importar Prisma dinamicamente para evitar problemas de cache
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    // SQL simples e direto
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS "recibos" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "contractId" TEXT NOT NULL,
        "paymentId" TEXT NOT NULL UNIQUE,
        "numeroRecibo" TEXT NOT NULL,
        "competencia" TIMESTAMP NOT NULL,
        "dataPagamento" TIMESTAMP NOT NULL,
        "valorTotal" DECIMAL(10,2) NOT NULL,
        "taxaAdministracao" DECIMAL(10,2) NOT NULL,
        "percentualTaxa" DECIMAL(5,2) NOT NULL,
        "valorRepassado" DECIMAL(10,2) NOT NULL,
        "pdfUrl" TEXT,
        "proprietarioNome" TEXT NOT NULL,
        "proprietarioDoc" TEXT NOT NULL,
        "inquilinoNome" TEXT NOT NULL,
        "inquilinoDoc" TEXT NOT NULL,
        "imovelEndereco" TEXT NOT NULL,
        "observacoes" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `

    await prisma.$executeRawUnsafe(createTableSQL)
    console.log('✅ Tabela recibos criada!')

    // Adicionar índices básicos
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "recibos_userId_idx" ON "recibos"("userId");`)
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "recibos_contractId_idx" ON "recibos"("contractId");`)
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "recibos_numeroRecibo_idx" ON "recibos"("numeroRecibo");`)
      console.log('✅ Índices criados!')
    } catch (e) {
      console.log('⚠️ Índices já existem ou erro:', e)
    }

    // Adicionar campo inscricaoMunicipal se não existir
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "inscricaoMunicipal" TEXT;`)
      console.log('✅ Campo inscricaoMunicipal adicionado!')
    } catch (e) {
      console.log('⚠️ Campo já existe:', e)
    }

    await prisma.$disconnect()

    // Testar se Prisma Client reconhece o modelo
    let prismaTest = null
    let prismaError = null
    
    try {
      const { prisma: testPrisma } = await import('@/lib/db')
      const testQuery = await testPrisma.recibo.findMany({ take: 1 })
      prismaTest = {
        success: true,
        message: 'Prisma client reconhece modelo Recibo',
        count: testQuery.length
      }
    } catch (error: any) {
      prismaError = {
        success: false,
        message: 'Prisma client não reconhece modelo Recibo',
        error: error.message
      }
    }

    return NextResponse.json({
      success: true,
      message: '🎉 BANCO CORRIGIDO! Tabela recibos criada com sucesso!',
      prismaClientTest: prismaTest || prismaError,
      instructions: [
        '1. Volte para /dashboard/recibos',
        '2. Clique em "Atualizar Lista"',
        '3. Marque um pagamento como "Pago"',
        '4. Recibo deve aparecer automaticamente'
      ],
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ ERRO:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao corrigir banco',
      details: error.message,
      possibleSolution: 'Pode ser problema de permissões no PostgreSQL ou conexão',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Também permitir POST
export async function POST(request: NextRequest) {
  return GET(request)
}