import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

// GET - Relatórios consolidados de recibos
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString())
    const mes = parseInt(searchParams.get('mes') || (new Date().getMonth() + 1).toString())
    const tipo = searchParams.get('tipo') || 'integral' // 'integral' ou 'parcial'

    // Período da competência
    const competenciaInicio = new Date(ano, mes - 1, 1)
    const competenciaFim = new Date(ano, mes, 1)

    // Buscar recibos do período
    const recibos = await prisma.recibo.findMany({
      where: {
        userId: user.id,
        competencia: {
          gte: competenciaInicio,
          lt: competenciaFim
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
        },
        payment: true
      },
      orderBy: {
        numeroRecibo: 'asc'
      }
    })

    // Calcular totais
    const totalRecibos = recibos.length
    const valorTotalBruto = recibos.reduce((sum, recibo) => sum + Number(recibo.valorTotal), 0)
    const valorTotalTaxas = recibos.reduce((sum, recibo) => sum + Number(recibo.taxaAdministracao), 0)
    const valorTotalRepassado = recibos.reduce((sum, recibo) => sum + Number(recibo.valorRepassado), 0)

    // Agrupar por proprietário
    const porProprietario = recibos.reduce((acc, recibo) => {
      const key = recibo.proprietarioDoc
      if (!acc[key]) {
        acc[key] = {
          nome: recibo.proprietarioNome,
          documento: recibo.proprietarioDoc,
          recibos: [],
          totalBruto: 0,
          totalTaxa: 0,
          totalRepassado: 0
        }
      }
      
      acc[key].recibos.push(recibo)
      acc[key].totalBruto += Number(recibo.valorTotal)
      acc[key].totalTaxa += Number(recibo.taxaAdministracao)
      acc[key].totalRepassado += Number(recibo.valorRepassado)
      
      return acc
    }, {} as any)

    // Agrupar por imóvel
    const porImovel = recibos.reduce((acc, recibo) => {
      const key = recibo.imovelEndereco
      if (!acc[key]) {
        acc[key] = {
          endereco: recibo.imovelEndereco,
          proprietario: recibo.proprietarioNome,
          inquilino: recibo.inquilinoNome,
          recibos: [],
          totalBruto: 0,
          totalTaxa: 0,
          totalRepassado: 0
        }
      }
      
      acc[key].recibos.push(recibo)
      acc[key].totalBruto += Number(recibo.valorTotal)
      acc[key].totalTaxa += Number(recibo.taxaAdministracao)
      acc[key].totalRepassado += Number(recibo.valorRepassado)
      
      return acc
    }, {} as any)

    // Buscar dados da empresa para o cabeçalho
    const empresa = await prisma.company.findFirst({
      where: {
        users: {
          some: {
            id: user.id
          }
        }
      }
    })

    const competenciaTexto = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    })

    const relatorio = {
      // Informações do relatório
      tipo,
      titulo: tipo === 'integral' 
        ? `Relatório Consolidado Integral - ${competenciaTexto}`
        : `Relatório Consolidado Parcial (Taxas) - ${competenciaTexto}`,
      competencia: competenciaTexto,
      periodo: {
        ano,
        mes,
        inicio: competenciaInicio,
        fim: competenciaFim
      },
      geradoEm: new Date(),
      
      // Dados da empresa
      empresa: empresa ? {
        razaoSocial: empresa.name,
        cnpj: empresa.document,
        endereco: `${empresa.address}, ${empresa.city} - ${empresa.state}`,
        telefone: empresa.phone,
        email: empresa.email
      } : null,

      // Resumo executivo
      resumo: {
        totalRecibos,
        valorTotalBruto,
        valorTotalTaxas,
        valorTotalRepassado,
        percentualMedioTaxa: totalRecibos > 0 ? (valorTotalTaxas / valorTotalBruto) * 100 : 0
      },

      // Detalhamento
      detalhamento: {
        porProprietario: Object.values(porProprietario),
        porImovel: Object.values(porImovel),
        recibos: recibos.map(recibo => ({
          numero: recibo.numeroRecibo,
          data: recibo.dataPagamento,
          proprietario: recibo.proprietarioNome,
          inquilino: recibo.inquilinoNome,
          imovel: recibo.imovelEndereco,
          valorBruto: Number(recibo.valorTotal),
          taxa: Number(recibo.taxaAdministracao),
          percentualTaxa: Number(recibo.percentualTaxa),
          valorRepassado: Number(recibo.valorRepassado),
          metodoPagamento: recibo.payment?.paymentMethod || 'N/A'
        }))
      },

      // Filtros específicos por tipo
      dadosConsolidados: tipo === 'integral' ? {
        // Relatório integral: todos os valores
        foco: 'Valores totais recebidos pela imobiliária',
        valorPrincipal: valorTotalBruto,
        descricao: 'Soma de todos os valores de aluguel recebidos no período'
      } : {
        // Relatório parcial: apenas taxas
        foco: 'Receita da imobiliária (taxas de administração)',
        valorPrincipal: valorTotalTaxas,
        descricao: 'Soma apenas das taxas de administração cobradas no período'
      }
    }

    return NextResponse.json(relatorio)

  } catch (error) {
    console.error('Error generating consolidated report:', error)
    return NextResponse.json({ error: 'Erro ao gerar relatório consolidado' }, { status: 500 })
  }
}