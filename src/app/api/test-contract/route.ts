import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/db'

export async function POST(_request: NextRequest) {
  try {
    console.log('🧪 Testing contract creation without auth...')
    
    // Get a sample property and tenant to test with
    const sampleProperty = await prisma.property.findFirst()
    const sampleTenant = await prisma.tenant.findFirst()
    
    if (!sampleProperty || !sampleTenant) {
      return NextResponse.json({
        error: 'No sample data available',
        properties: await prisma.property.count(),
        tenants: await prisma.tenant.count()
      }, { status: 400 })
    }
    
    console.log('📋 Sample data found:', {
      property: { id: sampleProperty.id, title: sampleProperty.title },
      tenant: { id: sampleTenant.id, name: sampleTenant.name }
    })
    
    // Try to create a test contract
    const testContract = await prisma.contract.create({
      data: {
        propertyId: sampleProperty.id,
        tenantId: sampleTenant.id,
        companyId: sampleProperty.companyId,
        userId: sampleProperty.userId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        rentAmount: 1000.0,
        depositAmount: 1000.0,
        administrationFeePercentage: 10.0,
        managementFeePercentage: 0.0,
        iptuDeductible: false,
        condominiumDeductible: false,
        maintenanceDeductible: false,
        status: 'ACTIVE',
        terms: 'Test contract'
      }
    })
    
    console.log('✅ Test contract created:', testContract.id)
    
    return NextResponse.json({
      success: true,
      message: "Test contract created successfully",
      contract_id: testContract.id
    })
    
  } catch (error) {
    console.error('❌ Test contract creation failed:', error)
    return NextResponse.json({
      success: false,
      error: "Test contract creation failed",
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 1000) : 'No stack'
    }, { status: 500 })
  }
}