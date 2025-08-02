import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🏦 Consultando saldo Asaas...')
    
    const user = await requireAuth(request)
    console.log('👤 Usuário autenticado:', user.email)

    // Buscar configurações Asaas da empresa do usuário
    const userWithCompany = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            asaasApiKey: true,
            asaasEnabled: true
          }
        }
      }
    })

    if (!userWithCompany?.company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const company = userWithCompany.company

    if (!company.asaasEnabled || !company.asaasApiKey) {
      return NextResponse.json({ 
        error: 'Integração Asaas não configurada',
        balance: 0,
        available: 0 
      }, { status: 200 })
    }

    console.log('🔑 Empresa:', company.name, '- Asaas habilitado:', company.asaasEnabled)

    // Consultar saldo na API do Asaas
    const asaasResponse = await fetch('https://www.asaas.com/api/v3/finance/balance', {
      method: 'GET',
      headers: {
        'access_token': company.asaasApiKey,
        'Content-Type': 'application/json'
      }
    })

    if (!asaasResponse.ok) {
      console.error('❌ Erro na API Asaas:', asaasResponse.status)
      const errorText = await asaasResponse.text()
      console.error('Resposta:', errorText)
      
      return NextResponse.json({ 
        error: 'Erro ao consultar saldo Asaas',
        balance: 0,
        available: 0 
      }, { status: 500 })
    }

    const balanceData = await asaasResponse.json()
    console.log('💰 Saldo Asaas recebido:', balanceData)

    // Calcular receitas esperadas (comissões) do mês atual
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    const paidPayments = await prisma.payment.findMany({
      where: {
        status: 'PAID',
        contract: {
          userId: user.id,
          status: 'ACTIVE'
        },
        paidDate: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1)
        }
      },
      select: {
        amount: true,
        contract: {
          select: {
            administrationFeePercentage: true
          }
        }
      }
    })

    const expectedCommissions = paidPayments.reduce((total, payment) => {
      const commission = (payment.amount * payment.contract.administrationFeePercentage) / 100
      return total + commission
    }, 0)

    console.log('💼 Comissões esperadas do mês:', expectedCommissions)

    return NextResponse.json({
      balance: balanceData.balance || 0,
      available: balanceData.available || 0,
      blocked: balanceData.blocked || 0,
      pendingTransfer: balanceData.pendingTransfer || 0,
      expectedCommissions: expectedCommissions,
      companyName: company.name,
      asaasEnabled: company.asaasEnabled,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro ao consultar saldo Asaas:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      balance: 0,
      available: 0
    }, { status: 500 })
  }
}