import { prisma } from '@/lib/db'

export interface FinancialSettings {
  penaltyRate: number        // % de multa por atraso
  dailyInterestRate: number  // % de juros ao dia
  gracePeriodDays: number    // dias de carência antes de aplicar multa
  maxInterestDays: number    // máximo de dias para calcular juros
}

export const DEFAULT_FINANCIAL_SETTINGS: FinancialSettings = {
  penaltyRate: 2.0,          // 2% de multa
  dailyInterestRate: 0.033,  // 0.033% ao dia (1% ao mês)
  gracePeriodDays: 0,        // sem carência
  maxInterestDays: 365       // máximo 1 ano de juros
}

/**
 * Busca as configurações financeiras do usuário no banco de dados
 * Se não existir, retorna as configurações padrão
 */
export async function getFinancialSettings(userId: string): Promise<FinancialSettings> {
  try {
    // Buscar a empresa do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    })

    if (!user?.companyId) {
      console.warn('❌ Usuário sem empresa, usando configurações padrão')
      return DEFAULT_FINANCIAL_SETTINGS
    }

    // Buscar configurações financeiras salvas
    const savedSettings = await prisma.settings.findFirst({
      where: {
        companyId: user.companyId,
        key: 'financial'
      }
    })

    if (!savedSettings) {
      console.log('⚠️ Configurações financeiras não encontradas, usando padrão')
      return DEFAULT_FINANCIAL_SETTINGS
    }

    // Parse das configurações salvas
    const financialSettings = JSON.parse(savedSettings.value)
    
    // Validar e retornar com fallback para valores padrão
    return {
      penaltyRate: isNaN(financialSettings.penaltyRate) ? DEFAULT_FINANCIAL_SETTINGS.penaltyRate : Number(financialSettings.penaltyRate),
      dailyInterestRate: isNaN(financialSettings.dailyInterestRate) ? DEFAULT_FINANCIAL_SETTINGS.dailyInterestRate : Number(financialSettings.dailyInterestRate),
      gracePeriodDays: isNaN(financialSettings.gracePeriodDays) ? DEFAULT_FINANCIAL_SETTINGS.gracePeriodDays : Number(financialSettings.gracePeriodDays),
      maxInterestDays: isNaN(financialSettings.maxInterestDays) ? DEFAULT_FINANCIAL_SETTINGS.maxInterestDays : Number(financialSettings.maxInterestDays)
    }

  } catch (error) {
    console.error('❌ Erro ao buscar configurações financeiras:', error)
    return DEFAULT_FINANCIAL_SETTINGS
  }
}

/**
 * Calcula multa e juros baseado nas configurações e data de vencimento
 */
export function calculateInterestAndPenalty(
  originalAmount: number, 
  dueDate: Date, 
  settings: FinancialSettings,
  includeInterest: boolean = true
) {
  const currentDate = new Date()
  const daysPastDue = Math.max(0, Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
  
  let finalAmount = originalAmount
  let penalty = 0
  let interest = 0
  
  if (daysPastDue > 0 && includeInterest) {
    // Aplicar período de carência
    const effectiveDays = Math.max(0, daysPastDue - settings.gracePeriodDays)
    
    if (effectiveDays > 0) {
      // Calcular multa e juros
      penalty = originalAmount * (settings.penaltyRate / 100)
      const daysForInterest = Math.min(effectiveDays, settings.maxInterestDays)
      interest = originalAmount * (settings.dailyInterestRate / 100) * daysForInterest
      finalAmount = originalAmount + penalty + interest
    }
  }

  return {
    originalAmount,
    penalty: Math.round(penalty * 100) / 100,
    interest: Math.round(interest * 100) / 100,
    finalAmount: Math.round(finalAmount * 100) / 100,
    daysPastDue,
    settings
  }
}