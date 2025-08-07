import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log('🔍 Debugando dados do formulário de contrato...')
    
    // Buscar propriedades
    const properties = await prisma.property.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        address: true,
        rentPrice: true,
        propertyType: true,
        owner: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Buscar inquilinos
    const tenants = await prisma.tenant.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        document: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Formatar como será exibido no select
    const formattedProperties = properties.map(property => ({
      ...property,
      displayText: `${property.title} - ${property.address} (R$ ${property.rentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
      rentPriceFormatted: property.rentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }))
    
    const formattedTenants = tenants.map(tenant => ({
      ...tenant,
      displayText: `${tenant.name} - ${tenant.document}`,
      documentFormatted: tenant.document || 'Sem documento'
    }))
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      data: {
        properties: formattedProperties,
        tenants: formattedTenants,
        counts: {
          properties: properties.length,
          tenants: tenants.length
        }
      },
      raw_data: {
        properties: properties,
        tenants: tenants
      },
      potential_issues: {
        properties_without_rentPrice: properties.filter(p => !p.rentPrice || p.rentPrice === 0),
        tenants_without_document: tenants.filter(t => !t.document),
        properties_with_strange_rentPrice: properties.filter(p => p.rentPrice && (p.rentPrice < 100 || p.rentPrice > 100000))
      }
    })
    
  } catch (error: any) {
    console.error('❌ Erro no debug dos dados do formulário:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao debugar dados do formulário',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}