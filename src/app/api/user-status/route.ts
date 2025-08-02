import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        authenticated: false,
        message: 'User not authenticated'
      }, { status: 401 })
    }
    
    // Get complete user data from database
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        isActive: true,
        isBlocked: true,
        lastLogin: true,
        company: {
          select: {
            id: true,
            name: true,
            tradeName: true,
            document: true,
            active: true
          }
        }
      }
    })
    
    if (!dbUser) {
      return NextResponse.json({
        authenticated: false,
        message: 'User not found in database'
      }, { status: 404 })
    }
    
    const status = {
      authenticated: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        isActive: dbUser.isActive,
        isBlocked: dbUser.isBlocked,
        lastLogin: dbUser.lastLogin
      },
      company: dbUser.company ? {
        id: dbUser.company.id,
        name: dbUser.company.name,
        tradeName: dbUser.company.tradeName,
        document: dbUser.company.document,
        active: dbUser.company.active
      } : null,
      session: {
        companyId: session.user.companyId,
        role: session.user.role
      },
      issues: []
    }
    
    // Check for issues
    if (!dbUser.companyId) {
      status.issues.push({
        type: 'NO_COMPANY',
        message: 'Usuário não está associado a uma empresa',
        severity: 'HIGH',
        solution: 'Entre em contato com o administrador ou acesse /api/fix-user-company'
      })
    }
    
    if (!dbUser.isActive) {
      status.issues.push({
        type: 'INACTIVE_USER',
        message: 'Usuário está inativo',
        severity: 'HIGH',
        solution: 'Entre em contato com o administrador'
      })
    }
    
    if (dbUser.isBlocked) {
      status.issues.push({
        type: 'BLOCKED_USER',
        message: 'Usuário está bloqueado',
        severity: 'CRITICAL',
        solution: 'Entre em contato com o administrador'
      })
    }
    
    if (dbUser.company && !dbUser.company.active) {
      status.issues.push({
        type: 'INACTIVE_COMPANY',
        message: 'A empresa associada está inativa',
        severity: 'MEDIUM',
        solution: 'Entre em contato com o administrador'
      })
    }
    
    if (dbUser.companyId !== session.user.companyId) {
      status.issues.push({
        type: 'SESSION_MISMATCH',
        message: 'Dados da sessão não coincidem com o banco de dados',
        severity: 'MEDIUM',
        solution: 'Faça logout e login novamente'
      })
    }
    
    return NextResponse.json(status)
    
  } catch (error) {
    console.error('Error checking user status:', error)
    return NextResponse.json({
      authenticated: false,
      error: 'Failed to check user status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}