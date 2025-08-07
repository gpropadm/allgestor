/**
 * Script para migrar contratos existentes e adicionar números amigáveis
 * Execute com: node migrate-contract-number.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrateContractNumbers() {
  try {
    console.log('🔄 Iniciando migração de números de contrato...')
    
    // Buscar contratos sem contractNumber
    const contractsWithoutNumber = await prisma.contract.findMany({
      where: {
        contractNumber: null
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        userId: true,
        createdAt: true
      }
    })
    
    console.log(`📋 Encontrados ${contractsWithoutNumber.length} contratos para migrar`)
    
    // Agrupar por usuário e ano
    const contractsByUserYear = {}
    
    contractsWithoutNumber.forEach(contract => {
      const year = new Date(contract.createdAt).getFullYear()
      const key = `${contract.userId}_${year}`
      
      if (!contractsByUserYear[key]) {
        contractsByUserYear[key] = []
      }
      
      contractsByUserYear[key].push(contract)
    })
    
    // Gerar números sequenciais para cada grupo
    let totalUpdated = 0
    
    for (const [key, contracts] of Object.entries(contractsByUserYear)) {
      const [userId, year] = key.split('_')
      
      // Verificar qual é o próximo número sequencial para este usuário/ano
      const existingContracts = await prisma.contract.findMany({
        where: {
          userId: userId,
          contractNumber: {
            startsWith: `CTR-${year}-`
          }
        },
        select: {
          contractNumber: true
        }
      })
      
      // Extrair números existentes
      const existingNumbers = existingContracts
        .map(c => {
          const match = c.contractNumber?.match(/CTR-\d{4}-(\d+)/)
          return match ? parseInt(match[1]) : 0
        })
        .filter(n => n > 0)
      
      const maxExisting = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0
      let nextSeq = maxExisting + 1
      
      // Atualizar contratos em lote
      for (const contract of contracts) {
        const contractNumber = `CTR-${year}-${String(nextSeq).padStart(3, '0')}`
        
        await prisma.contract.update({
          where: { id: contract.id },
          data: { contractNumber }
        })
        
        console.log(`✅ Contrato ${contract.id} → ${contractNumber}`)
        nextSeq++
        totalUpdated++
      }
    }
    
    console.log(`🎉 Migração concluída! ${totalUpdated} contratos atualizados`)
    
  } catch (error) {
    console.error('❌ Erro na migração:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  migrateContractNumbers()
}

module.exports = { migrateContractNumbers }