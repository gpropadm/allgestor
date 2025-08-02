const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_OVERRIDE || process.env.DATABASE_URL
    }
  }
})

async function createAdminUser() {
  try {
    console.log('🔧 Criando usuário admin...')
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    // Criar empresa padrão
    const company = await prisma.company.upsert({
      where: { document: '00000000000191' },
      update: {},
      create: {
        name: 'CRM IA Company',
        tradeName: 'CRM IA',
        document: '00000000000191',
        email: 'admin@crmia.com',
        phone: '(11) 99999-9999',
        address: 'Rua Teste, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000'
      }
    })
    
    // Criar usuário admin
    const user = await prisma.user.upsert({
      where: { email: 'admin@crmia.com' },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        companyId: company.id
      },
      create: {
        email: 'admin@crmia.com',
        name: 'Administrator',
        password: hashedPassword,
        phone: '(11) 99999-9999',
        role: 'ADMIN',
        isActive: true,
        companyId: company.id
      }
    })
    
    console.log('✅ Usuário admin criado com sucesso!')
    console.log('📧 Email: admin@crmia.com')
    console.log('🔐 Senha: admin123')
    console.log(`👤 ID: ${user.id}`)
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()