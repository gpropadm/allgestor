import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generatePaymentsForContract } from '@/lib/payment-generator'
import { requireAuth, isUserAdmin } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        tenant: true,
        payments: true
      }
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error fetching contract:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar contrato' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const contract = await prisma.contract.update({
      where: { id },
      data: {
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        rentAmount: data.rentAmount,
        depositAmount: data.depositAmount,
        administrationFeePercentage: data.administrationFeePercentage || 10.0,
        terms: data.terms || null,
        status: data.status
      },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        tenant: true,
        payments: true
      }
    })

    // 🚀 REGENERAR PAGAMENTOS AUTOMATICAMENTE quando atualizar contrato
    if (contract.status === 'ACTIVE') {
      console.log('📅 Regenerando pagamentos para contrato atualizado:', contract.id)
      try {
        await generatePaymentsForContract(contract.id)
        console.log('✅ Pagamentos regenerados após atualização!')
      } catch (error) {
        console.error('❌ Erro ao regenerar pagamentos:', error)
      }
    }

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error updating contract:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar contrato' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth(request)
    const userIsAdmin = await isUserAdmin(user.id)
    
    console.log('🗑️ Attempting to delete contract:', id, 'by user:', user.id, 'isAdmin:', userIsAdmin)
    
    // Check if contract exists and user has permission
    const contract = await prisma.contract.findUnique({
      where: { id },
      select: { id: true, userId: true }
    })
    
    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      )
    }
    
    // Check permission: user must own the contract or be an admin
    if (!userIsAdmin && contract.userId !== user.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para deletar este contrato' },
        { status: 403 }
      )
    }
    
    // Use transaction to delete related records first, then the contract
    await prisma.$transaction(async (tx) => {
      // Delete related payments first
      const deletedPayments = await tx.payment.deleteMany({
        where: { contractId: id }
      })
      console.log('💸 Deleted payments:', deletedPayments.count)
      
      // Delete related notifications
      const deletedNotifications = await tx.notification.deleteMany({
        where: { contractId: id }
      })
      console.log('🔔 Deleted notifications:', deletedNotifications.count)
      
      // Delete related maintenances
      const deletedMaintenances = await tx.maintenance.deleteMany({
        where: { contractId: id }
      })
      console.log('🔧 Deleted maintenances:', deletedMaintenances.count)
      
      // Delete related monthly reports
      const deletedReports = await tx.monthlyReport.deleteMany({
        where: { contractId: id }
      })
      console.log('📊 Deleted monthly reports:', deletedReports.count)
      
      // Finally delete the contract
      const deletedContract = await tx.contract.delete({
        where: { id }
      })
      console.log('📋 Deleted contract:', deletedContract.id)
    })

    return NextResponse.json({ message: 'Contrato deletado com sucesso' })
  } catch (error) {
    console.error('Error deleting contract:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json(
          { error: 'Contrato não encontrado' },
          { status: 404 }
        )
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Não é possível deletar contrato com registros relacionados' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Erro ao deletar contrato' },
      { status: 500 }
    )
  }
}