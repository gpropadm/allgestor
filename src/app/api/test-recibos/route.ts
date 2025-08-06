import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST RECIBOS API (NO AUTH) ===')
    
    // Buscar todos os recibos sem filtro para teste
    const allRecibos = await prisma.recibo.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    console.log('📋 Recibos encontrados:', allRecibos.length)

    // Converter BigInt para string
    const serializedRecibos = allRecibos.map(recibo => ({
      id: recibo.id.toString(),
      userId: recibo.userId,
      numeroRecibo: recibo.numeroRecibo,
      valorTotal: Number(recibo.valorTotal),
      taxaAdministracao: Number(recibo.taxaAdministracao),
      percentualTaxa: Number(recibo.percentualTaxa),
      valorRepassado: Number(recibo.valorRepassado),
      proprietarioNome: recibo.proprietarioNome,
      inquilinoNome: recibo.inquilinoNome,
      observacoes: recibo.observacoes,
      dataPagamento: recibo.dataPagamento?.toISOString(),
      createdAt: recibo.createdAt?.toISOString()
    }))

    return NextResponse.json({
      success: true,
      count: allRecibos.length,
      recibos: serializedRecibos,
      message: `Encontrados ${allRecibos.length} recibos no total`
    })

  } catch (error) {
    console.error('❌ Erro ao buscar recibos:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar recibos de teste',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}