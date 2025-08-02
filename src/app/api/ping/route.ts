import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🏓 PING: Starting basic test...')
    
    return NextResponse.json({
      status: 'ok',
      message: 'Server is responding',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      nodeVersion: process.version
    })
    
  } catch (error) {
    console.error('❌ PING: Error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}