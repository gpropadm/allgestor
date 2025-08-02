import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'Server OK',
    timestamp: new Date().toISOString(),
    message: 'Se você está vendo isso, o servidor Next.js está funcionando'
  })
}