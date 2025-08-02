const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_OVERRIDE || process.env.DATABASE_URL
    }
  }
})

async function clearData() {
  try {
    console.log('🧹 Limpando dados existentes...')
    
    // Delete in correct order due to foreign key constraints
    await prisma.expense.deleteMany()
    await prisma.lead.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.contract.deleteMany()
    await prisma.property.deleteMany()
    await prisma.tenant.deleteMany()
    await prisma.owner.deleteMany()
    
    console.log('✅ Dados limpos com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearData()