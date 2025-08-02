import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== SQL MARK-PAID API ===')
    
    const body = await request.json()
    const { paymentId, paymentMethod, notes, receipts } = body
    
    if (!paymentId || !paymentMethod) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 })
    }
    
    console.log('Attempting SQL approach...')
    
    // Use direct database connection
    const { Pool } = await import('pg')
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    try {
      // Find payment first
      const findResult = await pool.query(
        'SELECT id, status, amount FROM payments WHERE id = $1',
        [paymentId]
      )
      
      if (findResult.rows.length === 0) {
        await pool.end()
        return NextResponse.json({
          error: 'Payment not found'
        }, { status: 404 })
      }
      
      const payment = findResult.rows[0]
      console.log('Payment found:', payment.id)
      
      if (payment.status === 'PAID') {
        await pool.end()
        return NextResponse.json({
          error: 'Payment already paid'
        }, { status: 400 })
      }
      
      // Update payment
      const updateResult = await pool.query(`
        UPDATE payments 
        SET 
          status = $1,
          "paidDate" = $2,
          "paymentMethod" = $3,
          notes = $4,
          receipts = $5,
          "updatedAt" = $6
        WHERE id = $7
        RETURNING id, status, "paidDate", "paymentMethod"
      `, [
        'PAID',
        new Date(),
        paymentMethod,
        notes || `SQL payment via ${paymentMethod} - ${new Date().toISOString()}`,
        receipts ? JSON.stringify(receipts) : null,
        new Date(),
        paymentId
      ])
      
      await pool.end()
      
      if (updateResult.rows.length === 0) {
        return NextResponse.json({
          error: 'Failed to update payment'
        }, { status: 500 })
      }
      
      const updatedPayment = updateResult.rows[0]
      console.log('Payment updated successfully via SQL')
      
      return NextResponse.json({
        success: true,
        message: 'Payment marked as paid successfully (SQL)',
        payment: {
          id: updatedPayment.id,
          status: updatedPayment.status,
          paidDate: updatedPayment.paidDate,
          paymentMethod: updatedPayment.paymentMethod
        }
      })
      
    } catch (sqlError) {
      await pool.end().catch(() => {})
      throw sqlError
    }
    
  } catch (error) {
    console.error('SQL MARK-PAID ERROR:', error)
    return NextResponse.json({
      error: 'SQL mark-paid failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}