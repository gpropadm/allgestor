import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log('🧪 TESTANDO GERAÇÃO DE RECIBO...')
    console.log('User ID:', user.id)

    // Buscar um pagamento PAID recente do usuário
    const payment = await prisma.payment.findFirst({
      where: {
        status: 'PAID',
        contract: {
          userId: user.id
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
        message: 'Nenhum pagamento PAID encontrado para testar',
        suggestion: 'Marque um pagamento como pago primeiro'
      })
    }

    console.log('💰 Pagamento encontrado:', payment.id)
    console.log('💰 Valor:', payment.amount)
    console.log('🏠 Contrato:', payment.contract.id)

    // Verificar se já existe recibo
    const reciboExistente = await prisma.recibo.findUnique({
      where: {
        paymentId: payment.id
      }
    })

    if (reciboExistente) {
      return NextResponse.json({
        success: true,
        message: 'Recibo já existe para este pagamento',
        recibo: {
          numero: reciboExistente.numeroRecibo,
          valor: reciboExistente.valorTotal,
          data: reciboExistente.dataPagamento
        },
        paymentId: payment.id
      })
    }

    console.log('🧾 Gerando recibo para pagamento:', payment.id)

    // Importar o gerador
    const { ReciboGenerator } = await import('@/lib/recibo-generator')

    // Gerar número do recibo
    const competencia = new Date(payment.paidDate || payment.dueDate)
    const ano = competencia.getFullYear()
    const mes = competencia.getMonth() + 1

    // Contar recibos existentes
    const recibosExistentes = await prisma.recibo.count({
      where: {
        userId: user.id,
        competencia: {
          gte: new Date(ano, mes - 1, 1),
          lt: new Date(ano, mes, 1)
        }
      }
    })

    const numeroRecibo = ReciboGenerator.gerarNumeroRecibo(user.id, ano, mes, recibosExistentes + 1)

    // Calcular valores
    const valorTotal = payment.amount
    const percentualTaxa = payment.contract.administrationFeePercentage
    const { taxaAdministracao, valorRepassado } = ReciboGenerator.calcularValores(valorTotal, percentualTaxa)

    console.log('💰 Valores calculados:')
    console.log('  - Total:', valorTotal)
    console.log('  - Taxa:', taxaAdministracao)
    console.log('  - Repasse:', valorRepassado)

    // Criar recibo no banco
    const recibo = await prisma.recibo.create({
      data: {
        userId: user.id,
        contractId: payment.contractId,
        paymentId: payment.id,
        numeroRecibo,
        competencia,
        dataPagamento: payment.paidDate || new Date(),
        valorTotal,
        taxaAdministracao,
        percentualTaxa,
        valorRepassado,
        pdfUrl: `/api/recibos/${numeroRecibo}/pdf`,
        proprietarioNome: payment.contract.property.owner.name,
        proprietarioDoc: payment.contract.property.owner.document,
        inquilinoNome: payment.contract.tenant.name,
        inquilinoDoc: payment.contract.tenant.document,
        imovelEndereco: `${payment.contract.property.address}, ${payment.contract.property.city} - ${payment.contract.property.state}`,
      }
    })

    console.log('✅ Recibo criado:', recibo.numeroRecibo)

    return NextResponse.json({
      success: true,
      message: '🎉 Recibo gerado com sucesso!',
      recibo: {
        id: recibo.id,
        numero: recibo.numeroRecibo,
        valor: Number(recibo.valorTotal),
        taxa: Number(recibo.taxaAdministracao),
        proprietario: recibo.proprietarioNome,
        inquilino: recibo.inquilinoNome
      },
      instructions: [
        '1. Vá para /dashboard/recibos',
        '2. Clique em "Atualizar Lista" ou "Recarregar Página"', 
        '3. O recibo deve aparecer na lista',
        '4. Clique em "PDF" para baixar'
      ],
      paymentId: payment.id
    })

  } catch (error: any) {
    console.error('❌ Erro ao testar recibo:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao gerar recibo de teste',
      details: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    }, { status: 500 })
  }
}