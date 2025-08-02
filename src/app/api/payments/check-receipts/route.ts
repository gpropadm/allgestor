import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== CHECK RECEIPTS API ===')
    
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')
    
    if (!paymentId) {
      return NextResponse.json({
        error: 'PaymentId required as query parameter'
      }, { status: 400 })
    }
    
    // Use direct SQL to check what's actually in the database
    const { Pool } = await import('pg')
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    try {
      const result = await pool.query(`
        SELECT 
          id, 
          status, 
          "paymentMethod",
          "paidDate",
          receipts,
          notes,
          "createdAt",
          "updatedAt"
        FROM payments 
        WHERE id = $1
      `, [paymentId])
      
      await pool.end()
      
      if (result.rows.length === 0) {
        return NextResponse.json({
          error: 'Payment not found',
          paymentId
        }, { status: 404 })
      }
      
      const payment = result.rows[0]
      
      // Parse receipts if it's a string
      let parsedReceipts = null
      if (payment.receipts) {
        try {
          if (typeof payment.receipts === 'string') {
            parsedReceipts = JSON.parse(payment.receipts)
          } else {
            parsedReceipts = payment.receipts
          }
        } catch (parseError) {
          console.error('Error parsing receipts:', parseError)
        }
      }
      
      return NextResponse.json({
        success: true,
        payment: {
          ...payment,
          receipts_raw: payment.receipts,
          receipts_parsed: parsedReceipts,
          receipts_type: typeof payment.receipts,
          receipts_length: payment.receipts ? payment.receipts.length : 0,
          has_receipts: !!payment.receipts,
          first_receipt_url: parsedReceipts?.[0]?.url || null
        }
      })
      
    } catch (sqlError) {
      await pool.end().catch(() => {})
      throw sqlError
    }
    
  } catch (error) {
    console.error('CHECK RECEIPTS ERROR:', error)
    return NextResponse.json({
      error: 'Check receipts failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}