import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isUserAdmin } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const userIsAdmin = await isUserAdmin(user.id)
    
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    console.log('=== DEBUG: VERIFICANDO DADOS ===')
    
    // Verificar inquilinos
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        userId: true,
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    })
    
    // Verificar propriedades
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        userId: true,
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    })
    
    // Verificar contratos existentes
    const contracts = await prisma.contract.findMany({
      select: {
        id: true,
        userId: true,
        propertyId: true,
        tenantId: true,
        status: true,
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    })
    
    // Verificar usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        tenants: {
          total: tenants.length,
          list: tenants
        },
        properties: {
          total: properties.length,
          list: properties
        },
        contracts: {
          total: contracts.length,
          list: contracts
        },
        users: {
          total: users.length,
          list: users
        },
        currentUser: {
          id: user.id,
          email: user.email,
          isAdmin: userIsAdmin
        }
      }
    })
    
  } catch (error) {
    console.error('Debug check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}