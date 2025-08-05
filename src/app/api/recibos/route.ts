import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { ReciboGenerator } from '@/lib/recibo-generator'

// GET - Listar recibos por usuário
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')
    const ano = searchParams.get('ano')
    const mes = searchParams.get('mes')

    const where: any = {
      userId: user.id
    }

    if (contractId) {
      where.contractId = contractId
    }

    if (ano && mes) {
      const competencia = new Date(parseInt(ano), parseInt(mes) - 1, 1)
      const proximaCompetencia = new Date(parseInt(ano), parseInt(mes), 1)
      
      where.competencia = {
        gte: competencia,
        lt: proximaCompetencia
      }
    }

    const recibos = await prisma.recibo.findMany({
      where,
      include: {
        contract: {
          include: {
            property: true,
            tenant: true,
          }
        },
        payment: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(recibos)
  } catch (error) {
    console.error('Error fetching recibos:', error)
    return NextResponse.json({ error: 'Erro ao buscar recibos' }, { status: 500 })
  }
}

// POST - Gerar recibo automaticamente para um pagamento
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { paymentId } = await request.json()

    // Buscar o pagamento com todas as informações necessárias
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
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
        },
        recibo: true // Verificar se já existe recibo
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    if (payment.recibo) {
      return NextResponse.json({ error: 'Recibo já existe para este pagamento' }, { status: 400 })
    }

    if (payment.status !== 'PAID') {
      return NextResponse.json({ error: 'Pagamento ainda não foi marcado como pago' }, { status: 400 })
    }

    // Gerar número do recibo
    const competencia = new Date(payment.paidDate || payment.dueDate)
    const ano = competencia.getFullYear()
    const mes = competencia.getMonth() + 1

    // Contar recibos existentes para gerar sequencial
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

    // Dados da imobiliária (pegar da company do contrato)
    const company = payment.contract.company

    // Preparar dados para o recibo
    const reciboData = {
      numeroRecibo,
      competencia,
      dataPagamento: payment.paidDate || new Date(),
      valorTotal,
      taxaAdministracao,
      percentualTaxa,
      valorRepassado,
      
      // Dados da imobiliária
      imobiliariaRazaoSocial: company.name,
      imobiliariaCnpj: company.document,
      imobiliariaInscricaoMunicipal: company.inscricaoMunicipal,
      imobiliariaEndereco: `${company.address}, ${company.city} - ${company.state}, CEP: ${company.zipCode}`,
      imobiliariaTelefone: company.phone,
      imobiliariaEmail: company.email,
      
      // Dados do contrato
      proprietarioNome: payment.contract.property.owner.name,
      proprietarioDoc: payment.contract.property.owner.document,
      inquilinoNome: payment.contract.tenant.name,
      inquilinoDoc: payment.contract.tenant.document,
      imovelEndereco: `${payment.contract.property.address}, ${payment.contract.property.city} - ${payment.contract.property.state}`,
    }

    // Gerar PDF
    const pdfBytes = await ReciboGenerator.gerarReciboPDF(reciboData)

    // TODO: Salvar PDF no storage (S3, local, etc.)
    // Por enquanto, vamos apenas salvar o registro no banco
    const pdfUrl = `/api/recibos/${numeroRecibo}/pdf` // URL temporária

    // Criar registro do recibo no banco
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
        pdfUrl,
        proprietarioNome: reciboData.proprietarioNome,
        proprietarioDoc: reciboData.proprietarioDoc,
        inquilinoNome: reciboData.inquilinoNome,
        inquilinoDoc: reciboData.inquilinoDoc,
        imovelEndereco: reciboData.imovelEndereco,
      },
      include: {
        contract: {
          include: {
            property: true,
            tenant: true,
          }
        },
        payment: true
      }
    })

    return NextResponse.json({
      recibo,
      pdfBytes: Array.from(pdfBytes), // Converter para array para serialização JSON
      message: 'Recibo gerado com sucesso'
    })

  } catch (error) {
    console.error('Error generating recibo:', error)
    return NextResponse.json({ error: 'Erro ao gerar recibo' }, { status: 500 })
  }
}