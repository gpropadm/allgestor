import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    console.log('=== DEBUG PAYMENT GENERATION ===')
    console.log('👤 User:', { id: user.id, email: user.email })
    
    // Step 1: Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, role: true }
    })
    
    if (!userExists) {
      return NextResponse.json({
        error: 'User not found in database',
        step: 'user_check'
      }, { status: 404 })
    }
    
    // Step 2: Check user's contracts
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
        },
        payments: {
          select: { id: true, status: true }
        }
      }
    })
    
    // Step 3: Test payment creation capability
    let canCreatePayment = false
    let testError = null
    
    try {
      // Try to get payment count to test database access
      const paymentCount = await prisma.payment.count()
      canCreatePayment = true
      console.log('📊 Current payment count:', paymentCount)
    } catch (error) {
      testError = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Cannot access payments table:', error)
    }
    
    // Step 4: Check database schema
    let schemaInfo = null
    try {
      // Test if all required fields exist by doing a limited query
      const samplePayment = await prisma.payment.findFirst({
        select: {
          id: true,
          contractId: true,
          amount: true,
          dueDate: true,
          status: true,
          paidDate: true
        }
      })
      schemaInfo = 'Schema accessible'
    } catch (error) {
      schemaInfo = error instanceof Error ? error.message : 'Schema error'
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        user: userExists,
        contractsFound: contracts.length,
        contracts: contracts.map(c => ({
          id: c.id,
          tenant: c.tenant.name,
          property: c.property.title,
          status: c.status,
          paymentsCount: c.payments.length,
          startDate: c.startDate,
          endDate: c.endDate,
          rentAmount: c.rentAmount
        })),
        canCreatePayment,
        testError,
        schemaInfo,
        contractsWithoutPayments: contracts.filter(c => c.payments.length === 0).length
      }
    })
    
  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 })
  }
}