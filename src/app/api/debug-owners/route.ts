import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Buscar todos os proprietários do usuário
    const owners = await prisma.owner.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        name: true,
        document: true,
        _count: {
          select: {
            properties: {
              where: {
                contracts: {
                  some: {
                    userId: user.id
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    // Para cada proprietário, buscar contratos
    const ownersWithContracts = await Promise.all(
      owners.map(async (owner) => {
        const contracts = await prisma.contract.findMany({
          where: {
            userId: user.id,
            property: {
              ownerId: owner.id
            }
          },
          select: {
            id: true,
            status: true,
            includeInDimob: true,
            property: {
              select: {
                address: true
              }
            }
          }
        })
        
        return {
          ...owner,
          contracts: contracts.map(c => ({
            id: c.id,
            status: c.status,
            includeInDimob: c.includeInDimob,
            address: c.property.address
          }))
        }
      })
    )
    
    return NextResponse.json({
      owners: ownersWithContracts,
      totalOwners: owners.length
    })
    
  } catch (error) {
    console.error('Debug owners error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}