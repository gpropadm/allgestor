import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUGANDO ACESSO A TABELA RECIBOS...')

    // Tentar buscar todos recibos
    const allRecibos = await prisma.recibo.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('📊 Recibos encontrados:', allRecibos.length)

    // Verificar se tabela existe via SQL direto
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'recibos';
    `

    console.log('🗄️ Tabela existe:', tableCheck)

    // Contar registros via SQL
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM recibos;
    `

    console.log('🔢 Count via SQL:', countResult)

    return NextResponse.json({
      success: true,
      prismaFindMany: {
        count: allRecibos.length,
        data: allRecibos
      },
      tableExists: Array.isArray(tableCheck) && tableCheck.length > 0,
      sqlCount: countResult,
      message: 'Debug concluído',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ ERRO NO DEBUG:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro no debug',
      errorMessage: error.message,
      errorCode: error.code,
      stack: error.stack?.split('\\n').slice(0, 5),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}