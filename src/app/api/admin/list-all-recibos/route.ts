import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 LISTANDO TODOS OS RECIBOS NO BANCO...')

    // Buscar todos os recibos sem filtro de usuário
    const rawRecibos = await prisma.$queryRawUnsafe(`
      SELECT 
        r.id,
        r."userId",
        r."numeroRecibo",
        r.competencia,
        r."dataPagamento",
        CAST(r."valorTotal" AS TEXT) as "valorTotal",
        CAST(r."taxaAdministracao" AS TEXT) as "taxaAdministracao",
        r."proprietarioNome",
        r."inquilinoNome",
        r."createdAt"
      FROM recibos r
      ORDER BY r."createdAt" DESC
    `)
    
    console.log('📊 Total de recibos no banco:', Array.isArray(rawRecibos) ? rawRecibos.length : 0)
    console.log('📋 Recibos:', rawRecibos)

    return NextResponse.json({
      success: true,
      totalRecibos: Array.isArray(rawRecibos) ? rawRecibos.length : 0,
      recibos: rawRecibos,
      message: 'Lista completa de recibos no banco'
    })

  } catch (error: any) {
    console.error('❌ Erro ao listar recibos:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao listar recibos',
      details: error.message
    }, { status: 500 })
  }
}