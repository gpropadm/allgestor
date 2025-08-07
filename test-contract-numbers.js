/**
 * Script para testar se os números de contrato estão funcionando
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testContractNumbers() {
  try {
    console.log('🔍 Testando números de contrato...')
    
    // Verificar contratos existentes
    const contracts = await prisma.contract.findMany({
      select: {
        id: true,
        contractNumber: true,
        createdAt: true,
        userId: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })
    
    console.log(`📋 Total de contratos encontrados: ${contracts.length}`)
    
    contracts.forEach(contract => {
      console.log(`- ID: ${contract.id}`)
      console.log(`  Número: ${contract.contractNumber || 'NULL'}`)
      console.log(`  Data: ${contract.createdAt.toISOString()}`)
      console.log(`  User: ${contract.userId}`)
      console.log('---')
    })
    
    // Contar contratos com e sem número
    const withNumber = contracts.filter(c => c.contractNumber).length
    const withoutNumber = contracts.filter(c => !c.contractNumber).length
    
    console.log(`✅ Com número: ${withNumber}`)
    console.log(`❌ Sem número: ${withoutNumber}`)
    
    if (withoutNumber > 0) {
      console.log('\n🔄 Executar migração:')
      console.log('node migrate-contract-number.js')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    
    if (error.message.includes('contractNumber')) {
      console.log('\n⚠️  Campo contractNumber não existe no banco.')
      console.log('Execute: npx prisma db push')
    }
    
  } finally {
    await prisma.$disconnect()
  }
}

testContractNumbers()