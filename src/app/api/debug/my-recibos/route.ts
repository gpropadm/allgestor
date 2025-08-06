import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log('🔍 DEBUG: Verificando recibos para usuário:', user.id)

    // Buscar todos os recibos do usuário logado
    const recibos = await prisma.$queryRawUnsafe(`
      SELECT 
        r.id,
        r."userId",
        r."numeroRecibo",
        CAST(r."valorTotal" AS DECIMAL) as "valorTotal",
        CAST(r."taxaAdministracao" AS DECIMAL) as "taxaAdministracao",
        r."proprietarioNome",
        r."inquilinoNome",
        r."createdAt"
      FROM recibos r
      WHERE r."userId" = $1
      ORDER BY r."createdAt" DESC
    `, user.id)

    // Buscar também todos os recibos (para comparação)
    const todosRecibos = await prisma.$queryRawUnsafe(`
      SELECT 
        r.id,
        r."userId", 
        r."numeroRecibo",
        CAST(r."valorTotal" AS DECIMAL) as "valorTotal"
      FROM recibos r
      ORDER BY r."createdAt" DESC
    `)

    return NextResponse.json({
      success: true,
      usuarioLogado: {
        id: user.id,
        email: user.email
      },
      recibosDoUsuario: recibos,
      totalRecibosDoUsuario: Array.isArray(recibos) ? recibos.length : 0,
      todosRecibosNoBanco: todosRecibos,
      message: recibos.length === 0 
        ? '⚠️  Nenhum recibo encontrado para este usuário'
        : `✅ ${recibos.length} recibo(s) encontrado(s) para este usuário`
    })

  } catch (error: any) {
    console.error('❌ Erro no debug:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar dados de debug',
      details: error.message
    }, { status: 500 })
  }
}