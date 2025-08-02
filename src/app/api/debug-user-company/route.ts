import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking user-company associations...')
    
    // Get current session
    const session = await getServerSession(authOptions)
    
    // Get all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        isActive: true,
        isBlocked: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            document: true
          }
        }
      }
    })
    
    // Get all companies
    const allCompanies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        document: true,
        active: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    })
    
    // Analysis
    const usersWithoutCompany = allUsers.filter(user => !user.companyId)
    const inactiveUsers = allUsers.filter(user => !user.isActive || user.isBlocked)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      currentSession: session ? {
        userId: session.user?.id,
        email: session.user?.email,
        companyId: session.user?.companyId,
        role: session.user?.role
      } : null,
      summary: {
        totalUsers: allUsers.length,
        usersWithCompany: allUsers.length - usersWithoutCompany.length,
        usersWithoutCompany: usersWithoutCompany.length,
        inactiveUsers: inactiveUsers.length,
        totalCompanies: allCompanies.length,
        activeCompanies: allCompanies.filter(c => c.active).length
      },
      issues: {
        usersWithoutCompany: usersWithoutCompany.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          isBlocked: user.isBlocked
        })),
        inactiveUsers: inactiveUsers.map(user => ({
          email: user.email,
          isActive: user.isActive,
          isBlocked: user.isBlocked,
          company: user.company?.name || 'NO COMPANY'
        }))
      },
      users: allUsers.map(user => ({
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        isBlocked: user.isBlocked,
        company: user.company ? {
          name: user.company.name,
          document: user.company.document
        } : null,
        createdAt: user.createdAt
      })),
      companies: allCompanies.map(company => ({
        name: company.name,
        document: company.document,
        active: company.active,
        userCount: company._count.users
      })),
      recommendations: [
        ...(usersWithoutCompany.length > 0 ? ['Call POST /api/fix-user-company to auto-assign users to companies'] : []),
        ...(allCompanies.length === 0 ? ['No companies exist - call POST /api/init to create default company'] : []),
        ...(inactiveUsers.length > 0 ? ['Some users are inactive or blocked - review user status'] : [])
      ]
    })
    
  } catch (error) {
    console.error('Error in debug-user-company:', error)
    return NextResponse.json({
      error: 'Failed to debug user-company associations',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(_request: NextRequest) {
  try {
    console.log('🔧 Auto-fixing user-company associations...')
    
    // First run the diagnostic
    const diagnostic = await GET(_request)
    const diagData = await diagnostic.json()
    
    if (diagData.summary.usersWithoutCompany === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users need company association',
        fixed: 0,
        diagnostic: diagData
      })
    }
    
    // Get or create default company
    let defaultCompany = await prisma.company.findFirst({
      where: { active: true }
    })
    
    if (!defaultCompany) {
      defaultCompany = await prisma.company.create({
        data: {
          name: 'Imobiliária Principal',
          tradeName: 'Imobiliária Principal',
          document: '00.000.000/0001-00',
          email: 'contato@imobiliaria.com',
          phone: '(11) 0000-0000',
          address: 'Endereço principal, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '00000-000',
          subscription: 'BASIC'
        }
      })
      console.log('Created default company:', defaultCompany.name)
    }
    
    // Fix users without company
    const usersWithoutCompany = await prisma.user.findMany({
      where: { companyId: null },
      select: { id: true, email: true, name: true }
    })
    
    const fixes = []
    for (const user of usersWithoutCompany) {
      await prisma.user.update({
        where: { id: user.id },
        data: { companyId: defaultCompany.id }
      })
      fixes.push({
        userEmail: user.email,
        userName: user.name,
        assignedCompany: defaultCompany.name
      })
      console.log(`Fixed: ${user.email} → ${defaultCompany.name}`)
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${fixes.length} user(s)`,
      fixed: fixes.length,
      defaultCompany: {
        name: defaultCompany.name,
        id: defaultCompany.id
      },
      fixes
    })
    
  } catch (error) {
    console.error('Error fixing user-company associations:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fix user-company associations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}