import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Final test endpoint is working', method: 'GET' })
}
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 FINAL TEST: Starting...')
    
    const user = await requireAuth(request)
    console.log('✅ User authenticated:', { id: user.id, companyId: user.companyId })
    
    // Generate unique identifiers
    const timestamp = Date.now()
    const uniqueId = Math.random().toString(36).substring(2, 8)
    
    const testData = {
      name: `TESTE FINAL ${uniqueId}`,
      email: `teste.final.${timestamp}@unique.com`,
      phone: `(61) 99${uniqueId.substring(0,3)}-${uniqueId.substring(3,7)}`,
      document: `${uniqueId.substring(0,3)}.${uniqueId.substring(3,6)}.${uniqueId.substring(0,3)}-${uniqueId.substring(4,6)}`,
      address: `Rua Teste Final ${uniqueId}`,
      city: 'Brasília',
      state: 'DF',
      zipCode: '70000-000',
      companyId: user.companyId,
      userId: user.id
    }
    
    console.log('📝 Creating unique owner:', testData)
    
    // Create owner
    const owner = await prisma.owner.create({
      data: testData
    })
    
    console.log('✅ Owner created successfully:', owner)
    
    // Test basic fetch
    const fetchedOwner = await prisma.owner.findUnique({
      where: { id: owner.id }
    })
    
    console.log('✅ Owner fetched successfully:', fetchedOwner?.id)
    
    // Clean up
    await prisma.owner.delete({
      where: { id: owner.id }
    })
    
    console.log('✅ Test completed and cleaned up')
    
    return NextResponse.json({
      success: true,
      message: 'Teste final executado com sucesso!',
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email
      }
    })
    
  } catch (error) {
    console.error('❌ FINAL TEST Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no teste final',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined
    }, { status: 500 })
  }
}