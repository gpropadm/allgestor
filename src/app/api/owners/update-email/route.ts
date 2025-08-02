// API temporária para atualizar email de proprietário para teste
// Endpoint: POST /api/owners/update-email

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ownerId, newEmail } = body

    if (!ownerId || !newEmail) {
      return NextResponse.json(
        { error: 'ownerId e newEmail são obrigatórios' },
        { status: 400 }
      )
    }

    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    // Verificar se proprietário existe e pertence à empresa
    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      select: {
        id: true,
        name: true,
        email: true,
        companyId: true
      }
    })

    if (!owner) {
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'Proprietário não encontrado' },
        { status: 404 }
      )
    }

    if (owner.companyId !== session.user.companyId) {
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Atualizar email
    const updatedOwner = await prisma.owner.update({
      where: { id: ownerId },
      data: {
        email: newEmail,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: `Email atualizado de ${owner.email} para ${newEmail}`,
      owner: updatedOwner
    })
  } catch (error) {
    console.error('Erro ao atualizar email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}