import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('=== FIXING ALL USERS COMPANY ASSOCIATION ===')

    // Buscar todos os usuários sem empresa
    const usersWithoutCompany = await prisma.user.findMany({
      where: {
        companyId: null
      }
    })

    console.log(`Found ${usersWithoutCompany.length} users without company`)

    if (usersWithoutCompany.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todos os usuários já estão associados a empresas',
        usersFixed: 0
      })
    }

    // Buscar uma empresa existente ou criar uma
    let company = await prisma.company.findFirst()

    if (!company) {
      console.log('Creating default company...')
      company = await prisma.company.create({
        data: {
          name: 'Imobiliária Principal',
          tradeName: 'Imobiliária Principal',
          document: '00.000.000/0000-00',
          email: 'admin@imobiliaria.com',
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

    // Associar todos os usuários à empresa
    const updateResult = await prisma.user.updateMany({
      where: {
        companyId: null
      },
      data: {
        companyId: company.id
      }
    })

    console.log(`Updated ${updateResult.count} users with company ID: ${company.id}`)

    // Also set the first user as admin if no admin exists
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN'
      }
    })

    if (adminCount === 0) {
      const firstUser = await prisma.user.findFirst({
        orderBy: {
          createdAt: 'asc'
        }
      })

      if (firstUser) {
        await prisma.user.update({
          where: {
            id: firstUser.id
          },
          data: {
            role: 'ADMIN'
          }
        })
        console.log(`Set user ${firstUser.email} as ADMIN`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${updateResult.count} usuários associados à empresa com sucesso`,
      usersFixed: updateResult.count,
      companyId: company.id,
      companyName: company.name
    })

  } catch (error) {
    console.error('Error fixing all users company association:', error)
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
  try {
    // Mostrar status dos usuários
    const totalUsers = await prisma.user.count()
    const usersWithCompany = await prisma.user.count({
      where: {
        companyId: {
          not: null
        }
      }
    })
    const usersWithoutCompany = totalUsers - usersWithCompany

    return NextResponse.json({
      status: 'active',
      totalUsers,
      usersWithCompany,
      usersWithoutCompany,
      description: 'Endpoint para corrigir associação de todos os usuários',
      usage: 'POST para executar a correção em massa'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao verificar status dos usuários' },
      { status: 500 }
    )
  }
}