import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'cmdusefap0002uc3tnmol495a' // default user

    console.log('🧾 Criando recibo manual para userId:', userId)

    // Buscar um pagamento PAGO deste usuário
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
            property: { include: { owner: true } },
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
        error: 'Nenhum pagamento PAGO encontrado para este usuário',
        userId
      })
    }

    // Verificar se já existe recibo para este payment
    const existingRecibo = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM recibos WHERE "paymentId" = ${payment.id}
    `
    
    if (Array.isArray(existingRecibo) && existingRecibo[0] && Number(existingRecibo[0].count) > 0) {
      return NextResponse.json({
        success: false,
        error: 'Já existe recibo para este pagamento',
        paymentId: payment.id
      })
    }

    // Dados do recibo
    const now = new Date()
    const reciboId = `recibo_${Date.now()}_manual`
    const numeroRecibo = `MANUAL-${Date.now()}`
    
    const valorTotal = Number(payment.amount)
    const percentualTaxa = 10
    const taxaAdministracao = valorTotal * 0.1
    const valorRepassado = valorTotal - taxaAdministracao

    console.log('🧾 Inserindo recibo:', {
      reciboId,
      numeroRecibo,
      userId,
      paymentId: payment.id,
      valorTotal
    })

    // Inserir recibo
    await prisma.$executeRaw`
      INSERT INTO recibos (
        id, "userId", "contractId", "paymentId", "numeroRecibo", 
        competencia, "dataPagamento", "valorTotal", "taxaAdministracao", 
        "percentualTaxa", "valorRepassado", "pdfUrl", "proprietarioNome", 
        "proprietarioDoc", "inquilinoNome", "inquilinoDoc", "imovelEndereco",
        "observacoes", "createdAt", "updatedAt"
      ) VALUES (
        ${reciboId}, ${userId}, ${payment.contractId}, ${payment.id}, ${numeroRecibo},
        ${now}, ${now}, 
        ${valorTotal}, ${taxaAdministracao}, ${percentualTaxa}, ${valorRepassado},
        ${'/api/manual.pdf'}, ${payment.contract.property.owner.name}, 
        ${payment.contract.property.owner.document}, ${payment.contract.tenant.name}, 
        ${payment.contract.tenant.document}, ${'Endereço do imóvel'},
        ${'Recibo gerado manualmente para teste'}, ${now}, ${now}
      )
    `

    console.log('✅ Recibo criado com sucesso!')

    return NextResponse.json({
      success: true,
      message: `Recibo ${numeroRecibo} criado com sucesso`,
      recibo: {
        id: reciboId,
        numeroRecibo,
        userId,
        paymentId: payment.id,
        valorTotal,
        taxaAdministracao,
        proprietario: payment.contract.property.owner.name,
        inquilino: payment.contract.tenant.name
      }
    })

  } catch (error: any) {
    console.error('❌ Erro ao criar recibo manual:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao criar recibo manual',
      details: error.message
    }, { status: 500 })
  }
}