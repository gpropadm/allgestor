// API para gerar boleto com split automático ASAAS
// Endpoint: POST /api/asaas/generate-boleto

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
      amount, 
      dueDate, 
      description 
    } = body

    if (!contractId || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'contractId, amount e dueDate são obrigatórios' },
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
            owner: {
              include: {
                bankAccounts: true
              }
            }
          }
        },
        tenant: true
      }
    })

    if (!contract) {
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      )
    }

    if (contract.property.owner.companyId !== session.user.companyId) {
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'Acesso negado a este contrato' },
        { status: 403 }
      )
    }

    // Preparar dados para split
    const contractData = {
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
      rentAmount: amount,
      administrationFeePercentage: contract.administrationFeePercentage || 10,
      dueDate,
      companyId: session.user.companyId
    }

    console.log('Gerando boleto com split:', {
      contractId,
      amount,
      ownerName: contract.property.owner.name,
      tenantName: contract.tenant.name,
      administrationFee: contractData.administrationFeePercentage
    })

    // Gerar boleto com split
    const splitService = new PaymentSplitService()
    const result = await splitService.generateSplitPayment(contractData)

    await prisma.$disconnect()

    if (result.success) {
      return NextResponse.json({
        success: true,
        paymentId: result.paymentId,
        boletoUrl: result.boletoUrl,
        pixQrCode: result.pixQrCode,
        message: result.message,
        splitDetails: result.splitDetails
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro ao gerar boleto com split:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Listar boletos gerados
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')

    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const where: any = {}
    
    if (contractId) {
      where.contractId = contractId
    }

    // Buscar apenas pagamentos da empresa do usuário
    const payments = await prisma.payment.findMany({
      where: {
        ...where,
        contract: {
          property: {
            owner: {
              companyId: session.user.companyId
            }
          }
        }
      },
      include: {
        contract: {
          include: {
            property: {
              include: {
                owner: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            },
            tenant: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      payments: payments.map(payment => ({
        id: payment.id,
        contractId: payment.contractId,
        amount: payment.amount,
        dueDate: payment.dueDate,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        boletoUrl: payment.boletoUrl,
        pixQrCode: payment.pixQrCode,
        asaasPaymentId: payment.asaasPaymentId,
        ownerAmount: payment.ownerAmount,
        companyAmount: payment.companyAmount,
        asaasFee: payment.asaasFee,
        splitStatus: payment.splitStatus,
        paidDate: payment.paidDate,
        property: {
          title: payment.contract.property.title,
          owner: payment.contract.property.owner
        },
        tenant: payment.contract.tenant,
        createdAt: payment.createdAt
      }))
    })
  } catch (error) {
    console.error('Erro ao listar boletos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}