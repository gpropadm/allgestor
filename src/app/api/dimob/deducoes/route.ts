import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

// GET - Listar deduções por usuário e ano
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    
    const deductions = await prisma.dimobDeduction.findMany({
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
      data: deductions
    })
  } catch (error) {
    console.error('Erro ao buscar deduções:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova dedução
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const data = await request.json()
    
    const deduction = await prisma.dimobDeduction.create({
      data: {
        userId: user.id,
        tipoDeducao: data.tipoDeducao,
        valorDeducao: data.valorDeducao,
        competencia: new Date(data.competencia),
        descricao: data.descricao,
        contratoId: data.contratoId || null,
        proprietarioDoc: data.proprietarioDoc || null,
        inquilinoDoc: data.inquilinoDoc || null
      }
    })

    return NextResponse.json({
      success: true,
      data: deduction
    })
  } catch (error) {
    console.error('Erro ao criar dedução:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}