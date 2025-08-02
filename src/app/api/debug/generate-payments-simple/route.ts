import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isUserAdmin } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const userIsAdmin = await isUserAdmin(user.id)
    
    console.log('🔧 User attempting to generate payments:', { id: user.id, email: user.email, isAdmin: userIsAdmin })
    
    const { contractId } = await request.json()
    
    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID required' }, { status: 400 })
    }
    
    console.log('🔧 Generating payments for contract:', contractId)
    
    // Get contract details - admin can access any contract, user can access their own contracts
    const contract = await prisma.contract.findFirst({
      where: userIsAdmin ? { id: contractId } : { id: contractId, userId: user.id },
      include: {
        property: true,
        tenant: true
      }
    })
    
    if (!contract) {
      return NextResponse.json({ 
        error: 'Contract not found or access denied',
        message: userIsAdmin ? 'Contract does not exist' : 'You can only generate payments for your own contracts'
      }, { status: 404 })
    }
    
    // Verify user permission
    if (!userIsAdmin && contract.userId !== user.id) {
      return NextResponse.json({ 
        error: 'Access denied',
        message: 'You can only generate payments for contracts you created'
      }, { status: 403 })
    }
    
    // Check if payments already exist - using only basic fields
    const existingPayments = await prisma.payment.findMany({
      where: { contractId: contractId },
      select: {
        id: true,
        amount: true,
        dueDate: true,
        status: true
      }
    })
    
    if (existingPayments.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Payments already exist for this contract',
        existingPayments: existingPayments.length,
        payments: existingPayments
      })
    }
    
    // Generate payments for the contract duration
    const startDate = new Date(contract.startDate)
    const endDate = new Date(contract.endDate)
    const payments = []
    
    let currentDate = new Date(startDate)
    currentDate.setDate(10) // Set due date to 10th of each month
    
    while (currentDate <= endDate) {
      try {
        const payment = await prisma.payment.create({
          data: {
            contractId: contract.id,
            amount: contract.rentAmount,
            dueDate: new Date(currentDate),
            status: 'PENDING'
          }
        })
        
        payments.push(payment)
        console.log('✅ Created payment for:', currentDate.toISOString().split('T')[0])
      } catch (createError) {
        console.error('❌ Error creating payment for', currentDate.toISOString().split('T')[0], ':', createError)
        
        // Try with minimal fields
        const payment = await prisma.payment.create({
          data: {
            contractId: contract.id,
            amount: contract.rentAmount,
            dueDate: new Date(currentDate)
          }
        })
        
        payments.push(payment)
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    return NextResponse.json({
      success: true,
      message: `Generated ${payments.length} payments for contract`,
      contract: {
        id: contract.id,
        property: contract.property.title,
        tenant: contract.tenant.name,
        rentAmount: contract.rentAmount
      },
      paymentsGenerated: payments.length,
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        dueDate: p.dueDate,
        status: p.status
      }))
    })
    
  } catch (error) {
    console.error('Generate payments error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}