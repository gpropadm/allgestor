import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Check user contracts
    const userContracts = await prisma.contract.findMany({
      where: { userId: user.id },
      select: { id: true, propertyId: true, tenantId: true }
    })
    
    // Check total payments in system
    const totalPayments = await prisma.payment.count()
    
    // Check payments for user contracts
    const userPayments = await prisma.payment.findMany({
      where: {
        contractId: {
          in: userContracts.map(c => c.id)
        }
      },
      select: {
        id: true,
        amount: true,
        dueDate: true,
        status: true,
        contractId: true
      },
      orderBy: { dueDate: 'desc' },
      take: 10
    })
    
    // Current month filter check
    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)
    
    const currentMonthPayments = await prisma.payment.findMany({
      where: {
        contractId: {
          in: userContracts.map(c => c.id)
        },
        dueDate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      select: {
        id: true,
        amount: true,
        dueDate: true,
        status: true
      }
    })

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      userContracts: userContracts.length,
      totalPayments,
      userPayments: userPayments.length,
      currentMonthPayments: currentMonthPayments.length,
      dateRange: {
        startOfMonth: startOfMonth.toISOString(),
        endOfMonth: endOfMonth.toISOString(),
        currentMonth: startOfMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
      },
      samplePayments: userPayments.slice(0, 3),
      sampleCurrentMonth: currentMonthPayments.slice(0, 3)
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}