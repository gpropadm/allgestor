import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUGANDO ESTRUTURA DO BANCO...')
    
    // 1. Verificar se a tabela payments existe e sua estrutura
    const result = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position;
    `
    
    console.log('📊 Estrutura da tabela payments:', result)
    
    // 2. Tentar criar um pagamento simples para ver o erro exato
    let createError = null
    try {
      const testContract = await prisma.contract.findFirst({
        where: { status: 'ACTIVE' }
      })
      
      if (testContract) {
        console.log('🧪 Testando criação de pagamento...')
        const testPayment = await prisma.payment.create({
          data: {
            contractId: testContract.id,
            amount: 1000.00,
            dueDate: new Date(),
            status: 'PENDING'
          }
        })
        console.log('✅ Pagamento criado com sucesso:', testPayment.id)
        
        // Limpar o teste
        await prisma.payment.delete({
          where: { id: testPayment.id }
        })
        console.log('🗑️ Pagamento de teste removido')
      }
    } catch (error) {
      createError = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('❌ Erro ao criar pagamento:', createError)
    }
    
    // 3. Verificar configurações do Prisma
    const prismaVersion = await prisma.$queryRaw`SELECT version();`
    
    return NextResponse.json({
      success: true,
      tableStructure: result,
      createError,
      prismaVersion,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ ERRO:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}