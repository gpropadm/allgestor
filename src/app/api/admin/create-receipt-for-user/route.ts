import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Precisa informar userId na URL: ?userId=SEU_USER_ID'
      })
    }

    console.log('🧾 CRIANDO RECIBO PARA USUÁRIO:', userId)

    // Buscar qualquer pagamento PAID deste usuário
    const payment = await prisma.payment.findFirst({
      where: {
        status: 'PAID',
        contract: {
          userId: userId
        }
      },
      include: {
        contract: {
          include: {
            property: {
              include: {
                owner: true
              }
            },
            tenant: true
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
        message: `Nenhum pagamento PAID encontrado para usuário ${userId}`
      })
    }

    // Dados para o recibo
    const now = new Date()
    const reciboId = `recibo_${Date.now()}_user${userId.slice(-4)}`
    const numeroRecibo = `USER-${Date.now()}`
    
    const valorTotal = Number(payment.amount)
    const percentualTaxa = 10
    const taxaAdministracao = valorTotal * 0.1
    const valorRepassado = valorTotal - taxaAdministracao

    console.log('🧾 Inserindo recibo para usuário específico...')

    // Inserção direta que SABEMOS que funciona
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
        '/api/user.pdf', '${payment.contract.property.owner.name}', 
        '${payment.contract.property.owner.document}', '${payment.contract.tenant.name}', 
        '${payment.contract.tenant.document}', 'Endereco do Usuario',
        'Recibo criado para usuário específico', '${now.toISOString()}', '${now.toISOString()}'
      )
    `)

    console.log('✅ Recibo criado para usuário!')

    return NextResponse.json({
      success: true,
      message: '🎉 Recibo criado com sucesso para seu usuário!',
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
      error: 'Erro ao criar recibo para usuário',
      details: error.message
    }, { status: 500 })
  }
}