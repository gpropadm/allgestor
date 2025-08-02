import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    console.log('=== GENERATING MISSING PAYMENTS FOR USER ===')
    console.log('👤 User:', { id: user.id, email: user.email })
    
    // Get user's active contracts
    const contracts = await prisma.contract.findMany({
      where: { 
        userId: user.id,
        status: 'ACTIVE'
      },
      include: { 
        tenant: true,
        property: true,
        payments: true
      }
    })
    
    console.log(`📊 Found ${contracts.length} active contracts for user`)
    
    let totalPaymentsCreated = 0
    const contractsProcessed = []
    
    for (const contract of contracts) {
      console.log(`\n📝 Processing contract: ${contract.tenant.name} - ${contract.property.title}`)
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
        
        // Logic: All months before current month = PAID, current and future = PENDING/OVERDUE
        let status = 'PENDING'
        let paidDate = null
        
        if (paymentYear < currentYear || (paymentYear === currentYear && paymentMonth < currentMonth)) {
          // Previous months = automatically PAID
          status = 'PAID'
          paidDate = new Date(paymentDate.getTime() - Math.random() * 10 * 86400000) // Paid 1-10 days before due
        } else if (paymentYear === currentYear && paymentMonth === currentMonth) {
          // Current month: check if already overdue
          if (paymentDate < currentDate) {
            status = 'OVERDUE'
          } else {
            status = 'PENDING'
          }
        } else {
          // Future months = PENDING
          status = 'PENDING'
        }
        
        // Try to create payment with gateway field, fallback if field doesn't exist
        let payment
        try {
          payment = await prisma.payment.create({
            data: {
              contractId: contract.id,
              amount: contract.rentAmount,
              dueDate: new Date(paymentDate),
              status,
              gateway: 'MANUAL', // Default to MANUAL until PJBank is configured
              ...(paidDate && { paidDate })
            }
          })
        } catch (error) {
          // If gateway field doesn't exist, create without it
          console.log('⚠️ Gateway field not available, creating payment without gateway')
          payment = await prisma.payment.create({
            data: {
              contractId: contract.id,
              amount: contract.rentAmount,
              dueDate: new Date(paymentDate),
              status,
              ...(paidDate && { paidDate })
            }
          })
        }
        
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
      message: totalPaymentsCreated > 0 
        ? `Successfully generated ${totalPaymentsCreated} payments for ${contractsProcessed.filter(c => c.status === 'generated').length} contracts`
        : 'All contracts already have payments',
      totalPaymentsCreated,
      contractsProcessed,
      user: {
        id: user.id,
        email: user.email
      }
    })
    
  } catch (error) {
    console.error('❌ Error generating payments:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao gerar pagamentos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}