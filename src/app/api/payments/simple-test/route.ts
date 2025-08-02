import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('=== SIMPLE TEST API ===')
    
    // Test 1: Basic response
    console.log('✅ Test 1: Basic API response works')
    
    // Test 2: Database connection
    try {
      const userCount = await prisma.user.count()
      console.log('✅ Test 2: Database connection works, users:', userCount)
    } catch (dbError) {
      console.error('❌ Test 2: Database connection failed:', dbError)
      return NextResponse.json({
        error: 'Database connection failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 })
    }
    
    // Test 3: Auth
    try {
      const user = await requireAuth(request)
      console.log('✅ Test 3: Auth works for user:', user.email)
      
      // Test 4: Get user's data
      const contracts = await prisma.contract.count({
        where: { userId: user.id }
      })
      
      const payments = await prisma.payment.count({
        where: {
          contract: {
            userId: user.id
          }
        }
      })
      
      console.log('✅ Test 4: User data - contracts:', contracts, 'payments:', payments)
      
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email
        },
        data: {
          contracts,
          payments
        }
      })
      
    } catch (authError) {
      console.error('❌ Test 3: Auth failed:', authError)
      return NextResponse.json({
        error: 'Auth failed',
        details: authError instanceof Error ? authError.message : 'Unknown error'
      }, { status: 401 })
    }
    
  } catch (error) {
    console.error('❌ SIMPLE TEST FAILED:', error)
    return NextResponse.json({
      error: 'Simple test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}