import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { ReciboGenerator } from '@/lib/recibo-generator'

// GET - Baixar PDF do recibo
export async function GET(
  request: NextRequest,
  { params }: { params: { numeroRecibo: string } }
) {
  try {
    const user = await requireAuth(request)
    const { numeroRecibo } = params

    // Buscar o recibo
    const recibo = await prisma.recibo.findFirst({
      where: {
        numeroRecibo,
        userId: user.id
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
        },
        payment: true
      }
    })

    if (!recibo) {
      return NextResponse.json({ error: 'Recibo não encontrado' }, { status: 404 })
    }

    // Regenerar PDF com dados atuais (garantir consistência)
    const company = recibo.contract.company

    const reciboData = {
      numeroRecibo: recibo.numeroRecibo,
      competencia: recibo.competencia,
      dataPagamento: recibo.dataPagamento,
      valorTotal: Number(recibo.valorTotal),
      taxaAdministracao: Number(recibo.taxaAdministracao),
      percentualTaxa: Number(recibo.percentualTaxa),
      valorRepassado: Number(recibo.valorRepassado),
      
      // Dados da imobiliária
      imobiliariaRazaoSocial: company.name,
      imobiliariaCnpj: company.document,
      imobiliariaInscricaoMunicipal: company.inscricaoMunicipal,
      imobiliariaEndereco: `${company.address}, ${company.city} - ${company.state}, CEP: ${company.zipCode}`,
      imobiliariaTelefone: company.phone,
      imobiliariaEmail: company.email,
      
      // Dados do contrato
      proprietarioNome: recibo.proprietarioNome,
      proprietarioDoc: recibo.proprietarioDoc,
      inquilinoNome: recibo.inquilinoNome,
      inquilinoDoc: recibo.inquilinoDoc,
      imovelEndereco: recibo.imovelEndereco,
      
      observacoes: recibo.observacoes || undefined,
    }

    // Gerar PDF
    const pdfBytes = await ReciboGenerator.gerarReciboPDF(reciboData)

    // Retornar PDF
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Recibo_${numeroRecibo}.pdf"`,
        'Cache-Control': 'private, max-age=3600', // Cache por 1 hora
      },
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Erro ao gerar PDF do recibo' }, { status: 500 })
  }
}