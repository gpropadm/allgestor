import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log('🔍 DEBUG USER:', user.id)
    
    // Buscar TODOS os recibos
    const allRecibos = await prisma.$queryRaw`SELECT id, "userId", "numeroRecibo", "valorTotal" FROM recibos`
    
    // Buscar recibos do usuário atual
    const userRecibos = await prisma.$queryRaw`SELECT id, "userId", "numeroRecibo", "valorTotal" FROM recibos WHERE "userId" = ${user.id}`
    
    return NextResponse.json({
      success: true,
      debug: {
        currentUserId: user.id,
        currentUserEmail: user.email,
        allRecibosCount: Array.isArray(allRecibos) ? allRecibos.length : 0,
        userRecibosCount: Array.isArray(userRecibos) ? userRecibos.length : 0,
        allRecibos: allRecibos,
        userRecibos: userRecibos
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}