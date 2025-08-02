require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_OVERRIDE || process.env.DATABASE_URL
    }
  }
})

async function debugMatches() {
  try {
    console.log('🔍 Analisando leads e propriedades para matches...\n')
    
    const userId = 'cmdusefap0002uc3tnmol495a'
    
    // Buscar leads
    const leads = await prisma.lead.findMany({
      where: { userId }
    })
    
    console.log('🎯 LEADS:')
    leads.forEach(lead => {
      console.log(`- ${lead.name}: ${lead.propertyType}, max R$ ${lead.maxPrice}, ${lead.minBedrooms || 0}-${lead.maxBedrooms || 'N/A'} quartos, ${lead.preferredCities}`)
    })
    
    // Buscar propriedades disponíveis
    const properties = await prisma.property.findMany({
      where: { 
        userId,
        status: 'AVAILABLE'
      }
    })
    
    console.log('\n🏢 PROPRIEDADES DISPONÍVEIS:')
    properties.forEach(prop => {
      console.log(`- ${prop.title}: ${prop.propertyType}, R$ ${prop.rentPrice}, ${prop.bedrooms} quartos, ${prop.city}`)
    })
    
    console.log('\n🔄 TENTANDO CRIAR MATCHES...')
    
    // Verificar matches manualmente
    for (const lead of leads) {
      console.log(`\n👤 ${lead.name} procura:`)
      console.log(`   Tipo: ${lead.propertyType}`)
      console.log(`   Orçamento: até R$ ${lead.maxPrice}`)
      console.log(`   Quartos: ${lead.minBedrooms || 0} a ${lead.maxBedrooms || 'N/A'}`)
      console.log(`   Cidades: ${lead.preferredCities}`)
      
      const matches = properties.filter(property => {
        const typeMatch = property.propertyType === lead.propertyType
        const priceMatch = property.rentPrice <= lead.maxPrice
        const bedroomMatch = !lead.minBedrooms || property.bedrooms >= lead.minBedrooms
        const maxBedroomMatch = !lead.maxBedrooms || property.bedrooms <= lead.maxBedrooms
        
        const preferredCities = JSON.parse(lead.preferredCities || '[]')
        const cityMatch = preferredCities.length === 0 || preferredCities.includes(property.city)
        
        console.log(`   ${property.title}:`)
        console.log(`     Tipo: ${typeMatch ? '✅' : '❌'} ${property.propertyType}`)
        console.log(`     Preço: ${priceMatch ? '✅' : '❌'} R$ ${property.rentPrice}`)
        console.log(`     Quartos: ${bedroomMatch && maxBedroomMatch ? '✅' : '❌'} ${property.bedrooms}`)
        console.log(`     Cidade: ${cityMatch ? '✅' : '❌'} ${property.city}`)
        
        return typeMatch && priceMatch && bedroomMatch && maxBedroomMatch && cityMatch
      })
      
      console.log(`   📊 Matches encontrados: ${matches.length}`)
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugMatches()