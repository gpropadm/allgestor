import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isUserAdmin } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const userIsAdmin = await isUserAdmin(user.id)
    
    console.log('=== DEBUG USER CONTRACTS ===')
    console.log('👤 User:', { id: user.id, email: user.email, isAdmin: userIsAdmin })
    
    // Get user's contracts
    const userContracts = await prisma.contract.findMany({
      where: { userId: user.id },
      include: {
        property: {
          select: { title: true, address: true }
        },
        tenant: {
          select: { name: true, email: true }
        },
        payments: {
          select: { id: true, status: true, dueDate: true }
        }
      }
    })
    
    // If admin, also get all contracts in the system for comparison
    let allContracts = []
    if (userIsAdmin) {
      allContracts = await prisma.contract.findMany({
        include: {
          property: {
            select: { title: true, address: true }
          },
          tenant: {
            select: { name: true, email: true }
          },
          payments: {
            select: { id: true, status: true, dueDate: true }
          },
          user: {
            select: { id: true, email: true }
          }
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      currentUser: {
        id: user.id,
        email: user.email,
        isAdmin: userIsAdmin
      },
      userContracts: userContracts.map(c => ({
        id: c.id,
        tenant: c.tenant.name,
        property: c.property.title,
        startDate: c.startDate,
        endDate: c.endDate,
        status: c.status,
        paymentCount: c.payments.length,
        userId: c.userId
      })),
      allContracts: userIsAdmin ? allContracts.map(c => ({
        id: c.id,
        tenant: c.tenant.name,
        property: c.property.title,
        owner: c.user.email,
        paymentCount: c.payments.length,
        userId: c.userId
      })) : null
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro interno', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}