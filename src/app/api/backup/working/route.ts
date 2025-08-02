import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('🛡️ Starting working backup...')
    
    // Autenticação
    const user = await requireAuth(request)
    console.log('✅ User authenticated:', user.email)
    
    // Buscar apenas dados básicos que sabemos que existem
    console.log('📊 Fetching basic data...')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    const companies = await prisma.company.findMany()
    
    const owners = await prisma.owner.findMany()
    
    const properties = await prisma.property.findMany()
    
    // Tentar buscar contas bancárias com segurança
    let bankAccounts = []
    try {
      bankAccounts = await prisma.bankAccounts.findMany()
    } catch (error) {
      console.log('BankAccounts error (ignored):', error.message)
    }
    
    // Criar backup
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        environment: "production",
        companyId: 'ALL_COMPANIES',
        requestedBy: {
          userId: user.id,
          email: user.email,
          name: user.name
        },
        totalRecords: users.length + companies.length + owners.length + properties.length + bankAccounts.length
      },
      data: {
        users: users.map(u => ({
          ...u,
          password: '[HIDDEN]' // Segurança
        })),
        companies,
        owners,
        properties,
        bankAccounts
      },
      counts: {
        users: users.length,
        companies: companies.length,
        owners: owners.length,
        properties: properties.length,
        bankAccounts: bankAccounts.length
      }
    }
    
    // Nome do arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup-ultraphink-${timestamp}.json`
    
    console.log('✅ Backup created successfully:', {
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
    console.error('❌ Error in working backup:', error)
    
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
        stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}