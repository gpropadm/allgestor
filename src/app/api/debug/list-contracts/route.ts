import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isUserAdmin } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const userIsAdmin = await isUserAdmin(user.id)
    
    console.log('📋 Listing contracts for user:', { id: user.id, email: user.email, isAdmin: userIsAdmin })
    
    // Get contracts based on user permissions
    const contracts = await prisma.contract.findMany({
      where: userIsAdmin ? {} : { userId: user.id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            dueDate: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({
      success: true,
      userInfo: { id: user.id, email: user.email, isAdmin: userIsAdmin },
      contracts: contracts.map(contract => ({
        id: contract.id,
        userId: contract.userId,
        status: contract.status,
        startDate: contract.startDate,
        endDate: contract.endDate,
        rentAmount: contract.rentAmount,
        property: contract.property,
        tenant: contract.tenant,
        paymentsCount: contract.payments.length,
        payments: contract.payments,
        canAccess: userIsAdmin || contract.userId === user.id
      }))
    })
    
  } catch (error) {
    console.error('List contracts error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}