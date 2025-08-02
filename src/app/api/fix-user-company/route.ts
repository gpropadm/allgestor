import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    console.log('=== FIXING USER COMPANY ASSOCIATION ===')
    console.log('User email:', session.user.email)

    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado no banco de dados' },
        { status: 404 }
      )
    }

    console.log('User found:', user.id, 'CompanyId:', user.companyId)

    // Se já tem empresa, retornar sucesso
    if (user.companyId && user.company) {
      return NextResponse.json({
        success: true,
        message: 'Usuário já está associado à empresa',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          companyId: user.companyId,
          companyName: user.company.name
        }
      })
    }

    // Buscar uma empresa existente
    let company = await prisma.company.findFirst()

    // Se não existe empresa, criar uma
    if (!company) {
      console.log('Creating default company...')
      company = await prisma.company.create({
        data: {
          name: 'Imobiliária Principal',
          tradeName: 'Imobiliária Principal',
          document: '00.000.000/0000-00',
          email: session.user.email,
          phone: '(61) 99999-9999',
          address: 'Endereço da empresa',
          city: 'BRASÍLIA',
          state: 'DF',
          zipCode: '70000-000',
          logo: '',
          website: ''
        }
      })
      console.log('Default company created:', company.id)
    }

    // Associar usuário à empresa
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { companyId: company.id },
      include: { company: true }
    })

    console.log('User updated with company:', updatedUser.companyId)

    return NextResponse.json({
      success: true,
      message: 'Usuário associado à empresa com sucesso',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        companyId: updatedUser.companyId,
        companyName: updatedUser.company?.name
      }
    })

  } catch (error) {
    console.error('Error fixing user company association:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    description: 'Endpoint para corrigir associação usuário-empresa',
    usage: 'POST para executar a correção'
  })
}