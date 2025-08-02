const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_OVERRIDE || process.env.DATABASE_URL
    }
  }
})

async function getIds() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'admin@crmia.com' },
      include: { company: true }
    })
    
    console.log('👤 User ID:', user.id)
    console.log('🏢 Company ID:', user.companyId)
    console.log('🏢 Company Name:', user.company.name)
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getIds()