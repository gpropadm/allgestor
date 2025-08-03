import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const propertyId = searchParams.get('propertyId')

    if (leadId) {
      const simulations = await prisma.financingSimulation.findMany({
        where: { leadId },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ success: true, simulations })
    }

    if (propertyId) {
      const simulations = await prisma.financingSimulation.findMany({
        where: { propertyId },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ success: true, simulations })
    }

    return NextResponse.json({ error: 'leadId ou propertyId obrigatório' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao buscar simulações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { action, ...data } = await request.json()

    switch (action) {
      case 'save':
        return await saveSimulation(data)
      
      case 'calculate':
        return await calculateSimulation(data)
      
      case 'compare':
        return await compareBank(data)
      
      case 'approve':
        return await approveFinancing(data)
      
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro na API financial-simulator:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

async function saveSimulation(data: any) {
  try {
    const { leadId, propertyId, simulation } = data

    // Verificar se o lead existe
    if (leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      })

      if (!lead) {
        return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
      }
    }

    // Criar a simulação
    const savedSimulation = await prisma.financingSimulation.create({
      data: {
        leadId,
        propertyId,
        propertyValue: simulation.propertyValue,
        downPayment: simulation.downPayment,
        loanAmount: simulation.loanAmount,
        interestRate: simulation.interestRate,
        loanTermMonths: simulation.loanTermMonths,
        monthlyPayment: simulation.monthlyPayment,
        totalInterest: simulation.totalInterest,
        bankName: simulation.bankName
      }
    })

    return NextResponse.json({ success: true, data: savedSimulation })
  } catch (error) {
    console.error('Erro ao salvar simulação:', error)
    return NextResponse.json({ error: 'Erro ao salvar simulação' }, { status: 500 })
  }
}

async function calculateSimulation(data: any) {
  try {
    const { propertyValue, downPaymentPercent, loanTermYears, interestRate } = data

    const downPayment = (propertyValue * downPaymentPercent) / 100
    const loanAmount = propertyValue - downPayment
    const monthlyRate = interestRate / 100 / 12
    const loanTermMonths = loanTermYears * 12

    // Fórmula Price
    const monthlyPayment = loanAmount * (
      (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) /
      (Math.pow(1 + monthlyRate, loanTermMonths) - 1)
    )

    const totalAmount = monthlyPayment * loanTermMonths
    const totalInterest = totalAmount - loanAmount

    const simulation = {
      propertyValue,
      downPayment,
      loanAmount,
      interestRate,
      loanTermMonths,
      monthlyPayment,
      totalInterest,
      totalAmount
    }

    return NextResponse.json({ success: true, data: simulation })
  } catch (error) {
    console.error('Erro no cálculo:', error)
    return NextResponse.json({ error: 'Erro no cálculo' }, { status: 500 })
  }
}

async function compareBank(data: any) {
  try {
    const { propertyValue, downPaymentPercent, loanTermYears } = data

    const banks = [
      { name: 'Caixa Econômica Federal', interestRate: 10.75, fees: 25 },
      { name: 'Banco do Brasil', interestRate: 11.25, fees: 30 },
      { name: 'Santander', interestRate: 11.85, fees: 35 },
      { name: 'Itaú', interestRate: 12.15, fees: 40 },
      { name: 'Bradesco', interestRate: 12.45, fees: 35 }
    ]

    const comparisons = banks.map(bank => {
      const downPayment = (propertyValue * downPaymentPercent) / 100
      const loanAmount = propertyValue - downPayment
      const monthlyRate = bank.interestRate / 100 / 12
      const loanTermMonths = loanTermYears * 12

      const monthlyPayment = loanAmount * (
        (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) /
        (Math.pow(1 + monthlyRate, loanTermMonths) - 1)
      )

      const totalAmount = monthlyPayment * loanTermMonths
      const totalInterest = totalAmount - loanAmount

      return {
        bank: bank.name,
        interestRate: bank.interestRate,
        fees: bank.fees,
        monthlyPayment,
        totalInterest,
        totalAmount,
        totalWithFees: totalAmount + bank.fees
      }
    })

    // Ordenar por melhor opção (menor custo total)
    comparisons.sort((a, b) => a.totalWithFees - b.totalWithFees)

    return NextResponse.json({ success: true, data: comparisons })
  } catch (error) {
    console.error('Erro na comparação:', error)
    return NextResponse.json({ error: 'Erro na comparação' }, { status: 500 })
  }
}

async function approveFinancing(data: any) {
  try {
    const { simulationId, approved, bankResponse } = data

    const updatedSimulation = await prisma.financingSimulation.update({
      where: { id: simulationId },
      data: {
        approved,
        approvalDate: approved ? new Date() : null,
        // Aqui você poderia adicionar mais campos como resposta do banco
      }
    })

    // Se aprovado, criar atividade no lead
    if (approved && updatedSimulation.leadId) {
      // Registrar atividade de financiamento aprovado
      console.log(`Financiamento aprovado para lead ${updatedSimulation.leadId}`)
      
      // Aqui você poderia integrar com o sistema de lead scoring
      // para aumentar o score do lead
    }

    return NextResponse.json({ success: true, data: updatedSimulation })
  } catch (error) {
    console.error('Erro ao atualizar aprovação:', error)
    return NextResponse.json({ error: 'Erro ao atualizar aprovação' }, { status: 500 })
  }
}

// Simulação de integração com APIs bancárias
export async function simulateBankAPI(bankName: string, simulation: any) {
  // Esta função simularia a integração com APIs reais dos bancos
  // para obter cotações em tempo real
  
  const bankAPIs = {
    'Caixa Econômica Federal': {
      endpoint: 'https://api.caixa.gov.br/simulacao',
      rate: 10.75,
      available: true
    },
    'Banco do Brasil': {
      endpoint: 'https://api.bb.com.br/simulacao',
      rate: 11.25,
      available: true
    },
    'Santander': {
      endpoint: 'https://api.santander.com.br/simulacao',
      rate: 11.85,
      available: false // Simulando indisponibilidade
    }
  }

  const bankConfig = bankAPIs[bankName as keyof typeof bankAPIs]
  
  if (!bankConfig) {
    throw new Error('Banco não suportado')
  }

  if (!bankConfig.available) {
    throw new Error('API do banco temporariamente indisponível')
  }

  // Simular resposta da API do banco
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        bank: bankName,
        interestRate: bankConfig.rate,
        approved: simulation.loanAmount <= 800000, // Simulação de aprovação
        maxAmount: 1000000,
        conditions: 'Renda comprovada, sem restrições no SPC/Serasa'
      })
    }, 1000) // Simular delay da API
  })
}

// Função para calcular capacidade de pagamento
export function calculatePaymentCapacity(monthlyIncome: number, monthlyExpenses: number) {
  const availableIncome = monthlyIncome - monthlyExpenses
  const maxPayment = availableIncome * 0.3 // 30% da renda disponível
  
  return {
    availableIncome,
    maxRecommendedPayment: maxPayment,
    maxPropertyValue: maxPayment * 420 * 0.8 // Estimativa baseada em 35 anos, 80% financiado
  }
}

// Função para análise de risco
export function analyzeRisk(leadData: any, simulation: any) {
  let riskScore = 0
  const factors = []

  // Análise da relação parcela/renda
  if (leadData.monthlyIncome) {
    const paymentToIncomeRatio = simulation.monthlyPayment / leadData.monthlyIncome
    
    if (paymentToIncomeRatio > 0.35) {
      riskScore += 30
      factors.push('Parcela alta em relação à renda')
    } else if (paymentToIncomeRatio < 0.20) {
      riskScore -= 10
      factors.push('Parcela confortável em relação à renda')
    }
  }

  // Análise do valor de entrada
  const downPaymentRatio = simulation.downPayment / simulation.propertyValue
  if (downPaymentRatio < 0.20) {
    riskScore += 20
    factors.push('Entrada baixa (< 20%)')
  } else if (downPaymentRatio > 0.30) {
    riskScore -= 15
    factors.push('Entrada alta (> 30%)')
  }

  // Análise do prazo
  if (simulation.loanTermMonths > 360) {
    riskScore += 10
    factors.push('Prazo longo (> 30 anos)')
  }

  // Classificação do risco
  let riskLevel = 'BAIXO'
  if (riskScore > 30) riskLevel = 'ALTO'
  else if (riskScore > 15) riskLevel = 'MÉDIO'

  return {
    riskScore,
    riskLevel,
    factors,
    recommendation: riskLevel === 'ALTO' ? 
      'Revisar condições - considerar entrada maior ou prazo menor' :
      riskLevel === 'MÉDIO' ?
      'Condições aceitáveis - acompanhar de perto' :
      'Excelentes condições para aprovação'
  }
}