import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

// PUT - Editar dedução
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const data = await request.json()
    
    const deduction = await prisma.dimobDeduction.update({
      where: {
        id: params.id,
        userId: user.id
      },
      data: {
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
    console.error('Erro ao editar dedução:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir dedução (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    
    await prisma.dimobDeduction.update({
      where: {
        id: params.id,
        userId: user.id
      },
      data: {
        ativo: false
      }
    })

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Erro ao excluir dedução:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}