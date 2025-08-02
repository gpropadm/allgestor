import { NextRequest, NextResponse } from "next/server"
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(_request: NextRequest) {
  try {
    console.log('🔄 Starting database migration...')
    
    // Run prisma db push to sync schema
    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss')
    
    console.log('✅ Migration completed:', stdout)
    if (stderr) console.warn('⚠️ Migration warnings:', stderr)
    
    return NextResponse.json({
      success: true,
      message: "Database schema synchronized successfully",
      output: stdout,
      warnings: stderr || null
    })
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json({
      success: false,
      error: "Migration failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
