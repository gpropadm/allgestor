import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

// PUT - Editar comissão
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const data = await request.json()
    
    const commission = await prisma.dimobCommission.update({
      where: {
        id: params.id,
        userId: user.id
      },
      data: {
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
    console.error('Erro ao editar comissão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir comissão (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    
    await prisma.dimobCommission.update({
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
    console.error('Erro ao excluir comissão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}