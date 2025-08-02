import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Debugging properties table...')
    
    // Check properties table structure
    const propertiesTableStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'properties' 
      ORDER BY ordinal_position;
    `
    
    // Count total properties
    const totalProperties = await prisma.property.count()
    
    // Get properties without user filter to see if any exist
    const allProperties = await prisma.property.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        userId: true,
        companyId: true,
        createdAt: true
      }
    })
    
    // Check if there are specific user properties
    let userProperties = []
    try {
      userProperties = await prisma.property.findMany({
        where: {
          userId: { not: null }
        },
        take: 5,
        select: {
          id: true,
          title: true,
          userId: true,
          companyId: true
        }
      })
    } catch (e) {
      userProperties = ['Error: ' + (e instanceof Error ? e.message : 'Unknown')]
    }
    
    return NextResponse.json({
      success: true,
      debug_info: {
        properties_table_structure: propertiesTableStructure,
        total_properties: totalProperties,
        sample_properties: allProperties,
        user_properties_sample: userProperties
      }
    })
    
  } catch (error) {
    console.error('❌ Properties debug failed:', error)
    return NextResponse.json({
      success: false,
      error: "Properties debug failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}