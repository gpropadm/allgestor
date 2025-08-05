import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🗄️ Aplicando migration da tabela recibos...')

    // Verificar se tabela já existe
    const tableExists = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'recibos';
    `

    if (Array.isArray(tableExists) && tableExists.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Tabela recibos já existe',
        tableExists: true
      })
    }

    console.log('📝 Criando tabela recibos...')

    // Executar SQL da migration
    await prisma.$executeRaw`
      CREATE TABLE "recibos" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "contractId" TEXT NOT NULL,
        "paymentId" TEXT NOT NULL,
        "numeroRecibo" TEXT NOT NULL,
        "competencia" TIMESTAMP(3) NOT NULL,
        "dataPagamento" TIMESTAMP(3) NOT NULL,
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
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "recibos_pkey" PRIMARY KEY ("id")
      );
    `

    console.log('🔗 Criando índices...')

    await prisma.$executeRaw`
      CREATE UNIQUE INDEX "recibos_paymentId_key" ON "recibos"("paymentId");
    `

    await prisma.$executeRaw`
      CREATE INDEX "recibos_userId_idx" ON "recibos"("userId");
    `

    await prisma.$executeRaw`
      CREATE INDEX "recibos_contractId_idx" ON "recibos"("contractId");
    `

    await prisma.$executeRaw`
      CREATE INDEX "recibos_competencia_idx" ON "recibos"("competencia");
    `

    await prisma.$executeRaw`
      CREATE INDEX "recibos_numeroRecibo_idx" ON "recibos"("numeroRecibo");
    `

    console.log('🔗 Criando foreign keys...')

    await prisma.$executeRaw`
      ALTER TABLE "recibos" ADD CONSTRAINT "recibos_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    `

    await prisma.$executeRaw`
      ALTER TABLE "recibos" ADD CONSTRAINT "recibos_contractId_fkey" 
      FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    `

    await prisma.$executeRaw`
      ALTER TABLE "recibos" ADD CONSTRAINT "recibos_paymentId_fkey" 
      FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    `

    console.log('🏢 Adicionando campo inscricaoMunicipal se não existir...')

    try {
      await prisma.$executeRaw`
        ALTER TABLE "companies" ADD COLUMN "inscricaoMunicipal" TEXT;
      `
    } catch (error) {
      // Coluna já existe, ignorar erro
      console.log('Campo inscricaoMunicipal já existe')
    }

    console.log('✅ Migration concluída com sucesso!')

    return NextResponse.json({
      success: true,
      message: 'Tabela recibos criada com sucesso!',
      tableCreated: true,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erro na migration:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao criar tabela recibos',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}