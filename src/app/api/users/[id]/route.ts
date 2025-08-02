import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await request.json()
    const { id } = await params

    // Preparar dados para atualização
    const updateData: any = {
      name: data.name,
      email: data.email,
      role: data.role,
      isActive: data.isActive,
      isBlocked: data.isBlocked
    }

    // Apenas atualizar senha se fornecida
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10)
    }

    // Atualizar companyId se fornecido
    if (data.companyId !== undefined) {
      updateData.companyId = data.companyId || null
    }

    // Criar nova empresa se necessário
    if (data.companyData) {
      const company = await prisma.company.create({
        data: {
          name: data.companyData.name,
          tradeName: data.companyData.tradeName,
          document: data.companyData.document,
          email: data.companyData.email,
          phone: data.companyData.phone,
          address: data.companyData.address,
          city: data.companyData.city,
          state: data.companyData.state,
          zipCode: data.companyData.zipCode
        }
      })
      updateData.companyId = company.id
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            tradeName: true
          }
        }
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Email já está em uso' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar autenticação e permissões de admin
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário é admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    const isAdmin = currentUser?.role === 'ADMIN' || 
                   currentUser?.role === 'SUPER_ADMIN' ||
                   currentUser?.id === '1' ||
                   currentUser?.email?.toLowerCase().includes('admin')

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Permissão negada. Apenas administradores podem deletar usuários.' },
        { status: 403 }
      )
    }

    // Verificar se o usuário existe
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      include: {
        owners: true,
        _count: {
          select: {
            owners: true
          }
        }
      }
    })

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Impedir que o usuário delete a si mesmo
    if (userToDelete.id === currentUser?.id) {
      return NextResponse.json(
        { error: 'Você não pode deletar sua própria conta' },
        { status: 400 }
      )
    }

    // Verificar se há dados relacionados que impedem a deleção
    if (userToDelete._count.owners > 0) {
      return NextResponse.json(
        { error: 'Não é possível deletar este usuário pois ele possui proprietários associados. Remova os proprietários primeiro.' },
        { status: 400 }
      )
    }

    // Deletar o usuário
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Usuário deletado com sucesso'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    
    // Tratar erro específico de foreign key constraint
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Não é possível deletar este usuário pois ele possui dados relacionados no sistema. Remova primeiro os dados relacionados (proprietários, contratos, etc.).' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Erro interno ao deletar usuário' },
      { status: 500 }
    )
  }
}