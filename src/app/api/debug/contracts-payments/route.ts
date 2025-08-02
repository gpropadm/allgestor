import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log('=== CONTRACTS vs PAYMENTS DEBUG ===')
    console.log('👤 User:', { id: user.id, email: user.email })
    
    // Get user's contracts
    const contracts = await prisma.contract.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        rentAmount: true,
        tenant: {
          select: { name: true }
        },
        property: {
          select: { title: true }
        }
      }
    })
    
    console.log(`📊 User has ${contracts.length} contracts`)
    
    // For each contract, check payments
    const contractAnalysis = []
    
    for (const contract of contracts) {
      const payments = await prisma.payment.findMany({
        where: { contractId: contract.id },
        select: {
          id: true,
          amount: true,
          dueDate: true,
          status: true
        }
      })
      
      contractAnalysis.push({
        contractId: contract.id,
        tenant: contract.tenant.name,
        property: contract.property.title,
        status: contract.status,
        startDate: contract.startDate,
        endDate: contract.endDate,
        rentAmount: contract.rentAmount,
        paymentsCount: payments.length,
        payments: payments.map(p => ({
          id: p.id,
          amount: p.amount,
          dueDate: p.dueDate,
          status: p.status
        }))
      })
    }
    
    // Also check total payments in system
    const totalPayments = await prisma.payment.count()
    
    // Check if there are any orphaned payments (payments without valid contracts)
    const allPayments = await prisma.payment.findMany({
      select: {
        id: true,
        contractId: true,
        amount: true
      }
    })
    
    const orphanedPayments = []
    for (const payment of allPayments) {
      const contractExists = await prisma.contract.findUnique({
        where: { id: payment.contractId },
        select: { id: true }
      })
      
      if (!contractExists) {
        orphanedPayments.push(payment)
      }
    }
    
    return NextResponse.json({
      success: true,
      analysis: {
        user: {
          id: user.id,
          email: user.email
        },
        totalContracts: contracts.length,
        totalPaymentsInSystem: totalPayments,
        orphanedPayments: orphanedPayments.length,
        contractsAnalysis: contractAnalysis,
        summary: {
          contractsWithPayments: contractAnalysis.filter(c => c.paymentsCount > 0).length,
          contractsWithoutPayments: contractAnalysis.filter(c => c.paymentsCount === 0).length,
          totalPaymentsForUser: contractAnalysis.reduce((sum, c) => sum + c.paymentsCount, 0)
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Debug error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro no diagnóstico', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}