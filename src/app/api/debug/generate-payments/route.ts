import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isUserAdmin } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    console.log('=== GENERATING MISSING PAYMENTS ===')
    console.log('👤 User:', { id: user.id, email: user.email })
    
    // Get user's contracts (both admin and regular users see only their own contracts)
    const contracts = await prisma.contract.findMany({
      where: { 
        userId: user.id,
        status: 'ACTIVE'
      },
      include: { 
        tenant: true,
        property: true,
        payments: {
          select: {
            id: true,
            amount: true,
            dueDate: true,
            status: true,
            paidDate: true,
            paymentMethod: true
          }
        }
      }
    })
    
    console.log(`📊 Found ${contracts.length} active contracts for user`)
    
    if (contracts.length === 0) {
      return NextResponse.json({
        error: 'Contract not found or access denied',
        message: 'No active contracts found for this user'
      }, { status: 404 })
    }
    
    let totalPaymentsCreated = 0
    const contractsProcessed = []
    
    for (const contract of contracts) {
      console.log(`\n📝 Analyzing contract: ${contract.tenant.name}`)
      console.log(`   Period: ${contract.startDate.toLocaleDateString('pt-BR')} to ${contract.endDate.toLocaleDateString('pt-BR')}`)
      console.log(`   Existing payments: ${contract.payments.length}`)
      
      // If already has payments, skip this contract
      if (contract.payments.length > 0) {
        console.log(`   ✅ Contract already has ${contract.payments.length} payments - SKIPPING`)
        contractsProcessed.push({
          id: contract.id,
          tenant: contract.tenant.name,
          property: contract.property.title,
          status: 'skipped',
          reason: 'Already has payments',
          existingPayments: contract.payments.length
        })
        continue
      }
      
      console.log(`   🎯 Contract WITHOUT payments - generating...`)
      
      const startDate = new Date(contract.startDate)
      const endDate = new Date(contract.endDate)
      const dayOfMonth = startDate.getDate()
      
      // Generate payments for the entire contract period
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      
      let paymentDate = new Date(startDate)
      paymentDate.setDate(dayOfMonth)
      
      // Adjust to first payment date (same month or next)
      if (paymentDate < startDate) {
        paymentDate.setMonth(paymentDate.getMonth() + 1)
      }
      
      const paymentsForThisContract = []
      
      while (paymentDate <= endDate) {
        const paymentMonth = paymentDate.getMonth()
        const paymentYear = paymentDate.getFullYear()
        
        // 🎯 LOGIC: All months before current month = PAID
        // Current and future months = PENDING
        let status = 'PENDING'
        let paidDate = null
        
        if (paymentYear < currentYear || (paymentYear === currentYear && paymentMonth < currentMonth)) {
          // Previous months = automatically PAID
          status = 'PAID'
          paidDate = new Date(paymentDate.getTime() - Math.random() * 10 * 86400000) // Paid 1-10 days before due
          console.log(`     💰 ${paymentDate.toLocaleDateString('pt-BR')} - PAID (previous month)`)
        } else if (paymentYear === currentYear && paymentMonth === currentMonth) {
          // Current month: check if already overdue
          if (paymentDate < currentDate) {
            status = 'OVERDUE'
            console.log(`     ⚠️  ${paymentDate.toLocaleDateString('pt-BR')} - OVERDUE (current month, already due)`)
          } else {
            status = 'PENDING'
            console.log(`     ⏳ ${paymentDate.toLocaleDateString('pt-BR')} - PENDING (current month, not due yet)`)
          }
        } else {
          // Future months = PENDING
          status = 'PENDING'
          console.log(`     📅 ${paymentDate.toLocaleDateString('pt-BR')} - PENDING (future month)`)
        }
        
        // Create payment without gateway field (temporarily removed from schema)
        const payment = await prisma.payment.create({
          data: {
            contractId: contract.id,
            amount: contract.rentAmount,
            dueDate: paymentDate,
            status,
            ...(paidDate && { paidDate })
          }
        })
        
        paymentsForThisContract.push(payment)
        
        // Next month
        paymentDate = new Date(paymentDate)
        paymentDate.setMonth(paymentDate.getMonth() + 1)
      }
      
      console.log(`   🎉 ${paymentsForThisContract.length} payments generated for ${contract.tenant.name}`)
      totalPaymentsCreated += paymentsForThisContract.length
      
      contractsProcessed.push({
        id: contract.id,
        tenant: contract.tenant.name,
        property: contract.property.title,
        status: 'generated',
        paymentsCreated: paymentsForThisContract.length
      })
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully generated ${totalPaymentsCreated} payments for ${contractsProcessed.filter(c => c.status === 'generated').length} contracts`,
      totalPaymentsCreated,
      contractsProcessed: contractsProcessed.length,
      details: contractsProcessed
    })
    
  } catch (error) {
    console.error('Generate payments error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}