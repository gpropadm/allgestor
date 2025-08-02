import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 DEBUG UPDATE: Starting test...')
    
    // Get first owner to test update
    const firstOwner = await prisma.owner.findFirst({
      include: {
        bankAccounts: true,
        properties: true
      }
    })
    
    if (!firstOwner) {
      return NextResponse.json({ error: 'Nenhum proprietário encontrado para teste' }, { status: 404 })
    }
    
    console.log('👤 Testing update for owner:', firstOwner.id, firstOwner.name)
    
    // Test simple update (just name change)
    const testUpdate = {
      name: firstOwner.name + ' (TESTE)',
      email: firstOwner.email,
      phone: firstOwner.phone,
      document: firstOwner.document,
      address: firstOwner.address || '',
      city: firstOwner.city || '',
      state: firstOwner.state || '',
      zipCode: firstOwner.zipCode || ''
    }
    
    console.log('📝 Update data:', testUpdate)
    
    // Perform update
    const updatedOwner = await prisma.owner.update({
      where: { id: firstOwner.id },
      data: testUpdate,
      include: {
        properties: true,
        bankAccounts: true
      }
    })
    
    console.log('✅ Update successful!')
    
    // Revert the change
    await prisma.owner.update({
      where: { id: firstOwner.id },
      data: {
        name: firstOwner.name
      }
    })
    
    console.log('🔄 Reverted changes')
    
    return NextResponse.json({
      success: true,
      message: 'Teste de atualização executado com sucesso',
      originalOwner: firstOwner,
      updatedOwner: updatedOwner,
      testData: testUpdate
    })
    
  } catch (error) {
    console.error('❌ DEBUG UPDATE Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no teste de atualização',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}