import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Buscar o último recibo criado
    const lastReceipt = await prisma.$queryRawUnsafe(`
      SELECT 
        id,
        "userId",
        "numeroRecibo",
        "valorTotal",
        "createdAt"
      FROM recibos 
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `)

    // Buscar total de recibos
    const totalCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM recibos
    `)

    // Buscar último pagamento PAID
    const lastPayment = await prisma.payment.findFirst({
      where: { status: 'PAID' },
      orderBy: { paidDate: 'desc' },
      select: { 
        id: true, 
        paidDate: true,
        contract: {
          select: { userId: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      totalRecibosNoBanco: Array.isArray(totalCount) ? totalCount[0]?.count : 0,
      ultimoRecibo: Array.isArray(lastReceipt) ? lastReceipt[0] : null,
      ultimoPagamentoPaid: lastPayment,
      message: 'Verificação de recibos concluída'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
}