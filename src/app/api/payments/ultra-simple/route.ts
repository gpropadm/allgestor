import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== ULTRA SIMPLE MARK-PAID ===')
    
    const body = await request.json()
    console.log('Body received:', body)
    
    const { paymentId, paymentMethod } = body
    
    if (!paymentId) {
      return NextResponse.json({ error: 'PaymentId required' }, { status: 400 })
    }
    
    if (!paymentMethod) {
      return NextResponse.json({ error: 'PaymentMethod required' }, { status: 400 })
    }
    
    // Create completely new Prisma instance to avoid conflicts
    console.log('Creating fresh Prisma instance...')
    
    const { PrismaClient } = await import('@prisma/client')
    const freshPrisma = new PrismaClient({
      log: ['error'],
    })
    
    try {
      console.log('Connecting to database...')
      await freshPrisma.$connect()
      
      console.log('Finding payment...')
      const payment = await freshPrisma.payment.findUnique({
        where: { id: paymentId },
        select: {
          id: true,
          status: true,
          amount: true
        }
      })
      
      if (!payment) {
        await freshPrisma.$disconnect()
        return NextResponse.json({ 
          error: 'Payment not found',
          paymentId 
        }, { status: 404 })
      }
      
      console.log('Payment found, status:', payment.status)
      
      if (payment.status === 'PAID') {
        await freshPrisma.$disconnect()
        return NextResponse.json({ 
          error: 'Payment already paid' 
        }, { status: 400 })
      }
      
      console.log('Updating payment...')
      const updatedPayment = await freshPrisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paidDate: new Date(),
          paymentMethod: paymentMethod,
          notes: `Ultra simple payment - ${new Date().toISOString()}`
        },
        select: {
          id: true,
          status: true,
          paidDate: true,
          paymentMethod: true
        }
      })
      
      console.log('Payment updated successfully')
      await freshPrisma.$disconnect()
      
      return NextResponse.json({
        success: true,
        message: 'Ultra simple mark-paid successful',
        payment: updatedPayment
      })
      
    } catch (prismaError) {
      console.error('Prisma error:', prismaError)
      await freshPrisma.$disconnect()
      
      return NextResponse.json({
        error: 'Prisma operation failed',
        details: prismaError instanceof Error ? prismaError.message : 'Unknown Prisma error',
        prismaStack: prismaError instanceof Error ? prismaError.stack : undefined
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('ULTRA SIMPLE ERROR:', error)
    return NextResponse.json({
      error: 'Ultra simple failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}