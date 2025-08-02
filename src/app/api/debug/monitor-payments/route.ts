import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log('=== MONITORING PAYMENTS TABLE ===')
    console.log('👤 User:', { id: user.id, email: user.email })
    
    // Get total counts
    const totalContracts = await prisma.contract.count()
    const totalPayments = await prisma.payment.count()
    const userContracts = await prisma.contract.count({ where: { userId: user.id } })
    const userPayments = await prisma.payment.count({
      where: {
        contract: {
          userId: user.id
        }
      }
    })
    
    // Get recent contracts (last 10)
    const recentContracts = await prisma.contract.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        status: true,
        rentAmount: true,
        userId: true,
        tenant: {
          select: { name: true }
        },
        property: {
          select: { title: true }
        },
        user: {
          select: { email: true }
        }
      }
    })
    
    // Get recent payments (last 10)
    const recentPayments = await prisma.payment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        contractId: true,
        amount: true,
        dueDate: true,
        status: true,
        createdAt: true,
        contract: {
          select: {
            tenant: {
              select: { name: true }
            },
            user: {
              select: { email: true }
            }
          }
        }
      }
    })
    
    // Check if there's any automatic payment generation logic
    const contractsWithoutPayments = await prisma.contract.findMany({
      where: {
        payments: {
          none: {}
        }
      },
      select: {
        id: true,
        createdAt: true,
        tenant: {
          select: { name: true }
        },
        user: {
          select: { email: true }
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      monitoring: {
        system: {
          totalContracts,
          totalPayments,
          paymentGenerationRatio: totalContracts > 0 ? (totalPayments / totalContracts).toFixed(2) : '0'
        },
        currentUser: {
          id: user.id,
          email: user.email,
          contracts: userContracts,
          payments: userPayments
        },
        recentActivity: {
          contracts: recentContracts.map(c => ({
            id: c.id,
            createdAt: c.createdAt,
            tenant: c.tenant.name,
            property: c.property.title,
            owner: c.user.email,
            rentAmount: c.rentAmount,
            isYours: c.userId === user.id
          })),
          payments: recentPayments.map(p => ({
            id: p.id,
            contractId: p.contractId,
            amount: p.amount,
            dueDate: p.dueDate,
            status: p.status,
            createdAt: p.createdAt,
            tenant: p.contract?.tenant?.name || 'N/A',
            owner: p.contract?.user?.email || 'N/A'
          }))
        },
        contractsWithoutPayments: contractsWithoutPayments.map(c => ({
          id: c.id,
          createdAt: c.createdAt,
          tenant: c.tenant.name,
          owner: c.user.email,
          isYours: c.user.email === user.email
        })),
        analysis: {
          hasRecentContracts: recentContracts.length > 0,
          hasRecentPayments: recentPayments.length > 0,
          contractsWithoutPaymentsCount: contractsWithoutPayments.length,
          yourContractsWithoutPayments: contractsWithoutPayments.filter(c => c.user.email === user.email).length
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Monitor error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro no monitoramento', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}