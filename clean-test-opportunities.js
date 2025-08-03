const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_OVERRIDE || process.env.DATABASE_URL
    }
  }
})

async function cleanTestOpportunities() {
  try {
    console.log('🧹 Iniciando limpeza de oportunidades de teste...')
    
    // Buscar todas as oportunidades
    const opportunities = await prisma.salesOpportunity.findMany()
    
    console.log(`📊 Encontradas ${opportunities.length} oportunidades`)
    
    // Buscar leads para verificar nomes
    const leads = await prisma.lead.findMany()
    const leadMap = {}
    leads.forEach(lead => {
      leadMap[lead.id] = lead
    })
    
    // Filtrar oportunidades que parecem ser de teste
    const testOpportunities = opportunities.filter(opp => {
      const lead = leadMap[opp.leadId]
      const leadName = lead?.name || ''
      const isTestName = leadName.toLowerCase().includes('teste') || 
                        leadName.toLowerCase().includes('test') ||
                        leadName.toLowerCase().includes('novo lead') ||
                        leadName === 'Lead não encontrado' ||
                        leadName.length < 3 ||
                        opp.value === 0 ||
                        !opp.value
      
      return isTestName
    })
    
    console.log(`🎯 Encontradas ${testOpportunities.length} oportunidades de teste`)
    
    if (testOpportunities.length === 0) {
      console.log('✅ Nenhuma oportunidade de teste encontrada!')
      return
    }
    
    // Mostrar quais serão deletadas
    console.log('\n📋 Oportunidades que serão deletadas:')
    testOpportunities.forEach((opp, index) => {
      const lead = leadMap[opp.leadId]
      console.log(`${index + 1}. ${lead?.name || 'Sem nome'} - R$ ${opp.value || 0}`)
    })
    
    console.log('\n⏰ Aguardando 3 segundos antes de deletar...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Deletar oportunidades de teste
    const deleteResult = await prisma.salesOpportunity.deleteMany({
      where: {
        id: {
          in: testOpportunities.map(opp => opp.id)
        }
      }
    })
    
    console.log(`✅ ${deleteResult.count} oportunidades de teste deletadas com sucesso!`)
    
    // Verificar se há leads órfãos (sem oportunidades) que também são de teste
    const orphanLeads = await prisma.lead.findMany({
      where: {
        AND: [
          {
            salesOpportunities: {
              none: {}
            }
          },
          {
            OR: [
              { name: { contains: 'teste', mode: 'insensitive' } },
              { name: { contains: 'test', mode: 'insensitive' } },
              { name: { contains: 'novo lead', mode: 'insensitive' } },
              { name: 'Lead não encontrado' }
            ]
          }
        ]
      }
    })
    
    if (orphanLeads.length > 0) {
      console.log(`\n🧹 Encontrados ${orphanLeads.length} leads órfãos de teste`)
      
      const deleteLeads = await prisma.lead.deleteMany({
        where: {
          id: {
            in: orphanLeads.map(lead => lead.id)
          }
        }
      })
      
      console.log(`✅ ${deleteLeads.count} leads de teste órfãos deletados!`)
    }
    
    console.log('\n🎉 Limpeza concluída! Pipeline organizado!')
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  cleanTestOpportunities()
}

module.exports = { cleanTestOpportunities }