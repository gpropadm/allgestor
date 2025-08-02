import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Debugging contracts table...')
    
    // Check contracts table structure
    const contractsTableStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'contracts' 
      ORDER BY ordinal_position;
    `
    
    // Count total contracts
    const totalContracts = await prisma.contract.count()
    
    // Get sample contracts
    const sampleContracts = await prisma.contract.findMany({
      take: 3,
      select: {
        id: true,
        propertyId: true,
        tenantId: true,
        userId: true,
        companyId: true,
        status: true,
        createdAt: true
      }
    })
    
    // Check properties count for reference
    const propertiesCount = await prisma.property.count()
    const tenantsCount = await prisma.tenant.count()
    
    return NextResponse.json({
      success: true,
      debug_info: {
        contracts_table_structure: contractsTableStructure,
        total_contracts: totalContracts,
        sample_contracts: sampleContracts,
        reference_counts: {
          properties: propertiesCount,
          tenants: tenantsCount
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Contracts debug failed:', error)
    return NextResponse.json({
      success: false,
      error: "Contracts debug failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}