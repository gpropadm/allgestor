import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Debugging database structure...')
    
    // Check what tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `
    
    // Check bank_accounts table structure if it exists
    let bankTableStructure = null
    try {
      bankTableStructure = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'bank_accounts' 
        ORDER BY ordinal_position;
      `
    } catch (e) {
      bankTableStructure = { error: 'Table does not exist' }
    }
    
    // Check owners table structure
    const ownersTableStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'owners' 
      ORDER BY ordinal_position;
    `
    
    // Try to count records in both tables
    const ownerCount = await prisma.owner.count()
    
    let bankCount = 0
    try {
      bankCount = await prisma.bankAccount.count()
    } catch (e) {
      bankCount = 'ERROR: ' + (e instanceof Error ? e.message : 'Unknown')
    }
    
    return NextResponse.json({
      success: true,
      database_info: {
        tables: tables,
        owners_table: ownersTableStructure,
        bank_accounts_table: bankTableStructure,
        record_counts: {
          owners: ownerCount,
          bank_accounts: bankCount
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Database debug failed:', error)
    return NextResponse.json({
      success: false,
      error: "Database debug failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}