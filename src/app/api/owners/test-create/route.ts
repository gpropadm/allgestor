import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TEST CREATE: Starting...')
    
    // Test auth
    const user = await requireAuth(request)
    console.log('✅ TEST: User authenticated:', { id: user.id, companyId: user.companyId })
    
    // Test minimal owner creation without bank account first
    const minimalOwnerData = {
      name: 'TESTE MINIMAL',
      email: 'minimal@test.com',
      phone: '(61) 99999-8888',
      document: '888.888.888-88',
      address: 'Rua Test Minimal',
      city: 'Brasília',
      state: 'DF',
      zipCode: '70000-000',
      companyId: user.companyId,
      userId: user.id
    }
    
    console.log('📝 TEST: Creating minimal owner (no bank):', minimalOwnerData)
    
    // Test owner creation without bank account
    const minimalOwner = await prisma.owner.create({
      data: minimalOwnerData
    })
    
    console.log('✅ TEST: Minimal owner created:', minimalOwner.id)
    
    // Now test with bank account
    const fullOwnerData = {
      name: 'TESTE FULL',
      email: 'full@test.com',
      phone: '(61) 99999-7777',
      document: '777.777.777-77',
      address: 'Rua Test Full',
      city: 'Brasília',
      state: 'DF',
      zipCode: '70000-000',
      companyId: user.companyId,
      userId: user.id
    }
    
    console.log('📝 TEST: Creating full owner with bank account...')
    
    const fullOwner = await prisma.owner.create({
      data: fullOwnerData
    })
    
    console.log('✅ TEST: Full owner created:', fullOwner.id)
    
    // Test bank account creation
    const bankData = {
      ownerId: fullOwner.id,
      bankName: 'Banco Teste',
      bankCode: '999',
      accountType: 'Conta Corrente',
      agency: '9999',
      account: '999999',
      accountDigit: '9',
      pixKey: 'teste@pix.com'
    }
    
    console.log('🏦 TEST: Creating bank account:', bankData)
    
    const bankAccount = await prisma.bankAccounts.create({
      data: bankData
    })
    
    console.log('✅ TEST: Bank account created:', bankAccount.id)
    
    // Clean up test data
    await prisma.bankAccounts.delete({ where: { id: bankAccount.id } })
    await prisma.owner.delete({ where: { id: fullOwner.id } })
    await prisma.owner.delete({ where: { id: minimalOwner.id } })
    
    console.log('🧹 TEST: Cleanup completed')
    
    return NextResponse.json({
      success: true,
      message: 'Teste de criação executado com sucesso',
      results: {
        minimalOwner: minimalOwner.id,
        fullOwner: fullOwner.id,
        bankAccount: bankAccount.id
      }
    })
    
  } catch (error) {
    console.error('❌ TEST CREATE Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no teste de criação',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}