import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 TESTANDO MARK-PAID SEM AUTENTICAÇÃO...')

    // Buscar qualquer pagamento PENDING
    const payment = await prisma.payment.findFirst({
      where: {
        status: 'PENDING'
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
        dueDate: 'desc'
      }
    })

    if (!payment) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum pagamento PENDING encontrado para testar'
      })
    }

    console.log('💰 Pagamento encontrado:', payment.id)
    console.log('💰 Valor:', payment.amount)
    console.log('💰 Usuario:', payment.contract.userId)

    // Simular mark as paid
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod: 'TEST',
        notes: 'Teste automatico de mark-paid'
      }
    })

    console.log('✅ Pagamento marcado como PAID')

    // Tentar gerar recibo usando a mesma lógica
    const competencia = new Date(updatedPayment.paidDate || updatedPayment.dueDate)
    const ano = competencia.getFullYear()
    const mes = competencia.getMonth() + 1

    // Contar recibos existentes
    const countResult = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count 
      FROM recibos 
      WHERE "userId" = $1 
      AND competencia >= $2 
      AND competencia < $3
    `, payment.contract.userId, new Date(ano, mes - 1, 1), new Date(ano, mes, 1))
    
    const recibosExistentes = Array.isArray(countResult) && countResult[0] ? Number(countResult[0].count) : 0

    const { ReciboGenerator } = await import('@/lib/recibo-generator')
    const numeroRecibo = ReciboGenerator.gerarNumeroRecibo(payment.contract.userId, ano, mes, recibosExistentes + 1)

    // Calcular valores
    const valorTotal = updatedPayment.amount
    const percentualTaxa = payment.contract.administrationFeePercentage
    const { taxaAdministracao, valorRepassado } = ReciboGenerator.calcularValores(valorTotal, percentualTaxa)

    console.log('💰 Gerando recibo:', numeroRecibo)
    console.log('💰 Valores:', { valorTotal, taxaAdministracao, valorRepassado })

    // Criar recibo
    const dataPagamento = updatedPayment.paidDate || new Date()
    const pdfUrl = `/api/recibos/${numeroRecibo}/pdf`
    const imovelEndereco = `${payment.contract.property.address}, ${payment.contract.property.city} - ${payment.contract.property.state}`
    
    const reciboId = `recibo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO recibos (
        id, "userId", "contractId", "paymentId", "numeroRecibo", 
        competencia, "dataPagamento", "valorTotal", "taxaAdministracao", 
        "percentualTaxa", "valorRepassado", "pdfUrl", "proprietarioNome", 
        "proprietarioDoc", "inquilinoNome", "inquilinoDoc", "imovelEndereco",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
    `, 
      reciboId, payment.contract.userId, payment.contractId, payment.id, numeroRecibo,
      competencia, dataPagamento, valorTotal, taxaAdministracao,
      percentualTaxa, valorRepassado, pdfUrl, payment.contract.property.owner.name,
      payment.contract.property.owner.document, payment.contract.tenant.name, 
      payment.contract.tenant.document, imovelEndereco, new Date(), new Date()
    )

    console.log('✅ Recibo criado com sucesso!')

    return NextResponse.json({
      success: true,
      message: '🎉 Teste concluído com sucesso!',
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        amount: updatedPayment.amount
      },
      recibo: {
        id: reciboId,
        numeroRecibo,
        valorTotal,
        taxaAdministracao
      },
      instructions: [
        '1. Vá para /dashboard/recibos',
        '2. Clique em "Atualizar Lista"', 
        '3. O novo recibo deve aparecer',
        '4. Se funcionar, o problema era de autenticação'
      ]
    })

  } catch (error: any) {
    console.error('❌ Erro no teste:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro no teste mark-paid',
      details: error.message,
      stack: error.stack?.split('\\n').slice(0, 5)
    }, { status: 500 })
  }
}