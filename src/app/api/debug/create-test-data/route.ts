import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isUserAdmin } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const userIsAdmin = await isUserAdmin(user.id)
    
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    console.log('=== CRIANDO DADOS DE TESTE ===')
    
    // Verificar se já existem dados
    const existingTenants = await prisma.tenant.count()
    const existingProperties = await prisma.property.count()
    
    if (existingTenants > 0 && existingProperties > 0) {
      return NextResponse.json({
        success: false,
        message: 'Dados de teste já existem',
        existing: {
          tenants: existingTenants,
          properties: existingProperties
        }
      })
    }
    
    // Criar proprietário de teste
    const owner = await prisma.owner.create({
      data: {
        name: 'Proprietário Teste',
        email: 'proprietario@teste.com',
        phone: '(11) 99999-9999',
        document: '123.456.789-00',
        address: 'Rua dos Proprietários, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000',
        userId: user.id,
        companyId: user.companyId
      }
    })
    
    // Criar propriedade de teste
    const property = await prisma.property.create({
      data: {
        title: 'Apartamento Teste',
        description: 'Apartamento de 2 quartos para teste',
        address: 'Rua das Propriedades, 456',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000',
        bedrooms: 2,
        bathrooms: 1,
        area: 70.0,
        rentPrice: 1200.00,
        salePrice: 250000.00,
        propertyType: 'APARTMENT',
        status: 'AVAILABLE',
        availableFor: '["RENT"]',
        ownerId: owner.id,
        companyId: user.companyId || '',
        userId: user.id,
        images: '[]',
        amenities: '["Garagem", "Portaria 24h"]'
      }
    })
    
    // Criar inquilino de teste
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Inquilino Teste',
        email: 'inquilino@teste.com',
        phone: '(11) 88888-8888',
        document: '987.654.321-00',
        address: 'Rua dos Inquilinos, 789',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000',
        income: 5000.00,
        companyId: user.companyId || '',
        userId: user.id,
        occupation: 'Desenvolvedor',
        emergencyContact: 'Contato de Emergência'
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Dados de teste criados com sucesso!',
      data: {
        owner: {
          id: owner.id,
          name: owner.name
        },
        property: {
          id: property.id,
          title: property.title
        },
        tenant: {
          id: tenant.id,
          name: tenant.name
        }
      }
    })
    
  } catch (error) {
    console.error('Create test data error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}