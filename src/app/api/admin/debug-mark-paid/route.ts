import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 VERIFICANDO ÚLTIMO PAGAMENTO MARCADO COMO PAGO...')

    // Buscar o pagamento mais recente marcado como PAID
    const lastPaidPayment = await prisma.payment.findFirst({
      where: {
        status: 'PAID'
      },
      include: {
        contract: {
          include: {
            property: {
              include: {
                owner: true
              }
            },
            tenant: true,
            company: true
          }
        }
      },
      orderBy: {
        paidDate: 'desc'
      }
    })

    if (!lastPaidPayment) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum pagamento PAID encontrado'
      })
    }

    console.log('💰 Último pagamento PAID:', lastPaidPayment.id)
    console.log('💰 paidDate:', lastPaidPayment.paidDate)
    console.log('💰 userId:', lastPaidPayment.contract.userId)

    // Verificar se tem recibo para este pagamento
    const recibo = await prisma.$queryRawUnsafe(`
      SELECT * FROM recibos WHERE "paymentId" = $1
    `, lastPaidPayment.id)

    console.log('🧾 Recibo encontrado:', recibo)

    // Tentar gerar recibo manualmente para este pagamento
    const competencia = new Date(lastPaidPayment.paidDate || lastPaidPayment.dueDate)
    const ano = competencia.getFullYear()
    const mes = competencia.getMonth() + 1

    console.log('📅 Competência:', { ano, mes, competencia })

    // Contar recibos existentes
    const countResult = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count 
      FROM recibos 
      WHERE "userId" = $1 
      AND competencia >= $2 
      AND competencia < $3
    `, lastPaidPayment.contract.userId, new Date(ano, mes - 1, 1), new Date(ano, mes, 1))
    
    const recibosExistentes = Array.isArray(countResult) && countResult[0] ? Number(countResult[0].count) : 0

    console.log('🔢 Recibos existentes na competência:', recibosExistentes)

    return NextResponse.json({
      success: true,
      lastPaidPayment: {
        id: lastPaidPayment.id,
        amount: lastPaidPayment.amount,
        paidDate: lastPaidPayment.paidDate,
        userId: lastPaidPayment.contract.userId,
        contractId: lastPaidPayment.contractId
      },
      reciboExists: Array.isArray(recibo) && recibo.length > 0,
      recibosExistentesNaCompetencia: recibosExistentes,
      debug: {
        competencia: competencia.toISOString(),
        ano,
        mes,
        countResult
      }
    })

  } catch (error: any) {
    console.error('❌ Erro no debug:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro no debug mark-paid',
      details: error.message,
      stack: error.stack?.split('\\n').slice(0, 5)
    }, { status: 500 })
  }
}