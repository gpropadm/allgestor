import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TESTE: Starting owner creation test...')
    
    // Test auth
    const user = await requireAuth(request)
    console.log('✅ TESTE: User authenticated:', { id: user.id, companyId: user.companyId })
    
    // Test data
    const testData = {
      name: 'TESTE API',
      email: 'teste@api.com',
      phone: '(61) 99999-9999',
      document: '999.999.999-99',
      address: 'Rua Teste API',
      city: 'Brasília',
      state: 'DF',
      zipCode: '70000-000'
    }
    
    console.log('📝 TESTE: Creating owner with data:', testData)
    
    // Create owner
    const owner = await prisma.owner.create({
      data: {
        ...testData,
        companyId: user.companyId,
        userId: user.id
      }
    })
    
    console.log('✅ TESTE: Owner created successfully:', owner)
    
    return NextResponse.json({
      success: true,
      message: 'Teste de criação de proprietário executado com sucesso',
      owner: owner
    })
    
  } catch (error) {
    console.error('❌ TESTE: Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no teste',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 TESTE: Checking owners list...')
    
    const user = await requireAuth(request)
    console.log('✅ TESTE: User authenticated for GET:', { id: user.id, companyId: user.companyId })
    
    const owners = await prisma.owner.findMany({
      where: {
        companyId: user.companyId
      },
      include: {
        bankAccounts: true,
        properties: true
      }
    })
    
    console.log('📊 TESTE: Found owners:', owners.length)
    
    return NextResponse.json({
      success: true,
      count: owners.length,
      owners: owners
    })
    
  } catch (error) {
    console.error('❌ TESTE: GET Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no teste GET',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}