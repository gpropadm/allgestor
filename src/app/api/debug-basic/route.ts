import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET() {
  try {
    // Test 1: Basic response
    console.log('🧪 BASIC TEST: Starting...')
    
    // Test 2: Database connection
    const userCount = await prisma.user.count()
    console.log('📊 Database connection OK, users:', userCount)
    
    // Test 3: Prisma client version
    console.log('🔧 Prisma client available:', !!prisma)
    
    return NextResponse.json({
      success: true,
      database: 'connected',
      userCount: userCount,
      prisma: 'available',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ BASIC TEST Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 POST TEST: Starting...')
    
    // Test 1: Auth
    let user
    try {
      user = await requireAuth(request)
      console.log('✅ Auth OK:', user.id)
    } catch (authError) {
      console.error('❌ Auth failed:', authError)
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        details: authError instanceof Error ? authError.message : 'Auth error'
      }, { status: 401 })
    }
    
    // Test 2: Request body
    let data
    try {
      data = await request.json()
      console.log('📝 Request data OK:', Object.keys(data))
    } catch (parseError) {
      console.error('❌ JSON parse failed:', parseError)
      return NextResponse.json({
        success: false,
        error: 'JSON parse failed',
        details: parseError instanceof Error ? parseError.message : 'Parse error'
      }, { status: 400 })
    }
    
    // Test 3: Simple database query
    try {
      const ownerCount = await prisma.owner.count({
        where: { companyId: user.companyId }
      })
      console.log('📊 Owner count query OK:', ownerCount)
    } catch (dbError) {
      console.error('❌ Database query failed:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        details: dbError instanceof Error ? dbError.message : 'DB error'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'All basic tests passed',
      user: { id: user.id, companyId: user.companyId },
      dataKeys: Object.keys(data)
    })
    
  } catch (error) {
    console.error('❌ POST TEST Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Critical error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}