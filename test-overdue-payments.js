require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_OVERRIDE || process.env.DATABASE_URL
    }
  }
})

async function testOverduePayments() {
  try {
    console.log('🔍 Buscando pagamentos em atraso...')
    
    const userId = 'cmdusefap0002uc3tnmol495a'
    const today = new Date()
    
    // Buscar pagamentos pendentes com data vencida
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: today
        },
        contract: {
          userId: userId
        }
      },
      include: {
        contract: {
          include: {
            property: {
              select: {
                title: true,
                address: true
              }
            },
            tenant: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })
    
    console.log(`\n📊 Encontrados ${overduePayments.length} pagamentos em atraso:\n`)
    
    overduePayments.forEach(payment => {
      const daysPastDue = Math.floor((today - payment.dueDate) / (1000 * 60 * 60 * 24))
      console.log(`💰 Valor: R$ ${payment.amount.toLocaleString('pt-BR')}`)
      console.log(`🏠 Propriedade: ${payment.contract.property.title}`)
      console.log(`👤 Inquilino: ${payment.contract.tenant.name}`)
      console.log(`📞 Telefone: ${payment.contract.tenant.phone}`)
      console.log(`📅 Vencimento: ${payment.dueDate.toLocaleDateString('pt-BR')}`)
      console.log(`⏰ Dias em atraso: ${daysPastDue}`)
      console.log('─'.repeat(50))
    })
    
    // Calcular total em atraso
    const totalOverdue = overduePayments.reduce((sum, payment) => sum + payment.amount, 0)
    console.log(`\n💸 TOTAL EM ATRASO: R$ ${totalOverdue.toLocaleString('pt-BR')}`)
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testOverduePayments()