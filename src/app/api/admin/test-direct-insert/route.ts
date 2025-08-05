import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 TESTANDO INSERÇÃO DIRETA NA TABELA RECIBOS...')

    const testId = `test_${Date.now()}`
    const now = new Date()
    
    // Tentar inserção mais simples possível
    await prisma.$executeRawUnsafe(`
      INSERT INTO recibos (
        id, "userId", "contractId", "paymentId", "numeroRecibo", 
        competencia, "dataPagamento", "valorTotal", "taxaAdministracao", 
        "percentualTaxa", "valorRepassado", "proprietarioNome", 
        "inquilinoNome", "imovelEndereco", "createdAt", "updatedAt"
      ) VALUES (
        '${testId}', 'test-user', 'test-contract', 'test-payment', 'TEST-001',
        '${now.toISOString()}', '${now.toISOString()}', 
        2800, 280, 10, 2520,
        'Proprietario Teste', 'Inquilino Teste', 'Endereco Teste',
        '${now.toISOString()}', '${now.toISOString()}'
      )
    `)

    console.log('✅ Inserção de teste realizada')

    // Verificar se foi inserido
    const verificacao = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM recibos WHERE id = '${testId}'
    `)

    console.log('🔍 Verificação:', verificacao)

    return NextResponse.json({
      success: true,
      message: 'Teste de inserção concluído',
      testId,
      verificacao,
      instructions: [
        '1. Se count = 1, a inserção funcionou',
        '2. Se count = 0, há problema na tabela/constraints'
      ]
    })

  } catch (error: any) {
    console.error('❌ Erro no teste:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro no teste de inserção',
      details: error.message,
      stack: error.stack?.split('\\n').slice(0, 5)
    }, { status: 500 })
  }
}