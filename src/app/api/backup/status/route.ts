import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await requireAuth(request)
    
    console.log('📊 Verificando status dos dados...', { userId: user.id })
    
    // Contar dados básicos
    console.log('📊 Contando dados básicos...')
    
    const userCount = await prisma.user.count().catch(error => {
      console.error('Erro ao contar users:', error)
      return 0
    })
    
    const companyCount = await prisma.company.count().catch(error => {
      console.error('Erro ao contar companies:', error)
      return 0
    })
    
    const ownerCount = await prisma.owner.count().catch(error => {
      console.error('Erro ao contar owners:', error)
      return 0
    })
    
    const propertyCount = await prisma.property.count().catch(error => {
      console.error('Erro ao contar properties:', error)
      return 0
    })
    
    let bankAccountCount = 0
    try {
      if (prisma.bankAccounts && typeof prisma.bankAccounts.count === 'function') {
        bankAccountCount = await prisma.bankAccounts.count()
      }
    } catch (error) {
      console.error('Erro ao contar bankAccounts:', error)
      bankAccountCount = 0
    }
    
    // Tabelas opcionais - contar com segurança
    let leadCount = 0
    let contractCount = 0
    let paymentCount = 0
    let tenantCount = 0
    let maintenanceCount = 0
    
    try {
      if (prisma.lead && typeof prisma.lead.count === 'function') {
        leadCount = await prisma.lead.count()
      }
    } catch (error) {
      console.log('Erro ao contar leads:', error.message)
    }
    
    try {
      if (prisma.contract && typeof prisma.contract.count === 'function') {
        contractCount = await prisma.contract.count()
      }
    } catch (error) {
      console.log('Erro ao contar contracts:', error.message)
    }
    
    try {
      if (prisma.payment && typeof prisma.payment.count === 'function') {
        paymentCount = await prisma.payment.count()
      }
    } catch (error) {
      console.log('Erro ao contar payments:', error.message)
    }
    
    try {
      if (prisma.tenant && typeof prisma.tenant.count === 'function') {
        tenantCount = await prisma.tenant.count()
      }
    } catch (error) {
      console.log('Erro ao contar tenants:', error.message)
    }
    
    try {
      if (prisma.maintenance && typeof prisma.maintenance.count === 'function') {
        maintenanceCount = await prisma.maintenance.count()
      }
    } catch (error) {
      console.log('Erro ao contar maintenances:', error.message)
    }
    
    const totalRecords = userCount + companyCount + ownerCount + propertyCount + bankAccountCount
    
    // Informações adicionais
    const companies = await prisma.company.findMany()
    
    const lastUser = await prisma.user.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true, name: true }
    })
    
    const lastOwner = await prisma.owner.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true, name: true }
    })
    
    const backupStatus = {
      timestamp: new Date().toISOString(),
      companyInfo: {
        id: 'ALL_COMPANIES',
        name: `TODAS AS EMPRESAS (${companies.length})`,
        totalRecords
      },
      counts: {
        users: userCount,
        companies: companyCount,
        owners: ownerCount,
        properties: propertyCount,
        bankAccounts: bankAccountCount,
        leads: leadCount,
        contracts: contractCount,
        payments: paymentCount,
        tenants: tenantCount,
        maintenances: maintenanceCount
      },
      lastActivity: {
        lastUserUpdate: lastUser ? {
          date: lastUser.updatedAt,
          user: lastUser.name
        } : null,
        lastOwnerUpdate: lastOwner ? {
          date: lastOwner.updatedAt,
          owner: lastOwner.name
        } : null
      },
      backup: {
        available: true,
        downloadUrl: '/api/backup/download',
        recommendedFrequency: 'daily',
        estimatedSize: `${Math.ceil(totalRecords * 0.001)}MB`
      }
    }
    
    return NextResponse.json(backupStatus)
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao verificar status dos dados', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}