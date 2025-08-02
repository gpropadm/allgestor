import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== BASIC TEST API ===')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const { paymentId, paymentMethod } = body
    
    if (!paymentId || !paymentMethod) {
      return NextResponse.json({
        error: 'Missing required fields',
        received: { paymentId, paymentMethod }
      }, { status: 400 })
    }
    
    // Just return success without touching database
    return NextResponse.json({
      success: true,
      message: 'Basic test successful - no database operations',
      received: {
        paymentId,
        paymentMethod,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('BASIC TEST ERROR:', error)
    return NextResponse.json({
      error: 'Basic test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}