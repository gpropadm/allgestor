import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('=== NO-AUTH TEST API ===')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const { paymentId, paymentMethod } = body
    
    if (!paymentId || !paymentMethod) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 })
    }
    
    // Try database operations without auth
    console.log('Testing database operations...')
    
    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })
    
    if (!payment) {
      return NextResponse.json({
        error: 'Payment not found',
        paymentId
      }, { status: 404 })
    }
    
    console.log('Payment found:', payment.id)
    
    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod: paymentMethod,
        notes: `No-auth test payment - ${new Date().toISOString()}`
      }
    })
    
    console.log('Payment updated successfully')
    
    return NextResponse.json({
      success: true,
      message: 'No-auth test successful',
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        paidDate: updatedPayment.paidDate
      }
    })
    
  } catch (error) {
    console.error('NO-AUTH TEST ERROR:', error)
    return NextResponse.json({
      error: 'No-auth test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}