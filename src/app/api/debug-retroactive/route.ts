import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { generatePaymentsForContract } from '@/lib/payment-generator'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log('=== DEBUG RETROACTIVE CONTRACTS ===')
    
    // Buscar todos os contratos do usuário
    const contracts = await prisma.contract.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        property: { select: { title: true } },
        tenant: { select: { name: true } }
      }
    })
    
    console.log(`📋 Encontrados ${contracts.length} contratos`)
    
    const results = []
    
    for (const contract of contracts) {
      console.log(`\n📋 CONTRATO: ${contract.property.title} - ${contract.tenant.name}`)
      console.log(`  ID: ${contract.id}`)
      console.log(`  Status: ${contract.status}`)
      console.log(`  Período: ${contract.startDate.toLocaleDateString('pt-BR')} até ${contract.endDate.toLocaleDateString('pt-BR')}`)
      console.log(`  Valor: R$ ${contract.rentAmount}`)
      
      // Contar pagamentos existentes
      const paymentsCount = await prisma.payment.count({
        where: { contractId: contract.id }
      })
      
      console.log(`  💰 Pagamentos no banco: ${paymentsCount}`)
      
      // Buscar pagamentos detalhados
      const payments = await prisma.payment.findMany({
        where: { contractId: contract.id },
        orderBy: { dueDate: 'asc' },
        take: 5 // Primeiros 5 para não sobrecarregar
      })
      
      const paymentDetails = payments.map(p => ({
        dueDate: p.dueDate.toLocaleDateString('pt-BR'),
        status: p.status,
        amount: p.amount
      }))
      
      console.log(`  📅 Primeiros pagamentos:`, paymentDetails)
      
      // Verificar se é retroativo
      const startYear = contract.startDate.getFullYear()
      const currentYear = new Date().getFullYear()
      const isRetroactive = startYear < currentYear
      
      results.push({
        contractId: contract.id,
        property: contract.property.title,
        tenant: contract.tenant.name,
        status: contract.status,
        startDate: contract.startDate.toLocaleDateString('pt-BR'),
        endDate: contract.endDate.toLocaleDateString('pt-BR'),
        rentAmount: contract.rentAmount,
        isRetroactive,
        paymentsCount,
        samplePayments: paymentDetails
      })
      
      // Se não tem pagamentos, tentar gerar
      if (paymentsCount === 0 && contract.status === 'ACTIVE') {
        console.log(`  🔧 TENTANDO GERAR PAGAMENTOS...`)
        try {
          const generated = await generatePaymentsForContract(contract.id, true)
          console.log(`  ✅ ${generated.length} pagamentos gerados!`)
          
          results[results.length - 1].generatedNow = generated.length
        } catch (error) {
          console.error(`  ❌ ERRO ao gerar:`, error)
          results[results.length - 1].generationError = error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      totalContracts: contracts.length,
      contracts: results,
      debug: {
        userId: user.id,
        currentDate: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ Erro no debug retroativo:', error)
    return NextResponse.json({
      error: 'Erro no debug',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}