// API para configurar conta ASAAS de proprietários
// Endpoint: POST /api/asaas/setup-owner

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
    const { ownerId } = body

    if (!ownerId) {
      return NextResponse.json(
        { error: 'ownerId é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se proprietário pertence à empresa
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      select: {
        id: true,
        name: true,
        companyId: true,
        bankAccounts: {
          where: {
            asaasWalletId: {
              not: null
            }
          }
        }
      }
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Proprietário não encontrado' },
        { status: 404 }
      )
    }

    if (owner.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Acesso negado a este proprietário' },
        { status: 403 }
      )
    }

    // Verificar se já tem conta ASAAS
    if (owner.bankAccounts.length > 0) {
      return NextResponse.json({
        success: true,
        walletId: owner.bankAccounts[0].asaasWalletId,
        message: 'Proprietário já possui conta ASAAS configurada',
        alreadyExists: true
      })
    }

    // Configurar conta ASAAS
    const splitService = new PaymentSplitService()
    const result = await splitService.setupOwnerAsaasAccount(ownerId, session.user.companyId)

    await prisma.$disconnect()

    return NextResponse.json({
      success: result.success,
      walletId: result.walletId,
      message: result.message
    })
  } catch (error) {
    console.error('Erro ao configurar conta ASAAS do proprietário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Verificar status da configuração ASAAS de um proprietário
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
    const ownerId = searchParams.get('ownerId')

    if (!ownerId) {
      return NextResponse.json(
        { error: 'ownerId é obrigatório' },
        { status: 400 }
      )
    }

    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      include: {
        bankAccounts: {
          where: {
            asaasWalletId: {
              not: null
            }
          }
        }
      }
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Proprietário não encontrado' },
        { status: 404 }
      )
    }

    if (owner.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const asaasAccount = owner.bankAccounts.find(acc => acc.asaasWalletId)

    await prisma.$disconnect()

    return NextResponse.json({
      ownerId: owner.id,
      ownerName: owner.name,
      hasAsaasAccount: !!asaasAccount,
      walletId: asaasAccount?.asaasWalletId || null,
      validated: asaasAccount?.validated || false,
      validatedAt: asaasAccount?.validatedAt || null
    })
  } catch (error) {
    console.error('Erro ao verificar configuração ASAAS:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}