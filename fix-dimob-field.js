const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addDimobField() {
  try {
    console.log('🔧 Tentando adicionar campo includeInDimob...');
    
    // Tentar adicionar o campo
    await prisma.$executeRaw`
      ALTER TABLE "contracts" 
      ADD COLUMN IF NOT EXISTS "includeInDimob" BOOLEAN DEFAULT true;
    `;
    
    console.log('✅ Campo adicionado com sucesso!');
    
    // Atualizar registros existentes
    await prisma.$executeRaw`
      UPDATE "contracts" 
      SET "includeInDimob" = true 
      WHERE "includeInDimob" IS NULL;
    `;
    
    console.log('✅ Registros atualizados!');
    
    // Verificar resultado
    const contracts = await prisma.contract.findMany({
      select: {
        id: true,
        includeInDimob: true
      },
      take: 3
    });
    
    console.log('📋 Resultado:', contracts);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addDimobField();