import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG API PAYMENTS ALL MONTHS ===')
    const user = await requireAuth(request)
    console.log('✅ User authenticated:', user.email)
    
    // Step 1: Get user contracts
    console.log('🔍 Step 1: Getting user contracts...')
    const userContracts = await prisma.contract.findMany({
      where: { userId: user.id },
      select: { id: true }
    })
    console.log('📋 Found contracts:', userContracts.length)
    
    if (userContracts.length === 0) {
      console.log('❌ No contracts found')
      return NextResponse.json([])
    }
    
    const contractIds = userContracts.map(c => c.id)
    console.log('🔗 Contract IDs:', contractIds)
    
    // Step 2: Get payments (basic query first)
    console.log('🔍 Step 2: Getting payments...')
    const payments = await prisma.payment.findMany({
      where: {
        contractId: { in: contractIds }
      },
      select: {
        id: true,
        contractId: true,
        amount: true,
        dueDate: true,
        status: true,
        createdAt: true
      },
      orderBy: { dueDate: 'desc' },
      take: 10 // Limit for testing
    })
    console.log('💰 Found payments:', payments.length)
    
    if (payments.length === 0) {
      console.log('❌ No payments found')
      return NextResponse.json([])
    }
    
    // Step 3: Try to enrich just one payment
    console.log('🔍 Step 3: Testing enrichment with first payment...')
    const firstPayment = payments[0]
    console.log('🎯 Testing payment:', firstPayment.id)
    
    // Get contract
    const contract = await prisma.contract.findUnique({
      where: { id: firstPayment.contractId },
      select: {
        id: true,
        propertyId: true,
        tenantId: true,
        rentAmount: true
      }
    })
    console.log('📋 Contract found:', contract ? 'Yes' : 'No')
    
    if (!contract) {
      console.log('❌ Contract not found')
      return NextResponse.json([{
        ...firstPayment,
        error: 'Contract not found'
      }])
    }
    
    // Get property
    console.log('🔍 Getting property...')
    const property = await prisma.property.findUnique({
      where: { id: contract.propertyId },
      select: { title: true, address: true }
    })
    console.log('🏠 Property found:', property ? 'Yes' : 'No')
    
    // Get tenant
    console.log('🔍 Getting tenant...')
    const tenant = await prisma.tenant.findUnique({
      where: { id: contract.tenantId },
      select: { name: true, email: true, phone: true }
    })
    console.log('👤 Tenant found:', tenant ? 'Yes' : 'No')
    
    // Test maintenance query separately
    console.log('🔍 Testing maintenance query...')
    let maintenances = []
    let maintenanceError = null
    
    try {
      const maintenanceCount = await prisma.maintenance.count()
      console.log('🔧 Total maintenances in system:', maintenanceCount)
      
      maintenances = await prisma.maintenance.findMany({
        where: {
          contractId: contract.id,
          deductFromOwner: true,
          status: 'COMPLETED'
        },
        select: {
          id: true,
          amount: true,
          title: true,
          completedDate: true
        },
        take: 5
      })
      console.log('🔧 Maintenances for contract:', maintenances.length)
    } catch (error) {
      console.error('❌ Maintenance query failed:', error)
      maintenanceError = error.message
    }
    
    const result = {
      debug: {
        userId: user.id,
        userEmail: user.email,
        contractsCount: userContracts.length,
        paymentsCount: payments.length,
        maintenanceError,
        maintenancesCount: maintenances.length
      },
      testPayment: {
        ...firstPayment,
        contract: {
          ...contract,
          property: property || { title: 'Property not found', address: '' },
          tenant: tenant || { name: 'Tenant not found', email: '', phone: '' }
        },
        maintenances,
        maintenanceDeductions: maintenances.reduce((total, m) => total + m.amount, 0)
      }
    }
    
    console.log('✅ Debug API completed successfully')
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ DEBUG API ERROR:', error)
    return NextResponse.json(
      { 
        error: 'Debug API failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}