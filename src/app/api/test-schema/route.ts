import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testando schema após mudanças...')
    
    // Teste 1: Buscar contratos básicos
    const contracts = await prisma.contract.findMany({
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true
      },
      take: 5
    })
    
    console.log('✅ Contratos básicos:', contracts.length)
    
    // Teste 2: Buscar propriedades
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        address: true
      },
      take: 5
    })
    
    console.log('✅ Propriedades:', properties.length)
    
    // Teste 3: Buscar inquilinos
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        email: true
      },
      take: 5
    })
    
    console.log('✅ Inquilinos:', tenants.length)
    
    // Teste 4: Buscar proprietários
    const owners = await prisma.owner.findMany({
      select: {
        id: true,
        name: true,
        email: true
      },
      take: 5
    })
    
    console.log('✅ Proprietários:', owners.length)
    
    // Teste 5: Verificar campo contractNumber
    let contractNumberTest = null
    try {
      const contractWithNumber = await prisma.contract.findFirst({
        select: {
          id: true,
          contractNumber: true
        }
      })
      contractNumberTest = {
        success: true,
        hasField: true,
        sample: contractWithNumber
      }
    } catch (error: any) {
      contractNumberTest = {
        success: false,
        hasField: false,
        error: error.message
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        contracts: { count: contracts.length, status: 'OK' },
        properties: { count: properties.length, status: 'OK' },
        tenants: { count: tenants.length, status: 'OK' },
        owners: { count: owners.length, status: 'OK' },
        contractNumber: contractNumberTest
      },
      samples: {
        contracts: contracts.slice(0, 2),
        properties: properties.slice(0, 2),
        tenants: tenants.slice(0, 2),
        owners: owners.slice(0, 2)
      }
    })
    
  } catch (error: any) {
    console.error('❌ Erro no teste de schema:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack?.substring(0, 1000),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}