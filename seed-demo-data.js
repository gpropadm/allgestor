const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_OVERRIDE || process.env.DATABASE_URL
    }
  }
})

async function seedDemoData() {
  try {
    console.log('🚀 Criando dados de demonstração...')
    
    const userId = 'cmdusefap0002uc3tnmol495a' // Admin user ID
    const companyId = 'cmdusef3z0000uc3tahdulec5' // Company ID
    
    // 1. PROPRIETÁRIOS
    console.log('👥 Criando proprietários...')
    const owners = await Promise.all([
      prisma.owner.create({
        data: {
          name: 'Maria Silva Santos',
          email: 'maria.silva@email.com',
          phone: '(11) 99999-1111',
          document: '123.456.789-01',
          address: 'Rua das Flores, 456',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          userId
        }
      }),
      prisma.owner.create({
        data: {
          name: 'João Oliveira Costa',
          email: 'joao.costa@email.com',
          phone: '(11) 99999-2222',
          document: '987.654.321-02',
          address: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          userId
        }
      }),
      prisma.owner.create({
        data: {
          name: 'Ana Paula Rodrigues',
          email: 'ana.rodrigues@email.com',
          phone: '(11) 99999-3333',
          document: '456.789.123-03',
          address: 'Rua Augusta, 789',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01305-000',
          userId
        }
      })
    ])
    
    // 2. INQUILINOS
    console.log('🏠 Criando inquilinos...')
    const tenants = await Promise.all([
      prisma.tenant.create({
        data: {
          name: 'Carlos Eduardo Lima',
          email: 'carlos.lima@email.com',
          phone: '(11) 88888-1111',
          document: '111.222.333-44',
          address: 'Rua dos Engenheiros, 456',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          income: 8000,
          companyId,
          occupation: 'Engenheiro Civil',
          userId
        }
      }),
      prisma.tenant.create({
        data: {
          name: 'Fernanda Souza Alves',
          email: 'fernanda.alves@email.com',
          phone: '(11) 88888-2222',
          document: '222.333.444-55',
          address: 'Av. Paulista, 789',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          income: 12000,
          companyId,
          occupation: 'Advogada',
          userId
        }
      }),
      prisma.tenant.create({
        data: {
          name: 'Roberto Santos Silva',
          email: 'roberto.silva@email.com',
          phone: '(11) 88888-3333',
          document: '333.444.555-66',
          address: 'Rua da Saúde, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01305-000',
          income: 15000,
          companyId,
          occupation: 'Médico',
          userId
        }
      }),
      prisma.tenant.create({
        data: {
          name: 'Juliana Costa Pereira',
          email: 'juliana.pereira@email.com',
          phone: '(11) 88888-4444',
          document: '444.555.666-77',
          address: 'Rua do Design, 999',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-890',
          income: 7000,
          companyId,
          occupation: 'Arquiteta',
          userId
        }
      })
    ])
    
    // 3. PROPRIEDADES
    console.log('🏢 Criando propriedades...')
    const properties = await Promise.all([
      prisma.property.create({
        data: {
          title: 'Apartamento Moderno em Copacabana',
          description: 'Apartamento de 3 quartos com vista para o mar, próximo ao metrô',
          address: 'Av. Atlântica, 1234',
          city: 'Rio de Janeiro',
          state: 'RJ',
          zipCode: '22070-011',
          bedrooms: 3,
          bathrooms: 2,
          area: 120.5,
          rentPrice: 4500,
          propertyType: 'APARTMENT',
          status: 'RENTED',
          availableFor: '["RENT"]',
          ownerId: owners[0].id,
          companyId,
          userId,
          images: '[]',
          amenities: '["Vista para o mar", "Próximo ao metrô", "Portaria 24h"]'
        }
      }),
      prisma.property.create({
        data: {
          title: 'Casa Familiar em Ipanema',
          description: 'Casa de 4 quartos com quintal, ideal para famílias',
          address: 'Rua Visconde de Pirajá, 567',
          city: 'Rio de Janeiro',
          state: 'RJ',
          zipCode: '22410-002',
          bedrooms: 4,
          bathrooms: 3,
          area: 200.0,
          rentPrice: 8000,
          propertyType: 'HOUSE',
          status: 'RENTED',
          availableFor: '["RENT"]',
          ownerId: owners[1].id,
          companyId,
          userId,
          images: '[]',
          amenities: '["Quintal", "Ideal para famílias", "4 quartos"]'
        }
      }),
      prisma.property.create({
        data: {
          title: 'Loja Comercial na Barra da Tijuca',
          description: 'Loja térrea com ótima localização, estacionamento próprio',
          address: 'Av. das Américas, 2000',
          city: 'Rio de Janeiro',
          state: 'RJ',
          zipCode: '22640-100',
          bedrooms: 0,
          bathrooms: 2,
          area: 80.0,
          rentPrice: 3500,
          propertyType: 'COMMERCIAL',
          status: 'AVAILABLE',
          availableFor: '["RENT"]',
          ownerId: owners[2].id,
          companyId,
          userId,
          images: '[]',
          amenities: '["Estacionamento próprio", "Ótima localização", "Loja térrea"]'
        }
      }),
      prisma.property.create({
        data: {
          title: 'Apartamento Studio em Botafogo',
          description: 'Studio moderno para jovens profissionais, mobiliado',
          address: 'Rua da Passagem, 123',
          city: 'Rio de Janeiro',
          state: 'RJ',
          zipCode: '22290-030',
          bedrooms: 1,
          bathrooms: 1,
          area: 45.0,
          rentPrice: 2800,
          propertyType: 'STUDIO',
          status: 'AVAILABLE',
          availableFor: '["RENT"]',
          ownerId: owners[0].id,
          companyId,
          userId,
          images: '[]',
          amenities: '["Mobiliado", "Para jovens profissionais", "Studio moderno"]'
        }
      }),
      prisma.property.create({
        data: {
          title: 'Cobertura Duplex em Leblon',
          description: 'Cobertura luxuosa com terraço e piscina privativa',
          address: 'Rua Aristides Espínola, 89',
          city: 'Rio de Janeiro',
          state: 'RJ',
          zipCode: '22440-050',
          bedrooms: 3,
          bathrooms: 4,
          area: 180.0,
          rentPrice: 12000,
          salePrice: 2500000,
          propertyType: 'APARTMENT',
          status: 'AVAILABLE',
          availableFor: '["RENT", "SALE"]',
          ownerId: owners[1].id,
          companyId,
          userId,
          images: '[]',
          amenities: '["Terraço", "Piscina privativa", "Cobertura duplex", "Luxuosa"]'
        }
      })
    ])
    
    // 4. CONTRATOS ATIVOS
    console.log('📋 Criando contratos...')
    const contracts = await Promise.all([
      prisma.contract.create({
        data: {
          propertyId: properties[0].id,
          tenantId: tenants[0].id,
          companyId,
          userId,
          rentAmount: 4500,
          depositAmount: 4500,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2025-01-01'),
          autoGenerateBoletos: true
        }
      }),
      prisma.contract.create({
        data: {
          propertyId: properties[1].id,
          tenantId: tenants[1].id,
          companyId,
          userId,
          rentAmount: 8000,
          depositAmount: 8000,
          startDate: new Date('2024-03-01'),
          endDate: new Date('2025-03-01'),
          autoGenerateBoletos: true
        }
      })
    ])
    
    // 5. PAGAMENTOS (ALGUNS PAGOS, ALGUNS PENDENTES, ALGUNS EM ATRASO)
    console.log('💰 Criando histórico de pagamentos...')
    const payments = []
    
    // Pagamentos do primeiro contrato (Copacabana)
    for (let i = 0; i < 12; i++) {
      const dueDate = new Date('2024-01-05')
      dueDate.setMonth(dueDate.getMonth() + i)
      
      let status = 'PAID'
      let paidDate = new Date(dueDate)
      paidDate.setDate(paidDate.getDate() + Math.floor(Math.random() * 5))
      
      // Últimos 2 meses: 1 pago, 1 pendente
      if (i === 10) status = 'PAID'
      if (i === 11) {
        status = 'PENDING'
        paidDate = null
      }
      
      payments.push(
        prisma.payment.create({
          data: {
            contractId: contracts[0].id,
            amount: 4500,
            dueDate,
            status,
            paidDate,
            paymentMethod: status === 'PAID' ? 'PIX' : null
          }
        })
      )
    }
    
    // Pagamentos do segundo contrato (Ipanema)
    for (let i = 0; i < 10; i++) {
      const dueDate = new Date('2024-03-10')
      dueDate.setMonth(dueDate.getMonth() + i)
      
      let status = 'PAID'
      let paidDate = new Date(dueDate)
      paidDate.setDate(paidDate.getDate() + Math.floor(Math.random() * 3))
      
      // Último mês em atraso
      if (i === 9) {
        status = 'PENDING'
        paidDate = null
        dueDate.setDate(dueDate.getDate() - 10) // 10 dias em atraso
      }
      
      payments.push(
        prisma.payment.create({
          data: {
            contractId: contracts[1].id,
            amount: 8000,
            dueDate,
            status,
            paidDate,
            paymentMethod: status === 'PAID' ? 'BOLETO' : null
          }
        })
      )
    }
    
    await Promise.all(payments)
    
    // 6. LEADS INTERESSANTES
    console.log('🎯 Criando leads...')
    const leads = await Promise.all([
      prisma.lead.create({
        data: {
          name: 'Pedro Henrique Santos',
          email: 'pedro.santos@email.com',
          phone: '(11) 77777-1111',
          propertyType: 'APARTMENT',
          interest: 'RENT',
          maxPrice: 5000,
          minBedrooms: 2,
          maxBedrooms: 3,
          preferredCities: '["Rio de Janeiro"]',
          preferredStates: '["RJ"]',
          status: 'ACTIVE',
          companyId,
          userId,
          notes: 'Procura apartamento perto do trabalho, orçamento flexível'
        }
      }),
      prisma.lead.create({
        data: {
          name: 'Empresa ABC Ltda',
          email: 'contato@empresaabc.com',
          phone: '(11) 77777-2222',
          propertyType: 'COMMERCIAL',
          interest: 'RENT',
          maxPrice: 4000,
          preferredCities: '["Rio de Janeiro"]',
          preferredStates: '["RJ"]',
          status: 'ACTIVE',
          companyId,
          userId,
          notes: 'Empresa de tecnologia procura espaço comercial moderno'
        }
      }),
      prisma.lead.create({
        data: {
          name: 'Marina e Rafael',
          email: 'marina.rafael@email.com',
          phone: '(11) 77777-3333',
          propertyType: 'HOUSE',
          interest: 'RENT',
          maxPrice: 9000,
          minBedrooms: 3,
          maxBedrooms: 4,
          preferredCities: '["Rio de Janeiro"]',
          preferredStates: '["RJ"]',
          status: 'ACTIVE',
          companyId,
          userId,
          notes: 'Casal jovem, querem casa com quintal para pets'
        }
      })
    ])
    
    // 7. DESPESAS
    console.log('📊 Criando despesas...')
    await Promise.all([
      prisma.expense.create({
        data: {
          description: 'Manutenção elevador - Ed. Copacabana',
          amount: 800,
          date: new Date('2024-11-15'),
          category: 'MAINTENANCE',
          userId,
          year: 2024,
          month: 11
        }
      }),
      prisma.expense.create({
        data: {
          description: 'Pintura externa - Casa Ipanema',
          amount: 2500,
          date: new Date('2024-11-10'),
          category: 'MAINTENANCE',
          userId,
          year: 2024,
          month: 11
        }
      }),
      prisma.expense.create({
        data: {
          description: 'Comissão de vendas',
          amount: 1200,
          date: new Date('2024-12-01'),
          category: 'COMMISSION',
          userId,
          year: 2024,
          month: 12
        }
      })
    ])
    
    console.log('✅ Dados de demonstração criados com sucesso!')
    console.log(`
📊 RESUMO DOS DADOS CRIADOS:
👥 Proprietários: 3
🏠 Inquilinos: 4  
🏢 Propriedades: 5 (2 ocupadas, 3 disponíveis)
📋 Contratos: 2 ativos
💰 Pagamentos: 22 (20 pagos, 1 pendente, 1 em atraso)
🎯 Leads: 3 (potenciais clientes)
📊 Despesas: 3

🤖 AGORA VOCÊ PODE TESTAR PERGUNTAS COMO:
• "Analise meu portfólio de propriedades"
• "Quais pagamentos estão em atraso?"
• "Mostre o resumo financeiro de dezembro"
• "Encontre matches para meus leads"
• "Como está a performance das propriedades?"
• "Quais contratos vencem em breve?"
`)
    
  } catch (error) {
    console.error('❌ Erro ao criar dados:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedDemoData()