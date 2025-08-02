import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    server: 'ok',
    database: 'checking...',
    prisma: 'checking...',
    env: process.env.NODE_ENV,
    error: null
  }
  
  try {
    console.log('🔍 BASIC CHECK: Server responding...')
    results.server = 'responding'
    
    // Test environment variables
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      results.database = 'DATABASE_URL not found'
      results.error = 'Missing DATABASE_URL environment variable'
    } else {
      results.database = 'URL found: ' + dbUrl.substring(0, 30) + '...'
    }
    
    // Test Prisma import
    try {
      const { prisma } = await import('@/lib/db')
      results.prisma = 'imported successfully'
      
      // Try a very basic query
      try {
        await prisma.$connect()
        results.database = 'connected via Prisma'
        
        const userCount = await prisma.user.count()
        results.userCount = userCount
        
        const ownerCount = await prisma.owner.count()
        results.ownerCount = ownerCount
        
        results.database = `connected - ${userCount} users, ${ownerCount} owners`
        
      } catch (queryError) {
        results.database = 'connection failed: ' + (queryError instanceof Error ? queryError.message : 'unknown')
        results.error = queryError instanceof Error ? queryError.message : 'Unknown query error'
      } finally {
        await prisma.$disconnect()
      }
      
    } catch (importError) {
      results.prisma = 'import failed: ' + (importError instanceof Error ? importError.message : 'unknown')
      results.error = importError instanceof Error ? importError.message : 'Unknown import error'
    }
    
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('❌ BASIC CHECK: Error:', error)
    results.error = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(results, { status: 500 })
  }
}