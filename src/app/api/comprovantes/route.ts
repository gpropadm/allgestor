import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { gerarComprovanteRendimentos } from '@/lib/comprovante-rendimentos'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    console.log('📋 GET /api/comprovantes - Listando contratos para comprovantes')
    
    // Buscar todos os contratos ativos do usuário com proprietários
    const contracts = await prisma.contract.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      },
      include: {
        property: {
          include: { owner: true }
        },
        tenant: true,
        _count: {
          select: {
            payments: {
              where: { status: 'PAID' }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`📊 Encontrados ${contracts.length} contratos ativos`)
    
    // Agrupar por proprietário
    const proprietarios = new Map()
    
    for (const contract of contracts) {
      const ownerId = contract.property.owner.id
      const ownerName = contract.property.owner.name
      
      if (!proprietarios.has(ownerId)) {
        proprietarios.set(ownerId, {
          id: ownerId,
          nome: ownerName,
          documento: contract.property.owner.document,
          contratos: []
        })
      }
      
      proprietarios.get(ownerId).contratos.push({
        id: contract.id,
        propriedade: contract.property.title,
        inquilino: contract.tenant.name,
        valorAluguel: contract.rentAmount,
        startDate: contract.startDate.toLocaleDateString('pt-BR'),
        endDate: contract.endDate.toLocaleDateString('pt-BR'),
        pagamentosPagos: contract._count.payments
      })
    }
    
    const proprietariosArray = Array.from(proprietarios.values())
    
    return NextResponse.json({
      success: true,
      proprietarios: proprietariosArray,
      totalContratos: contracts.length
    })
    
  } catch (error) {
    console.error('❌ Erro ao listar comprovantes:', error)
    return NextResponse.json({
      error: 'Erro ao buscar dados para comprovantes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { ownerId, contractId, ano } = await request.json()
    
    console.log('📋 POST /api/comprovantes - Gerando comprovante:', { ownerId, contractId, ano })
    
    if (!ownerId || !contractId || !ano) {
      return NextResponse.json({
        error: 'Parâmetros obrigatórios: ownerId, contractId, ano'
      }, { status: 400 })
    }
    
    // Gerar os dados do comprovante
    const comprovanteData = await gerarComprovanteRendimentos(ownerId, contractId, ano, user.id)
    
    if (!comprovanteData) {
      return NextResponse.json({
        error: 'Não foi possível gerar o comprovante. Verifique se existem pagamentos pagos no ano especificado.'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      comprovante: comprovanteData,
      message: `Comprovante gerado para ${comprovanteData.locador.nome} - Ano ${ano}`
    })
    
  } catch (error) {
    console.error('❌ Erro ao gerar comprovante:', error)
    return NextResponse.json({
      error: 'Erro ao gerar comprovante',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}