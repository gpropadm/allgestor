import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isUserAdmin } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('=== API PAYMENTS GET CALLED ===')
    const user = await requireAuth(request)
    console.log('👤 Usuário autenticado:', { id: user.id, email: user.email })
    
    // Check if user is admin
    const userIsAdmin = await isUserAdmin(user.id)
    console.log('🔐 Usuário é admin:', userIsAdmin)
    
    // Both admin and regular users see only their own contracts
    const userContracts = await prisma.contract.findMany({
      where: { userId: user.id },
      select: { id: true }
    })
    
    const contractIds = userContracts.map(c => c.id)
    console.log(`👤 ${userIsAdmin ? 'Admin' : 'Usuário'}: ${contractIds.length} contratos próprios`)
    
    if (contractIds.length === 0) {
      console.log('📭 Nenhum contrato encontrado, retornando array vazio')
      return NextResponse.json([])
    }

    // Check if payments table exists and has data
    try {
      const paymentCount = await prisma.payment.count()
      console.log(`📊 Total de pagamentos no sistema: ${paymentCount}`)
    } catch (countError) {
      console.error('❌ Erro ao contar pagamentos:', countError)
      return NextResponse.json([])
    }
    
    // Get ALL payments (remove month filter!)
    console.log('🗓️ Searching ALL payments for user contracts')
    
    const allPayments = await prisma.payment.findMany({
      where: {
        contractId: {
          in: contractIds
        }
      },
      select: {
        id: true,
        contractId: true,
        amount: true,
        dueDate: true,
        status: true,
        paidDate: true,
        paymentMethod: true,
        receipts: true,
        notes: true,
        createdAt: true
      },
      orderBy: {
        dueDate: 'desc'
      }
    })

    console.log(`📊 Encontrados ${allPayments.length} pagamentos TOTAL para o usuário ${user.email} (Admin: ${userIsAdmin})`)

    // Now enrich with basic contract info
    const enrichedPayments = await Promise.all(
      allPayments.map(async (payment) => {
        try {
          const contract = await prisma.contract.findUnique({
            where: { id: payment.contractId },
            select: {
              id: true,
              propertyId: true,
              tenantId: true,
              rentAmount: true
            }
          })
          
          if (!contract) {
            return {
              ...payment,
              maintenanceDeductions: 0,
              maintenances: [],
              contract: { 
                property: { title: 'Contrato não encontrado' },
                tenant: { name: 'Inquilino não encontrado' }
              }
            }
          }

          const property = await prisma.property.findUnique({
            where: { id: contract.propertyId },
            select: { title: true, address: true }
          })
          
          const tenant = await prisma.tenant.findUnique({
            where: { id: contract.tenantId },
            select: { name: true, email: true, phone: true }
          })

          // Calculate maintenance deductions for this contract
          const maintenances = await prisma.maintenance.findMany({
            where: {
              contractId: contract.id,
              deductFromOwner: true,
              status: 'COMPLETED', // Only completed maintenances
              completedDate: {
                gte: new Date(payment.dueDate.getFullYear(), payment.dueDate.getMonth() - 1, 1),
                lt: new Date(payment.dueDate.getFullYear(), payment.dueDate.getMonth(), 1)
              }
            },
            select: {
              id: true,
              amount: true,
              title: true,
              completedDate: true
            }
          })

          const maintenanceDeductions = maintenances.reduce((total, maintenance) => total + maintenance.amount, 0)
          
          // Mapear receipts para receiptUrl para compatibilidade
          let receiptUrl = null
          if (payment.receipts) {
            try {
              if (typeof payment.receipts === 'string') {
                const parsed = JSON.parse(payment.receipts)
                receiptUrl = parsed?.[0]?.url || null
              } else {
                receiptUrl = payment.receipts?.[0]?.url || null
              }
            } catch (error) {
              console.warn('Erro ao parsear receipts:', error)
            }
          }

          return {
            ...payment,
            maintenanceDeductions,
            maintenances,
            receiptUrl,
            contract: {
              ...contract,
              property: property || { title: 'Propriedade não encontrada', address: '' },
              tenant: tenant || { name: 'Inquilino não encontrado', email: '', phone: '' }
            }
          }
        } catch (error) {
          console.error('Error enriching payment:', payment.id, error)
          
          // Mapear receipts para receiptUrl mesmo em caso de erro
          let receiptUrl = null
          if (payment.receipts) {
            try {
              if (typeof payment.receipts === 'string') {
                const parsed = JSON.parse(payment.receipts)
                receiptUrl = parsed?.[0]?.url || null
              } else {
                receiptUrl = payment.receipts?.[0]?.url || null
              }
            } catch (error) {
              receiptUrl = null
            }
          }
          
          return {
            ...payment,
            maintenanceDeductions: 0,
            maintenances: [],
            receiptUrl,
            contract: { 
              property: { title: 'Erro ao carregar', address: '' },
              tenant: { name: 'Erro ao carregar', email: '', phone: '' }
            }
          }
        }
      })
    )

    console.log(`✅ Dados enriquecidos para ${enrichedPayments.length} pagamentos`)

    return NextResponse.json(enrichedPayments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar pagamentos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('=== API PAYMENTS PUT CALLED ===')
    const user = await requireAuth(request)
    const { id, ...data } = await request.json()
    
    console.log('📤 Dados recebidos:', { id, data })
    console.log('👤 Usuário:', { id: user.id, email: user.email })
    
    // Verificar se o pagamento pertence ao usuário
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        contract: {
          userId: user.id
        }
      }
    })

    console.log('🔍 Pagamento encontrado:', payment ? 'SIM' : 'NÃO')

    if (!payment) {
      console.log('❌ Pagamento não encontrado ou não pertence ao usuário')
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    // Atualizar o pagamento
    console.log('🔄 Atualizando pagamento...')
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: data.status || 'PAID',
        paidDate: data.paidDate ? new Date(data.paidDate) : new Date(),
        paymentMethod: data.paymentMethod,
        receipts: data.receipts || null,
        notes: data.notes || null
      },
      include: {
        contract: {
          include: {
            property: true,
            tenant: true
          }
        }
      }
    })

    console.log('✅ Pagamento atualizado com sucesso:', updatedPayment.id)
    return NextResponse.json(updatedPayment)
  } catch (error) {
    console.error('Error updating payment:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar pagamento', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}