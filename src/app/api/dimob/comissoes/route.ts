import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

// GET - Listar comissões por usuário e ano
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    
    const commissions = await prisma.dimobCommission.findMany({
      where: {
        userId: user.id,
        competencia: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`)
        },
        ativo: true
      },
      orderBy: {
        competencia: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: commissions
    })
  } catch (error) {
    console.error('Erro ao buscar comissões:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova comissão
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const data = await request.json()
    
    const commission = await prisma.dimobCommission.create({
      data: {
        userId: user.id,
        cpfCnpj: data.cpfCnpj,
        nome: data.nome,
        valorComissao: data.valorComissao,
        competencia: new Date(data.competencia),
        valorPis: data.valorPis || 0,
        valorCofins: data.valorCofins || 0,
        valorInss: data.valorInss || 0,
        valorIr: data.valorIr || 0,
        descricao: data.descricao || null,
        contratoId: data.contratoId || null
      }
    })

    return NextResponse.json({
      success: true,
      data: commission
    })
  } catch (error) {
    console.error('Erro ao criar comissão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}