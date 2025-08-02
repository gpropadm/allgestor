import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    console.log('=== GENERATING PAYMENTS SIMPLE ===')
    console.log('👤 User:', { id: user.id, email: user.email })
    
    // Get user's active contracts with minimal fields
    const contracts = await prisma.contract.findMany({
      where: { 
        userId: user.id,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        rentAmount: true,
        tenant: {
          select: { name: true }
        },
        property: {
          select: { title: true }
        }
      }
    })
    
    console.log(`📊 Found ${contracts.length} active contracts`)
    
    if (contracts.length === 0) {
      return NextResponse.json({
        error: 'No active contracts found for this user'
      }, { status: 404 })
    }
    
    let totalPaymentsCreated = 0
    const contractsProcessed = []
    
    for (const contract of contracts) {
      console.log(`\n📝 Processing: ${contract.tenant.name}`)
      
      // Check if contract already has payments
      const existingPayments = await prisma.payment.count({
        where: { contractId: contract.id }
      })
      
      if (existingPayments > 0) {
        console.log(`   ✅ Already has ${existingPayments} payments - SKIPPING`)
        contractsProcessed.push({
          tenant: contract.tenant.name,
          status: 'skipped',
          reason: 'Already has payments'
        })
        continue
      }
      
      console.log(`   🎯 No payments found - generating...`)
      
      // Generate payments for contract period
      const startDate = new Date(contract.startDate)
      const endDate = new Date(contract.endDate)
      const dayOfMonth = startDate.getDate()
      
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      
      let paymentDate = new Date(startDate)
      paymentDate.setDate(dayOfMonth)
      
      if (paymentDate < startDate) {
        paymentDate.setMonth(paymentDate.getMonth() + 1)
      }
      
      let paymentsCreated = 0
      
      while (paymentDate <= endDate) {
        const paymentMonth = paymentDate.getMonth()
        const paymentYear = paymentDate.getFullYear()
        
        // Simple status logic
        let status = 'PENDING'
        let paidDate = null
        
        if (paymentYear < currentYear || (paymentYear === currentYear && paymentMonth < currentMonth)) {
          status = 'PAID'
          paidDate = new Date(paymentDate.getTime() - Math.random() * 5 * 86400000)
        } else if (paymentYear === currentYear && paymentMonth === currentMonth) {
          if (paymentDate < currentDate) {
            status = 'OVERDUE'
          }
        }
        
        // Create payment with minimal fields
        const payment = await prisma.payment.create({
          data: {
            contractId: contract.id,
            amount: contract.rentAmount,
            dueDate: new Date(paymentDate),
            status,
            ...(paidDate && { paidDate })
          }
        })
        
        paymentsCreated++
        
        // Next month
        paymentDate = new Date(paymentDate)
        paymentDate.setMonth(paymentDate.getMonth() + 1)
      }
      
      console.log(`   🎉 Created ${paymentsCreated} payments`)
      totalPaymentsCreated += paymentsCreated
      
      contractsProcessed.push({
        tenant: contract.tenant.name,
        status: 'generated',
        paymentsCreated
      })
    }
    
    return NextResponse.json({
      success: true,
      message: `Generated ${totalPaymentsCreated} payments for ${contractsProcessed.filter(c => c.status === 'generated').length} contracts`,
      totalPaymentsCreated,
      contractsProcessed
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
      { error: 'Erro interno', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}