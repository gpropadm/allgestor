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

    console.log('🔍 Buscando recibos para usuário:', user.id)
    console.log('🔍 User completo:', JSON.stringify(user, null, 2))

    // TESTE: Buscar TODOS os recibos primeiro
    const allRecibos = await prisma.$queryRaw`SELECT id, "userId", "numeroRecibo" FROM recibos`
    console.log('🔍 TODOS OS RECIBOS NO BANCO:', allRecibos)

    // Usar SQL direto mais simples para evitar problemas de BigInt
    let sqlQuery = `
      SELECT 
        r.id,
        r."numeroRecibo",
        r.competencia,
        r."dataPagamento",
        CAST(r."valorTotal" AS DECIMAL) as "valorTotal",
        CAST(r."taxaAdministracao" AS DECIMAL) as "taxaAdministracao", 
        CAST(r."valorRepassado" AS DECIMAL) as "valorRepassado",
        r."proprietarioNome",
        r."inquilinoNome", 
        r."imovelEndereco",
        r."contractId",
        r."pdfUrl"
      FROM recibos r
      WHERE r."userId" = $1
    `
    let params: any[] = [user.id]
    let paramIndex = 2

    if (contractId) {
      sqlQuery += ` AND r."contractId" = $${paramIndex}`
      params.push(contractId)
      paramIndex++
    }

    if (ano && mes) {
      const competencia = new Date(parseInt(ano), parseInt(mes) - 1, 1)
      const proximaCompetencia = new Date(parseInt(ano), parseInt(mes), 1)
      
      sqlQuery += ` AND r.competencia >= $${paramIndex} AND r.competencia < $${paramIndex + 1}`
      params.push(competencia)
      params.push(proximaCompetencia)
    }

    sqlQuery += ` ORDER BY r."createdAt" DESC`

    console.log('🔍 Buscando recibos para userId:', user.id)
    console.log('🔍 SQL Query:', sqlQuery)
    console.log('🔍 SQL Params:', params)

    const rawRecibos = await prisma.$queryRawUnsafe(sqlQuery, ...params)
    
    console.log('✅ Raw result:', rawRecibos)
    console.log('✅ Recibos encontrados:', Array.isArray(rawRecibos) ? rawRecibos.length : 0)

    // Transformar resultado para o formato esperado pelo frontend
    const recibos = Array.isArray(rawRecibos) ? rawRecibos.map((r: any) => ({
      id: String(r.id),
      numeroRecibo: String(r.numeroRecibo),
      competencia: r.competencia,
      dataPagamento: r.dataPagamento,
      valorTotal: parseFloat(r.valorTotal) || 0,
      taxaAdministracao: parseFloat(r.taxaAdministracao) || 0,
      valorRepassado: parseFloat(r.valorRepassado) || 0,
      proprietarioNome: String(r.proprietarioNome),
      inquilinoNome: String(r.inquilinoNome),
      imovelEndereco: String(r.imovelEndereco),
      contractId: String(r.contractId),
      pdfUrl: r.pdfUrl
    })) : []

    console.log('📋 Recibos formatados:', recibos)

    return NextResponse.json(recibos)
  } catch (error: any) {
    console.error('Error fetching recibos:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    
    return NextResponse.json({ 
      error: 'Erro ao buscar recibos',
      details: error.message,
      suggestion: 'Tabela recibos pode não existir ou Prisma client precisa ser regenerado'
    }, { status: 500 })
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