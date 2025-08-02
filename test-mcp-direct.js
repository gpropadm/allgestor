require('dotenv').config({ path: '.env.local' })
const { crmMCP } = require('./src/lib/mcp-server.ts')

async function testMCPDirectly() {
  try {
    console.log('🔍 Testando MCP diretamente...\n')
    
    const userId = 'cmdusefap0002uc3tnmol495a'
    
    // 1. Testar busca de pagamentos
    console.log('1️⃣ Testando getPayments com filtro overdue...')
    const paymentsResult = await crmMCP.getPayments({ 
      userId, 
      overdue: true 
    })
    
    if (paymentsResult.success) {
      console.log(`✅ Encontrados ${paymentsResult.data.length} pagamentos em atraso`)
      paymentsResult.data.forEach(payment => {
        console.log(`   - R$ ${payment.amount} vencido em ${payment.dueDate}`)
      })
    } else {
      console.log('❌ Erro ao buscar pagamentos:', paymentsResult.error)
    }
    
    console.log('\n2️⃣ Testando busca de propriedades...')
    const propertiesResult = await crmMCP.getProperties({ userId })
    
    if (propertiesResult.success) {
      console.log(`✅ Encontradas ${propertiesResult.data.length} propriedades`)
    } else {
      console.log('❌ Erro ao buscar propriedades:', propertiesResult.error)
    }
    
    console.log('\n3️⃣ Testando busca de leads...')
    const leadsResult = await crmMCP.getLeads({ userId })
    
    if (leadsResult.success) {
      console.log(`✅ Encontrados ${leadsResult.data.length} leads`)
    } else {
      console.log('❌ Erro ao buscar leads:', leadsResult.error)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

testMCPDirectly()