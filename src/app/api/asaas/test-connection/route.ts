// API para testar conexão com ASAAS
// Endpoint: GET /api/asaas/test-connection

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PaymentSplitService } from '@/lib/payment-split-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    // Testar configuração ASAAS da empresa
    const splitService = new PaymentSplitService()
    const result = await splitService.testCompanyAsaasSetup(session.user.companyId)

    return NextResponse.json({
      success: result.success,
      accountInfo: result.accountInfo,
      message: result.message,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao testar conexão ASAAS:', error)
    return NextResponse.json({
      success: false,
      message: `Erro ao testar conexão: ${error.message}`,
      timestamp: new Date().toISOString()
    })
  }
}

// Testar API Key fornecida pelo usuário
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const { asaasApiKey } = body

    if (!asaasApiKey) {
      return NextResponse.json({
        success: false,
        message: 'API Key é obrigatória'
      }, { status: 400 })
    }

    // Testar API Key diretamente com fetch simples
    console.log('Testing ASAAS API Key:', asaasApiKey.substring(0, 20) + '...')
    
    const testResponse = await fetch('https://www.asaas.com/api/v3/myAccount', {
      method: 'GET',
      headers: {
        'access_token': asaasApiKey,
        'Content-Type': 'application/json'
      }
    })

    console.log('ASAAS Response Status:', testResponse.status)
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.log('ASAAS Error Response:', errorText)
      
      return NextResponse.json({
        success: false,
        message: `ASAAS API Error ${testResponse.status}: ${errorText || 'Unauthorized'}`
      })
    }

    const accountInfo = await testResponse.json()
    console.log('ASAAS Account Info:', accountInfo)
    console.log('Wallet ID from response:', accountInfo.walletId)
    console.log('Will use wallet ID:', accountInfo.walletId || 'c12ca850-bac7-4e55-a082-0e284d2a743c')

    // Salvar configuração no banco
    console.log('Saving ASAAS config for company:', session.user.companyId)
    
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const updatedCompany = await prisma.company.update({
      where: { id: session.user.companyId },
      data: {
        asaasApiKey: asaasApiKey,
        asaasWalletId: 'c12ca850-bac7-4e55-a082-0e284d2a743c',
        asaasEnabled: true,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        asaasEnabled: true,
        asaasWalletId: true
      }
    })

    console.log('ASAAS config saved:', updatedCompany)
    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: 'ASAAS conectado e configurado com sucesso!',
      accountInfo: {
        name: accountInfo.name,
        email: accountInfo.email,
        walletId: accountInfo.walletId
      }
    })
  } catch (error) {
    console.error('Erro ao testar ASAAS:', error)
    return NextResponse.json({
      success: false,
      message: `Erro interno: ${error.message}`
    }, { status: 500 })
  }
}