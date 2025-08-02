// API para gerar pagamentos com split ASAAS
// Endpoint: POST /api/payments/split

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PaymentSplitService } from '@/lib/payment-split-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      contractId,
      dueDate,
      amount,
      description
    } = body

    if (!contractId || !dueDate) {
      return NextResponse.json(
        { error: 'contractId e dueDate são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar dados do contrato
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        tenant: true,
        company: true
      }
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      )
    }

    if (contract.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Acesso negado a este contrato' },
        { status: 403 }
      )
    }

    // Inicializar serviço de split
    const splitService = new PaymentSplitService()

    // Gerar pagamento com split
    const result = await splitService.generateSplitPayment({
      contractId: contract.id,
      propertyTitle: contract.property.title,
      tenantName: contract.tenant.name,
      tenantEmail: contract.tenant.email,
      tenantPhone: contract.tenant.phone,
      tenantDocument: contract.tenant.document,
      ownerName: contract.property.owner.name,
      ownerEmail: contract.property.owner.email,
      ownerDocument: contract.property.owner.document,
      ownerPhone: contract.property.owner.phone,
      rentAmount: amount || contract.rentAmount,
      administrationFeePercentage: contract.administrationFeePercentage,
      managementFeePercentage: contract.managementFeePercentage,
      dueDate: dueDate,
      companyId: session.user.companyId
    })

    await prisma.$disconnect()

    if (result.success) {
      return NextResponse.json({
        success: true,
        payment: {
          id: result.paymentId,
          boletoUrl: result.boletoUrl,
          pixQrCode: result.pixQrCode,
          splitDetails: result.splitDetails
        },
        message: result.message
      })
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erro na API de split:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Gerar múltiplos pagamentos (mensais)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      contractId,
      startDate,
      endDate
    } = body

    if (!contractId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'contractId, startDate e endDate são obrigatórios' },
        { status: 400 }
      )
    }

    const splitService = new PaymentSplitService()

    const result = await splitService.generateMonthlyPaymentsWithSplit(
      contractId,
      startDate,
      endDate,
      session.user.companyId
    )

    return NextResponse.json({
      success: result.success,
      paymentsGenerated: result.paymentsGenerated,
      message: result.message,
      errors: result.errors
    })
  } catch (error) {
    console.error('Erro ao gerar pagamentos mensais:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}