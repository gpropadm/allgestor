import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST MARK-PAID API ===')
    
    // Test 1: Basic response
    const body = await request.json()
    console.log('✅ Test 1: Request body parsed:', body)
    
    // Test 2: Basic validation
    const { paymentId, paymentMethod } = body
    if (!paymentId) {
      return NextResponse.json({ error: 'PaymentId required' }, { status: 400 })
    }
    if (!paymentMethod) {
      return NextResponse.json({ error: 'PaymentMethod required' }, { status: 400 })
    }
    
    console.log('✅ Test 2: Validation passed')
    
    // Test 3: Try to import Prisma
    console.log('🔍 Test 3: Importing Prisma...')
    try {
      const { prisma } = await import('@/lib/db')
      console.log('✅ Test 3: Prisma imported successfully')
      
      // Test 4: Try to connect to database
      console.log('🔍 Test 4: Testing database connection...')
      const userCount = await prisma.user.count()
      console.log('✅ Test 4: Database connection works, users:', userCount)
      
      // Test 5: Try to find the payment
      console.log('🔍 Test 5: Finding payment...')
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      })
      
      if (!payment) {
        console.log('❌ Test 5: Payment not found')
        return NextResponse.json({ 
          error: 'Payment not found',
          paymentId,
          debug: 'Payment does not exist in database'
        }, { status: 404 })
      }
      
      console.log('✅ Test 5: Payment found:', {
        id: payment.id,
        status: payment.status,
        amount: payment.amount
      })
      
      // Test 6: Try to update the payment
      console.log('🔍 Test 6: Updating payment...')
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paidDate: new Date(),
          paymentMethod: paymentMethod,
          notes: `Test payment via ${paymentMethod} - ${new Date().toISOString()}`
        }
      })
      
      console.log('✅ Test 6: Payment updated successfully')
      
      return NextResponse.json({
        success: true,
        message: 'Test mark-paid completed successfully',
        payment: {
          id: updatedPayment.id,
          status: updatedPayment.status,
          paidDate: updatedPayment.paidDate,
          paymentMethod: updatedPayment.paymentMethod
        },
        tests: {
          requestParsing: true,
          validation: true,
          prismaImport: true,
          databaseConnection: true,
          paymentFound: true,
          paymentUpdated: true
        }
      })
      
    } catch (prismaError) {
      console.error('❌ Test 3-6: Prisma/Database error:', prismaError)
      return NextResponse.json({
        error: 'Prisma/Database error',
        details: prismaError instanceof Error ? prismaError.message : 'Unknown error',
        stack: prismaError instanceof Error ? prismaError.stack : undefined,
        tests: {
          requestParsing: true,
          validation: true,
          prismaImport: false,
          databaseConnection: false,
          paymentFound: false,
          paymentUpdated: false
        }
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ TEST MARK-PAID ERROR:', error)
    return NextResponse.json({
      error: 'Test mark-paid failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      tests: {
        requestParsing: false,
        validation: false,
        prismaImport: false,
        databaseConnection: false,
        paymentFound: false,
        paymentUpdated: false
      }
    }, { status: 500 })
  }
}