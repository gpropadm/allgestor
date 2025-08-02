import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generatePaymentsForContract } from '@/lib/payment-generator'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 SAFELY GENERATING MISSING PAYMENTS FOR CONTRACTS WITHOUT PAYMENTS')
    
    // Get ALL active contracts from ALL users
    const contracts = await prisma.contract.findMany({
      where: { 
        status: 'ACTIVE'
      },
      include: { 
        tenant: { select: { name: true } },
        property: { select: { title: true } },
        user: { select: { email: true } }
      }
    })
    
    console.log(`📊 Found ${contracts.length} active contracts in total`)
    
    if (contracts.length === 0) {
      return NextResponse.json({
        error: 'No active contracts found',
        message: 'No active contracts found in the system'
      }, { status: 404 })
    }
    
    let totalPaymentsCreated = 0
    const contractsProcessed = []
    
    for (const contract of contracts) {
      console.log(`\n📝 Processing contract: ${contract.tenant?.name} - ${contract.property?.title}`)
      console.log(`   User: ${contract.user?.email}`)
      console.log(`   Period: ${contract.startDate.toLocaleDateString('pt-BR')} to ${contract.endDate.toLocaleDateString('pt-BR')}`)
      
      try {
        // ✅ SEGURO: Verificar se já tem pagamentos (NÃO DELETAR!)
        const existingPayments = await prisma.payment.count({
          where: { contractId: contract.id }
        })
        
        if (existingPayments > 0) {
          console.log(`   ⚠️  Contract already has ${existingPayments} payments - SKIPPING to preserve data`)
          contractsProcessed.push({
            id: contract.id,
            tenant: contract.tenant?.name,
            property: contract.property?.title,
            user: contract.user?.email,
            status: 'skipped',
            reason: 'Already has payments',
            existingPayments: existingPayments
          })
          continue
        }
        
        // ✅ SEGURO: Apenas gerar pagamentos para contratos SEM pagamentos
        console.log(`   🎯 Contract WITHOUT payments - generating safely...`)
        const payments = await generatePaymentsForContract(contract.id)
        const paymentsCount = payments?.length || 0
        
        console.log(`   ✅ Generated ${paymentsCount} new payments`)
        totalPaymentsCreated += paymentsCount
        
        contractsProcessed.push({
          id: contract.id,
          tenant: contract.tenant?.name,
          property: contract.property?.title,
          user: contract.user?.email,
          status: 'generated',
          paymentsCreated: paymentsCount
        })
      } catch (error) {
        console.error(`   ❌ Error processing contract ${contract.id}:`, error)
        contractsProcessed.push({
          id: contract.id,
          tenant: contract.tenant?.name,
          property: contract.property?.title,
          user: contract.user?.email,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    console.log(`\n🎉 COMPLETED! Total payments created: ${totalPaymentsCreated}`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully generated payments for ${contractsProcessed.filter(c => c.status === 'generated').length} contracts (${contractsProcessed.filter(c => c.status === 'skipped').length} contracts already had payments and were safely skipped)`,
      totalPaymentsCreated,
      contractsProcessed: contractsProcessed.length,
      details: contractsProcessed
    })
    
  } catch (error) {
    console.error('Regenerate all payments error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}