// API para gerar boletos mensais automáticos com split
// Endpoint: POST /api/asaas/generate-monthly

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PaymentSplitService } from '@/lib/payment-split-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      contractId, 
      months = 12,
      startFromNextMonth = true 
    } = body

    if (!contractId) {
      return NextResponse.json(
        { error: 'contractId é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se contrato existe e pertence à empresa
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        property: {
          include: {
            owner: {
              select: {
                companyId: true,
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

    if (!contract) {
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      )
    }

    if (contract.property.owner.companyId !== session.user.companyId) {
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'Acesso negado a este contrato' },
        { status: 403 }
      )
    }

    // Calcular período
    const startDate = new Date()
    if (startFromNextMonth) {
      startDate.setMonth(startDate.getMonth() + 1)
      startDate.setDate(1) // Primeiro dia do próximo mês
    }

    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + months - 1)
    endDate.setDate(28) // Último dia do período

    console.log('Gerando boletos mensais:', {
      contractId,
      tenant: contract.tenant.name,
      owner: contract.property.owner.name,
      months,
      period: `${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`
    })

    // Gerar boletos mensais
    console.log('Chamando generateMonthlyPaymentsWithSplit com:', {
      contractId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      companyId: session.user.companyId
    })
    
    const splitService = new PaymentSplitService()
    const result = await splitService.generateMonthlyPaymentsWithSplit(
      contractId,
      startDate.toISOString(),
      endDate.toISOString(),
      session.user.companyId
    )
    
    console.log('Resultado generateMonthlyPaymentsWithSplit:', result)

    await prisma.$disconnect()

    return NextResponse.json({
      success: result.success,
      paymentsGenerated: result.paymentsGenerated,
      message: result.message,
      errors: result.errors,
      contractInfo: {
        tenant: contract.tenant.name,
        owner: contract.property.owner.name,
        months: months,
        period: `${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`
      }
    })
  } catch (error) {
    console.error('Erro ao gerar boletos mensais:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Listar contratos elegíveis para cobrança automática
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    // Buscar contratos ativos da empresa
    const contracts = await prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        property: {
          owner: {
            companyId: session.user.companyId,
            bankAccounts: {
              some: {
                asaasWalletId: {
                  not: null
                },
                validated: true
              }
            }
          }
        }
      },
      include: {
        property: {
          include: {
            owner: {
              select: {
                name: true,
                bankAccounts: {
                  where: {
                    asaasWalletId: {
                      not: null
                    }
                  },
                  select: {
                    asaasWalletId: true,
                    validated: true
                  }
                }
              }
            }
          }
        },
        tenant: {
          select: {
            name: true,
            email: true
          }
        },
        payments: {
          select: {
            id: true,
            dueDate: true,
            status: true
          },
          orderBy: {
            dueDate: 'desc'
          },
          take: 3
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    await prisma.$disconnect()

    const contractsWithStatus = contracts.map(contract => ({
      id: contract.id,
      rentAmount: contract.rentAmount,
      administrationFeePercentage: contract.administrationFeePercentage,
      property: {
        title: contract.property.title,
        owner: contract.property.owner
      },
      tenant: contract.tenant,
      lastPayments: contract.payments,
      readyForAutomation: contract.property.owner.bankAccounts.length > 0 && 
                         contract.property.owner.bankAccounts[0].validated
    }))

    return NextResponse.json({
      success: true,
      contracts: contractsWithStatus,
      total: contractsWithStatus.length,
      readyForAutomation: contractsWithStatus.filter(c => c.readyForAutomation).length
    })
  } catch (error) {
    console.error('Erro ao listar contratos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}