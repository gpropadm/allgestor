import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Debugging settings table...')
    
    // Check settings table structure
    const settingsTableStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'settings' 
      ORDER BY ordinal_position;
    `
    
    // Count total settings
    const totalSettings = await prisma.settings.count()
    
    // Get sample settings
    const sampleSettings = await prisma.settings.findMany({
      take: 3
    })
    
    return NextResponse.json({
      success: true,
      debug_info: {
        settings_table_structure: settingsTableStructure,
        total_settings: totalSettings,
        sample_settings: sampleSettings
      }
    })
    
  } catch (error) {
    console.error('❌ Settings debug failed:', error)
    return NextResponse.json({
      success: false,
      error: "Settings debug failed", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}