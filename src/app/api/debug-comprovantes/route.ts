import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log('=== DEBUG COMPROVANTES ===')
    console.log('User ID:', user.id)
    
    // Buscar todos os pagamentos PAID do usuário
    const paidPayments = await prisma.payment.findMany({
      where: {
        status: 'PAID',
        contract: {
          userId: user.id
        }
      },
      include: {
        contract: {
          include: {
            property: { 
              include: { owner: true }
            },
            tenant: true
          }
        }
      },
      orderBy: {
        paidDate: 'desc'
      }
    })
    
    console.log(`📊 Total de pagamentos PAID: ${paidPayments.length}`)
    
    // Agrupar por ano
    const paymentsByYear: Record<number, any[]> = {}
    const paymentsByOwner: Record<string, any[]> = {}
    
    paidPayments.forEach(payment => {
      if (payment.paidDate) {
        const year = payment.paidDate.getFullYear()
        const ownerName = payment.contract.property.owner.name
        
        if (!paymentsByYear[year]) paymentsByYear[year] = []
        if (!paymentsByOwner[ownerName]) paymentsByOwner[ownerName] = []
        
        const paymentInfo = {
          id: payment.id,
          contractId: payment.contractId,
          amount: payment.amount,
          paidDate: payment.paidDate.toLocaleDateString('pt-BR'),
          property: payment.contract.property.title,
          tenant: payment.contract.tenant.name,
          owner: ownerName,
          ownerId: payment.contract.property.owner.id
        }
        
        paymentsByYear[year].push(paymentInfo)
        paymentsByOwner[ownerName].push(paymentInfo)
      }
    })
    
    console.log('📅 Pagamentos por ano:', Object.keys(paymentsByYear).map(year => `${year}: ${paymentsByYear[parseInt(year)].length} pagamentos`))
    
    return NextResponse.json({
      success: true,
      totalPaidPayments: paidPayments.length,
      paymentsByYear: Object.keys(paymentsByYear).map(year => ({
        year: parseInt(year),
        count: paymentsByYear[parseInt(year)].length,
        payments: paymentsByYear[parseInt(year)].slice(0, 5) // Primeiros 5 como amostra
      })),
      paymentsByOwner: Object.keys(paymentsByOwner).map(owner => ({
        owner,
        count: paymentsByOwner[owner].length,
        years: [...new Set(paymentsByOwner[owner].map(p => new Date(p.paidDate.split('/').reverse().join('-')).getFullYear()))],
        samplePayments: paymentsByOwner[owner].slice(0, 3)
      })),
      debug: {
        userId: user.id,
        currentDate: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ Erro no debug comprovantes:', error)
    return NextResponse.json({
      error: 'Erro no debug',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}