import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log('🔍 Testando operações básicas do sistema...')
    
    const tests: any = {
      user: null,
      properties: null,
      owners: null,
      tenants: null,
      contracts: null,
      timestamp: new Date().toISOString()
    }
    
    // Teste 1: Buscar proprietários
    try {
      const owners = await prisma.owner.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          document: true
        },
        take: 5
      })
      tests.owners = { status: '✅', count: owners.length, sample: owners[0] || null }
    } catch (error: any) {
      tests.owners = { status: '❌', error: error.message }
    }
    
    // Teste 2: Buscar propriedades
    try {
      const properties = await prisma.property.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          title: true,
          address: true,
          propertyType: true,
          ownerId: true
        },
        take: 5
      })
      tests.properties = { status: '✅', count: properties.length, sample: properties[0] || null }
    } catch (error: any) {
      tests.properties = { status: '❌', error: error.message }
    }
    
    // Teste 3: Buscar inquilinos
    try {
      const tenants = await prisma.tenant.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          document: true
        },
        take: 5
      })
      tests.tenants = { status: '✅', count: tenants.length, sample: tenants[0] || null }
    } catch (error: any) {
      tests.tenants = { status: '❌', error: error.message }
    }
    
    // Teste 4: Buscar contratos (sem includes problemáticos)
    try {
      const contracts = await prisma.contract.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          rentAmount: true,
          status: true,
          propertyId: true,
          tenantId: true
        },
        take: 5
      })
      tests.contracts = { status: '✅', count: contracts.length, sample: contracts[0] || null }
    } catch (error: any) {
      tests.contracts = { status: '❌', error: error.message }
    }
    
    // Teste 5: Testar criação simples (dry run)
    tests.can_create = {
      owners: tests.owners.status === '✅',
      properties: tests.properties.status === '✅',
      tenants: tests.tenants.status === '✅',
      contracts: tests.contracts.status === '✅'
    }
    
    const allWorking = Object.values(tests.can_create).every(v => v === true)
    tests.overall_status = allWorking ? '✅ All systems operational' : '⚠️ Some issues found'
    
    return NextResponse.json(tests)
    
  } catch (error: any) {
    console.error('❌ Erro no teste de operações básicas:', error)
    
    return NextResponse.json({
      error: 'Erro crítico no teste',
      message: error.message,
      stack: error.stack?.substring(0, 1000),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { test } = await request.json()
    
    console.log(`🧪 Executando teste: ${test}`)
    
    if (test === 'create_owner') {
      const owner = await prisma.owner.create({
        data: {
          name: 'Teste Owner ' + Date.now(),
          email: 'teste@owner.com',
          document: '123.456.789-00',
          userId: user.id,
          companyId: user.companyId || ''
        }
      })
      return NextResponse.json({ success: true, owner })
    }
    
    if (test === 'create_tenant') {
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Teste Tenant ' + Date.now(),
          email: 'teste@tenant.com',
          phone: '(11) 99999-9999',
          document: '987.654.321-00',
          userId: user.id,
          companyId: user.companyId || ''
        }
      })
      return NextResponse.json({ success: true, tenant })
    }
    
    return NextResponse.json({ error: 'Teste não reconhecido' }, { status: 400 })
    
  } catch (error: any) {
    console.error(`❌ Erro no teste ${test}:`, error)
    
    return NextResponse.json({
      error: `Erro no teste ${test}`,
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}