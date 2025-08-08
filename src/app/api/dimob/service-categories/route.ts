import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Buscar categorias da empresa do usuário
    const categories = await prisma.dimobServiceCategory.findMany({
      where: {
        companyId: user.companyId || 'system' // Fallback para categorias padrão
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching DIMOB service categories:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar categorias de serviço DIMOB' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const data = await request.json()
    
    if (!user.companyId) {
      return NextResponse.json(
        { error: 'Usuário não possui empresa associada' },
        { status: 400 }
      )
    }
    
    const category = await prisma.dimobServiceCategory.create({
      data: {
        companyId: user.companyId,
        name: data.name,
        type: data.type,
        description: data.description || null,
        active: data.active !== undefined ? data.active : true
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating DIMOB service category:', error)
    return NextResponse.json(
      { error: 'Erro ao criar categoria de serviço DIMOB' },
      { status: 500 }
    )
  }
}