import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log('=== DEBUG NEW CONTRACT PAYMENTS ===')
    console.log('User ID:', user.id)
    
    // Buscar contratos mais recentes do usuário
    const recentContracts = await prisma.contract.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        property: { select: { title: true } },
        tenant: { select: { name: true } }
      }
    })
    
    console.log(`Encontrados ${recentContracts.length} contratos recentes:`)
    
    for (const contract of recentContracts) {
      console.log(`\n📋 Contrato: ${contract.id}`)
      console.log(`  - Propriedade: ${contract.property.title}`)
      console.log(`  - Inquilino: ${contract.tenant.name}`)
      console.log(`  - Status: ${contract.status}`)
      console.log(`  - Criado em: ${contract.createdAt}`)
      console.log(`  - Valor: R$ ${contract.rentAmount}`)
      
      // Buscar pagamentos deste contrato
      const payments = await prisma.payment.findMany({
        where: { contractId: contract.id },
        orderBy: { dueDate: 'asc' }
      })
      
      console.log(`  - Pagamentos: ${payments.length}`)
      
      if (payments.length > 0) {
        payments.forEach((payment, index) => {
          console.log(`    ${index + 1}. ${payment.dueDate.toLocaleDateString('pt-BR')} - R$ ${payment.amount} - ${payment.status}`)
        })
      } else {
        console.log('    ❌ NENHUM PAGAMENTO ENCONTRADO!')
      }
    }
    
    // Se não há pagamentos no contrato mais recente, tentar gerar
    const mostRecentContract = recentContracts[0]
    if (mostRecentContract) {
      const paymentsCount = await prisma.payment.count({
        where: { contractId: mostRecentContract.id }
      })
      
      if (paymentsCount === 0) {
        console.log('\n🔧 TENTANDO GERAR PAGAMENTOS PARA O CONTRATO MAIS RECENTE...')
        
        try {
          const { generatePaymentsForContract } = await import('@/lib/payment-generator')
          const generatedPayments = await generatePaymentsForContract(mostRecentContract.id, true)
          console.log(`✅ ${generatedPayments.length} pagamentos gerados!`)
        } catch (error) {
          console.error('❌ Erro ao gerar pagamentos:', error)
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      contracts: recentContracts.map(c => ({
        id: c.id,
        property: c.property.title,
        tenant: c.tenant.name,
        status: c.status,
        createdAt: c.createdAt,
        paymentsCount: 0 // Will be filled by separate query
      }))
    })
    
  } catch (error) {
    console.error('❌ Erro no debug:', error)
    return NextResponse.json({
      error: 'Erro no debug',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}