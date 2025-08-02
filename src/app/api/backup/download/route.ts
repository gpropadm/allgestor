import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await requireAuth(request)
    
    // Verificar se é admin
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem fazer backup.' },
        { status: 403 }
      )
    }

    console.log('🛡️ Iniciando backup para download...', { userId: user.id, email: user.email })
    
    // Buscar dados básicos primeiro
    console.log('📊 Buscando dados básicos...')
    
    const users = await prisma.user.findMany({ 
      where: { companyId: user.companyId }
    }).catch(error => {
      console.error('Erro ao buscar users:', error)
      return []
    })
    
    const companies = await prisma.company.findMany({
      where: { id: user.companyId }
    }).catch(error => {
      console.error('Erro ao buscar companies:', error)
      return []
    })
    
    const owners = await prisma.owner.findMany({ 
      where: { companyId: user.companyId }
    }).catch(error => {
      console.error('Erro ao buscar owners:', error)
      return []
    })
    
    const properties = await prisma.property.findMany({ 
      where: { companyId: user.companyId }
    }).catch(error => {
      console.error('Erro ao buscar properties:', error)
      return []
    })
    
    const bankAccounts = await prisma.bankAccounts.findMany({
      where: { 
        owner: { companyId: user.companyId }
      }
    }).catch(error => {
      console.error('Erro ao buscar bankAccounts:', error)
      return []
    })
    
    // Tabelas opcionais - tentar buscar mas não falhar se não existirem
    let leads = []
    let contracts = []
    let payments = []
    let tenants = []
    let maintenances = []
    
    try {
      if (prisma.lead && typeof prisma.lead.findMany === 'function') {
        leads = await prisma.lead.findMany({ 
          where: { companyId: user.companyId } 
        })
      }
    } catch (error) {
      console.log('Tabela lead não encontrada ou erro:', error.message)
    }
    
    try {
      if (prisma.contract && typeof prisma.contract.findMany === 'function') {
        contracts = await prisma.contract.findMany({
          where: { property: { companyId: user.companyId } }
        })
      }
    } catch (error) {
      console.log('Tabela contract não encontrada ou erro:', error.message)
    }
    
    try {
      if (prisma.payment && typeof prisma.payment.findMany === 'function') {
        payments = await prisma.payment.findMany({
          where: { contract: { property: { companyId: user.companyId } } }
        })
      }
    } catch (error) {
      console.log('Tabela payment não encontrada ou erro:', error.message)
    }
    
    try {
      if (prisma.tenant && typeof prisma.tenant.findMany === 'function') {
        tenants = await prisma.tenant.findMany({
          where: { companyId: user.companyId }
        })
      }
    } catch (error) {
      console.log('Tabela tenant não encontrada ou erro:', error.message)
    }
    
    try {
      if (prisma.maintenance && typeof prisma.maintenance.findMany === 'function') {
        maintenances = await prisma.maintenance.findMany({
          where: { property: { companyId: user.companyId } }
        })
      }
    } catch (error) {
      console.log('Tabela maintenance não encontrada ou erro:', error.message)
    }
    
    // Criar objeto de backup
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        environment: "production",
        companyId: user.companyId,
        requestedBy: {
          userId: user.id,
          email: user.email,
          name: user.name
        },
        totalRecords: users.length + companies.length + owners.length + properties.length
      },
      data: {
        users: users.map(u => ({
          ...u,
          password: '[HIDDEN]' // Não expor senhas
        })),
        companies,
        owners,
        properties,
        bankAccounts,
        leads,
        contracts,
        payments,
        tenants,
        maintenances
      },
      counts: {
        users: users.length,
        companies: companies.length,
        owners: owners.length,
        properties: properties.length,
        bankAccounts: bankAccounts.length,
        leads: Array.isArray(leads) ? leads.length : 0,
        contracts: Array.isArray(contracts) ? contracts.length : 0,
        payments: Array.isArray(payments) ? payments.length : 0,
        tenants: Array.isArray(tenants) ? tenants.length : 0,
        maintenances: Array.isArray(maintenances) ? maintenances.length : 0
      }
    }
    
    // Gerar nome do arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup-ultraphink-${timestamp}.json`
    
    console.log('✅ Backup gerado com sucesso:', {
      filename,
      totalRecords: backupData.metadata.totalRecords,
      counts: backupData.counts
    })
    
    // Retornar como download
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('❌ Erro no backup:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao gerar backup', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}