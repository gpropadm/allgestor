require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_OVERRIDE || process.env.DATABASE_URL
    }
  }
})

async function addSalesLeads() {
  try {
    console.log('🏠 Criando leads de COMPRA para demonstrar o poder do CRM em VENDAS...\n')
    
    const userId = 'cmdusefap0002uc3tnmol495a'
    const companyId = 'cmdusef3z0000uc3tahdulec5'
    
    // LEADS DE COMPRA - PERFIS REALISTAS PARA IMPRESSIONAR IMOBILIÁRIAS
    const purchaseLeads = [
      {
        name: 'Ricardo Mendes Silva',
        email: 'ricardo.mendes@email.com',
        phone: '(11) 99999-8888',
        propertyType: 'APARTMENT',
        interest: 'BUY', // COMPRA!
        maxPrice: 850000, // R$ 850K - compradores sérios
        minBedrooms: 3,
        maxBedrooms: 4,
        preferredCities: '["Rio de Janeiro", "São Paulo"]',
        preferredStates: '["RJ", "SP"]',
        status: 'ACTIVE',
        companyId,
        userId,
        notes: 'Executivo procura apartamento para investimento. Tem R$ 850K à vista. Quer fechar em 30 dias. Decisor único.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 dias atrás
      },
      {
        name: 'Dr. Patricia e Dr. João Costa',
        email: 'patricia.joao@email.com',
        phone: '(11) 99999-7777',
        propertyType: 'HOUSE',
        interest: 'BUY',
        maxPrice: 1200000, // R$ 1.2M - alto valor
        minBedrooms: 4,
        maxBedrooms: 5,
        preferredCities: '["Rio de Janeiro"]',
        preferredStates: '["RJ"]',
        status: 'ACTIVE',
        companyId,
        userId,
        notes: 'Casal de médicos. Querem casa para família. Financiamento pré-aprovado. Visitaram 3 imóveis. MUITO quentes!',
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) // 12 dias atrás - URGENTE!
      },
      {
        name: 'Investimentos Aurora Ltda',
        email: 'contato@investimentosaurora.com',
        phone: '(11) 99999-6666',
        propertyType: 'COMMERCIAL',
        interest: 'BUY',
        maxPrice: 2500000, // R$ 2.5M - investidor institucional
        preferredCities: '["São Paulo", "Rio de Janeiro"]',
        preferredStates: '["SP", "RJ"]',
        status: 'ACTIVE',
        companyId,
        userId,
        notes: 'Fundo de investimento. Compram à vista. Querem portfólio de imóveis comerciais. Budget ilimitado real.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 dias atrás
      },
      {
        name: 'Marina Fernandes (Aposentada)',
        email: 'marina.fernandes@email.com',
        phone: '(11) 99999-5555',
        propertyType: 'APARTMENT',
        interest: 'BUY',
        maxPrice: 650000, // R$ 650K
        minBedrooms: 2,
        maxBedrooms: 3,
        preferredCities: '["Rio de Janeiro"]',
        preferredStates: '["RJ"]',
        status: 'ACTIVE',
        companyId,
        userId,
        notes: 'Vendeu casa grande. Quer apartamento menor, bem localizado. Pagamento à vista. Urgência por mudança.',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 dias atrás
      },
      {
        name: 'Família Santos (Intercâmbio)',
        email: 'familia.santos@email.com',
        phone: '(11) 99999-4444',
        propertyType: 'HOUSE',
        interest: 'BUY',
        maxPrice: 950000, // R$ 950K
        minBedrooms: 3,
        maxBedrooms: 4,
        preferredCities: '["Rio de Janeiro"]',
        preferredStates: '["RJ"]',
        status: 'ACTIVE',
        companyId,
        userId,
        notes: 'Voltando do exterior. Precisam de casa até março. 2 filhos pequenos. Querem quintal e segurança.',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 dias atrás - MUITO URGENTE!
      },
      {
        name: 'Tech Startup Hub',
        email: 'expansao@techstartup.com',
        phone: '(11) 99999-3333',
        propertyType: 'COMMERCIAL',
        interest: 'BUY',
        maxPrice: 1800000, // R$ 1.8M
        preferredCities: '["São Paulo"]',
        preferredStates: '["SP"]',
        status: 'ACTIVE',
        companyId,
        userId,
        notes: 'Startup em expansão. Querem sede própria. Decisão rápida. Investidores internacionais backing.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 dias atrás
      }
    ]

    // CRIAR OS LEADS DE COMPRA
    console.log('💰 Criando leads de compra com alto valor...')
    const createdLeads = []
    
    for (const leadData of purchaseLeads) {
      const lead = await prisma.lead.create({ data: leadData })
      createdLeads.push(lead)
      console.log(`✅ ${lead.name} - ${lead.interest} - R$ ${lead.maxPrice?.toLocaleString()}`)
    }

    // ADICIONAR PROPRIEDADES DE ALTO VALOR PARA VENDA
    console.log('\n🏢 Adicionando propriedades premium para venda...')
    
    const salesProperties = [
      {
        title: 'Apartamento Luxo Vista Mar - Copacabana',
        description: 'Apartamento de 3 suítes com vista panorâmica para o mar. Prédio com infraestrutura completa.',
        address: 'Av. Atlântica, 2500',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '22070-011',
        bedrooms: 3,
        bathrooms: 4,
        area: 150.0,
        rentPrice: 8000, // Para cumprir schema obrigatório
        salePrice: 890000, // R$ 890K - match com Ricardo
        propertyType: 'APARTMENT',
        status: 'AVAILABLE',
        availableFor: '["SALE"]',
        ownerId: 'cmdut5qxa0005uc0asec3cbk3', // Maria Silva
        companyId,
        userId,
        images: '[]',
        amenities: '["Vista mar", "Piscina", "Academia", "Portaria 24h", "Vaga de garagem"]'
      },
      {
        title: 'Casa Familiar Condomínio Barra',
        description: 'Casa 4 quartos em condomínio fechado. Quintal, piscina, segurança 24h.',
        address: 'Estrada do Pontal, 1000',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '22785-000',
        bedrooms: 4,
        bathrooms: 3,
        area: 220.0,
        rentPrice: 12000, // Para cumprir schema obrigatório
        salePrice: 1150000, // R$ 1.15M - match com Dr. Patricia
        propertyType: 'HOUSE',
        status: 'AVAILABLE',
        availableFor: '["SALE"]',
        ownerId: 'cmdut5qx10003uc0a0n0sum6e', // João Costa
        companyId,
        userId,
        images: '[]',
        amenities: '["Condomínio fechado", "Piscina privativa", "Quintal", "4 vagas", "Segurança 24h"]'
      },
      {
        title: 'Prédio Comercial Centro SP',
        description: 'Prédio comercial completo para investimento. 8 andares, totalmente ocupado.',
        address: 'Rua XV de Novembro, 300',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01013-001',
        bedrooms: 0,
        bathrooms: 16,
        area: 800.0,
        rentPrice: 25000, // Para cumprir schema obrigatório
        salePrice: 2300000, // R$ 2.3M - match com Aurora Investimentos
        propertyType: 'COMMERCIAL',
        status: 'AVAILABLE',
        availableFor: '["SALE"]',
        ownerId: 'cmdut5qs70001uc0ag5y4wr33', // Ana Paula
        companyId,
        userId,
        images: '[]',
        amenities: '["8 andares", "Totalmente ocupado", "Elevadores", "Centro SP", "ROI 8% a.a."]'
      },
      {
        title: 'Apartamento Compacto Leblon',
        description: 'Apartamento 2 quartos no coração do Leblon. Reformado, pronto para morar.',
        address: 'Rua Dias Ferreira, 200',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '22431-050',
        bedrooms: 2,
        bathrooms: 2,
        area: 85.0,
        rentPrice: 6500, // Para cumprir schema obrigatório
        salePrice: 680000, // R$ 680K - match com Marina aposentada
        propertyType: 'APARTMENT',
        status: 'AVAILABLE',
        availableFor: '["SALE"]',
        ownerId: 'cmdut5qxa0005uc0asec3cbk3',
        companyId,
        userId,
        images: '[]',
        amenities: '["Reformado", "Leblon", "Metrô próximo", "Comércio", "Pronto para morar"]'
      }
    ]

    for (const propertyData of salesProperties) {
      const property = await prisma.property.create({ data: propertyData })
      console.log(`🏠 ${property.title} - R$ ${property.salePrice?.toLocaleString()}`)
    }

    console.log('\n🎯 DEMONSTRAÇÃO CRIADA COM SUCESSO!')
    console.log(`
📊 RESUMO DOS DADOS DE VENDAS:
💰 Leads de Compra: ${createdLeads.length}
🏠 Propriedades à Venda: ${salesProperties.length}
💵 Valor Total em Negociação: R$ ${createdLeads.reduce((sum, lead) => sum + (lead.maxPrice || 0), 0).toLocaleString()}

🔥 CENÁRIOS PARA TESTAR:
1. "Quais são meus leads mais quentes?" 
   → Vai mostrar Dr. Patricia (12 dias) e Família Santos (15 dias) como ALTA PRIORIDADE

2. "Que oportunidades tenho hoje?"
   → Dashboard com ações urgentes e potencial de R$ 7M+ em vendas

3. "Encontre matches para meus leads de compra"
   → Vai conectar compradores com propriedades perfeitas

4. "Como convencer Ricardo sobre o apartamento em Copacabana?"
   → Argumentos personalizados baseados no perfil dele

🚀 AGORA O CRM VAI IMPRESSIONAR QUALQUER IMOBILIÁRIA!
`)
    
  } catch (error) {
    console.error('❌ Erro ao criar dados de vendas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSalesLeads()