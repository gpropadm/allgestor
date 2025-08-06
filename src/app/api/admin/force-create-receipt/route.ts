import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🧾 FORÇANDO CRIAÇÃO DE RECIBO...')

    // Buscar qualquer pagamento PAID
    const payment = await prisma.payment.findFirst({
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

    if (!payment) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum pagamento PAID encontrado'
      })
    }

    console.log('💰 Pagamento encontrado:', payment.id)

    // Dados básicos
    const userId = payment.contract.userId
    const now = new Date()
    const reciboId = `recibo_${Date.now()}_manual`
    const numeroRecibo = `MANUAL-${Date.now()}`
    
    // Valores corretos baseados no payment
    const valorTotal = Number(payment.amount)
    const percentualTaxa = 10
    const taxaAdministracao = valorTotal * 0.1
    const valorRepassado = valorTotal - taxaAdministracao

    console.log('🧾 Inserindo recibo manual...')

    // Inserção direta simples
    await prisma.$executeRawUnsafe(`
      INSERT INTO recibos (
        id, "userId", "contractId", "paymentId", "numeroRecibo", 
        competencia, "dataPagamento", "valorTotal", "taxaAdministracao", 
        "percentualTaxa", "valorRepassado", "pdfUrl", "proprietarioNome", 
        "proprietarioDoc", "inquilinoNome", "inquilinoDoc", "imovelEndereco",
        "observacoes", "createdAt", "updatedAt"
      ) VALUES (
        '${reciboId}', '${userId}', '${payment.contractId}', '${payment.id}', '${numeroRecibo}',
        '${now.toISOString()}', '${now.toISOString()}', 
        ${valorTotal}, ${taxaAdministracao}, ${percentualTaxa}, ${valorRepassado},
        '/api/manual.pdf', '${payment.contract.property.owner.name}', 
        '${payment.contract.property.owner.document}', '${payment.contract.tenant.name}', 
        '${payment.contract.tenant.document}', 'Endereco Manual',
        'Recibo criado manualmente para teste', '${now.toISOString()}', '${now.toISOString()}'
      )
    `)

    console.log('✅ Recibo manual criado!')

    return NextResponse.json({
      success: true,
      message: '🎉 Recibo criado com sucesso!',
      recibo: {
        id: reciboId,
        numeroRecibo,
        valorTotal,
        userId
      },
      instructions: [
        '1. Vá para /dashboard/recibos',
        '2. Clique em "Atualizar Lista"',
        '3. O recibo deve aparecer agora!'
      ]
    })

  } catch (error: any) {
    console.error('❌ Erro:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao criar recibo manual',
      details: error.message
    }, { status: 500 })
  }
}