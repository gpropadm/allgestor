import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('ownerId')
    const year = searchParams.get('year') || '2025'
    
    if (!ownerId) {
      return NextResponse.json({ error: 'ownerId required' }, { status: 400 })
    }
    
    // 1. Buscar todos os contratos do proprietário
    const allContracts = await prisma.contract.findMany({
      where: {
        userId: user.id,
        property: {
          ownerId: ownerId
        }
      },
      select: {
        id: true,
        status: true,
        includeInDimob: true,
        startDate: true,
        endDate: true,
        property: {
          select: {
            address: true,
            owner: {
              select: { name: true }
            }
          }
        }
      }
    })
    
    // 2. Buscar contratos ativos
    const activeContracts = allContracts.filter(c => c.status === 'ACTIVE')
    
    // 3. Buscar contratos marcados para DIMOB
    const dimobContracts = activeContracts.filter(c => c.includeInDimob === true)
    
    // 4. Buscar contratos com pagamentos do ano
    const contractsWithPayments = await prisma.contract.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        includeInDimob: true,
        property: {
          ownerId: ownerId
        },
        payments: {
          some: {
            dueDate: {
              gte: new Date(`${year}-01-01`),
              lte: new Date(`${year}-12-31`)
            }
          }
        }
      },
      include: {
        payments: {
          where: {
            dueDate: {
              gte: new Date(`${year}-01-01`),
              lte: new Date(`${year}-12-31`)
            }
          }
        },
        property: {
          select: {
            address: true,
            owner: {
              select: { name: true }
            }
          }
        }
      }
    })
    
    return NextResponse.json({
      year,
      ownerId,
      debug: {
        allContracts: allContracts.length,
        activeContracts: activeContracts.length,
        dimobContracts: dimobContracts.length,
        contractsWithPayments: contractsWithPayments.length
      },
      data: {
        allContracts,
        activeContracts,
        dimobContracts,
        contractsWithPayments: contractsWithPayments.map(c => ({
          id: c.id,
          includeInDimob: c.includeInDimob,
          address: c.property.address,
          paymentsCount: c.payments.length
        }))
      }
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}