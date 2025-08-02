// API para verificar taxas do contrato
// Endpoint: GET /api/contracts/check-fees

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')

    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    let contracts
    if (contractId) {
      contracts = await prisma.contract.findMany({
        where: { 
          id: contractId,
          property: {
            owner: {
              companyId: session.user.companyId
            }
          }
        },
        select: {
          id: true,
          rentAmount: true,
          administrationFeePercentage: true,
          managementFeePercentage: true,
          property: {
            select: {
              title: true,
              owner: {
                select: {
                  name: true
                }
              }
            }
          },
          tenant: {
            select: {
              name: true
            }
          }
        }
      })
    } else {
      contracts = await prisma.contract.findMany({
        where: {
          property: {
            owner: {
              companyId: session.user.companyId
            }
          }
        },
        select: {
          id: true,
          rentAmount: true,
          administrationFeePercentage: true,
          managementFeePercentage: true,
          property: {
            select: {
              title: true,
              owner: {
                select: {
                  name: true
                }
              }
            }
          },
          tenant: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    }

    await prisma.$disconnect()

    const contractsWithCalculations = contracts.map(contract => {
      const totalFee = contract.administrationFeePercentage + (contract.managementFeePercentage || 0)
      const companyAmount = contract.rentAmount * (totalFee / 100)
      const ownerAmount = contract.rentAmount - companyAmount

      return {
        ...contract,
        calculations: {
          totalFeePercentage: totalFee,
          companyAmount: Math.round(companyAmount * 100) / 100,
          ownerAmount: Math.round(ownerAmount * 100) / 100
        }
      }
    })

    return NextResponse.json({
      success: true,
      contracts: contractsWithCalculations
    })
  } catch (error) {
    console.error('Erro ao verificar taxas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}