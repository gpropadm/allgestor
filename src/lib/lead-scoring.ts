// Sistema de Lead Scoring Inteligente
// Calcula scores automaticamente baseado em comportamento e dados

import { prisma } from './prisma'
import { subDays, differenceInDays, differenceInHours } from 'date-fns'

interface ScoringFactors {
  budgetScore: number
  urgencyScore: number
  engagementScore: number
  fitScore: number
  behaviorScore: number
}

interface LeadScoringResult {
  leadId: string
  totalScore: number
  grade: 'A' | 'B' | 'C' | 'D'
  factors: ScoringFactors
  recommendations: string[]
  priority: 'ALTA' | 'MÉDIA' | 'BAIXA'
}

export class LeadScoringEngine {
  
  // === CÁLCULO DE SCORE PRINCIPAL ===
  
  async calculateLeadScore(leadId: string): Promise<LeadScoringResult> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      })
      
      if (!lead) {
        throw new Error('Lead não encontrado')
      }
      
      // Buscar atividades do lead
      const activities = await prisma.leadActivity.findMany({
        where: { leadId },
        orderBy: { createdAt: 'desc' }
      })
      
      // Calcular fatores de score
      const factors: ScoringFactors = {
        budgetScore: this.calculateBudgetScore(lead),
        urgencyScore: this.calculateUrgencyScore(lead, activities),
        engagementScore: this.calculateEngagementScore(activities),
        fitScore: this.calculateFitScore(lead),
        behaviorScore: this.calculateBehaviorScore(activities)
      }
      
      // Score total (média ponderada)
      const totalScore = Math.round(
        factors.budgetScore * 0.25 +
        factors.urgencyScore * 0.30 +
        factors.engagementScore * 0.20 +
        factors.fitScore * 0.15 +
        factors.behaviorScore * 0.10
      )
      
      // Determinar grade e prioridade
      const grade = this.determineGrade(totalScore)
      const priority = this.determinePriority(totalScore)
      const recommendations = this.generateRecommendations(factors, lead)
      
      // Salvar score no banco
      await this.saveLeadScore(leadId, totalScore, factors)
      
      return {
        leadId,
        totalScore,
        grade,
        factors,
        recommendations,
        priority
      }
    } catch (error) {
      throw new Error(`Erro ao calcular score: ${error}`)
    }
  }
  
  // === FATORES DE SCORING ===
  
  private calculateBudgetScore(lead: any): number {
    if (!lead.maxPrice) return 20 // Sem orçamento definido = score baixo
    
    // Faixas de orçamento (scores mais altos para orçamentos maiores)
    if (lead.maxPrice >= 1000000) return 100 // R$ 1M+ = score máximo
    if (lead.maxPrice >= 500000) return 85   // R$ 500K+ = score alto
    if (lead.maxPrice >= 300000) return 70   // R$ 300K+ = score bom
    if (lead.maxPrice >= 150000) return 55   // R$ 150K+ = score médio
    
    return 35 // Abaixo de R$ 150K = score baixo
  }
  
  private calculateUrgencyScore(lead: any, activities: any[]): number {
    const now = new Date()
    const leadAge = differenceInDays(now, lead.createdAt)
    
    let urgencyScore = 50 // Base
    
    // Lead mais antigo = maior urgência
    if (leadAge >= 30) urgencyScore += 30
    else if (leadAge >= 14) urgencyScore += 20
    else if (leadAge >= 7) urgencyScore += 10
    
    // Atividade recente = maior urgência
    const recentActivities = activities.filter(a => 
      differenceInHours(now, a.createdAt) <= 48
    )
    
    urgencyScore += recentActivities.length * 5
    
    // Status do lead
    if (lead.status === 'ACTIVE') urgencyScore += 20
    
    return Math.min(urgencyScore, 100)
  }
  
  private calculateEngagementScore(activities: any[]): number {
    if (activities.length === 0) return 10
    
    let engagementScore = 0
    const now = new Date()
    
    // Pontuação por tipo de atividade
    const activityPoints = {
      'email_opened': 5,
      'email_clicked': 10,
      'whatsapp_replied': 15,
      'property_viewed': 20,
      'document_downloaded': 15,
      'financing_simulation': 25,
      'visit_scheduled': 30,
      'visit_completed': 35,
      'proposal_requested': 40
    }
    
    activities.forEach(activity => {
      const points = activityPoints[activity.activityType as keyof typeof activityPoints] || 0
      
      // Atividades recentes valem mais
      const daysSince = differenceInDays(now, activity.createdAt)
      const recencyMultiplier = daysSince <= 7 ? 1.5 : daysSince <= 30 ? 1.0 : 0.5
      
      engagementScore += points * recencyMultiplier
    })
    
    return Math.min(engagementScore, 100)
  }
  
  private calculateFitScore(lead: any): number {
    let fitScore = 50 // Base
    
    // Critérios bem definidos = maior fit
    if (lead.minBedrooms && lead.maxBedrooms) fitScore += 15
    if (lead.preferredCities && JSON.parse(lead.preferredCities || '[]').length > 0) fitScore += 15
    if (lead.preferredStates && JSON.parse(lead.preferredStates || '[]').length > 0) fitScore += 10
    if (lead.propertyType) fitScore += 10
    if (lead.maxPrice && lead.minPrice) fitScore += 10
    
    return Math.min(fitScore, 100)
  }
  
  private calculateBehaviorScore(activities: any[]): number {
    if (activities.length === 0) return 30
    
    let behaviorScore = 50
    
    // Frequência de atividades
    const last7Days = activities.filter(a => 
      differenceInDays(new Date(), a.createdAt) <= 7
    ).length
    
    const last30Days = activities.filter(a => 
      differenceInDays(new Date(), a.createdAt) <= 30
    ).length
    
    // Lead muito ativo = score alto
    if (last7Days >= 5) behaviorScore += 30
    else if (last7Days >= 3) behaviorScore += 20
    else if (last7Days >= 1) behaviorScore += 10
    
    if (last30Days >= 10) behaviorScore += 20
    else if (last30Days >= 5) behaviorScore += 10
    
    return Math.min(behaviorScore, 100)
  }
  
  // === CLASSIFICAÇÃO ===
  
  private determineGrade(score: number): 'A' | 'B' | 'C' | 'D' {
    if (score >= 80) return 'A'
    if (score >= 60) return 'B'
    if (score >= 40) return 'C'
    return 'D'
  }
  
  private determinePriority(score: number): 'ALTA' | 'MÉDIA' | 'BAIXA' {
    if (score >= 70) return 'ALTA'
    if (score >= 45) return 'MÉDIA'
    return 'BAIXA'
  }
  
  // === RECOMENDAÇÕES ===
  
  private generateRecommendations(factors: ScoringFactors, lead: any): string[] {
    const recommendations: string[] = []
    
    if (factors.budgetScore >= 80) {
      recommendations.push('💰 Lead com alto poder de compra - priorizar atendimento VIP')
    }
    
    if (factors.urgencyScore >= 70) {
      recommendations.push('⚡ Lead urgente - contatar nas próximas 2 horas')
    }
    
    if (factors.engagementScore >= 60) {
      recommendations.push('🔥 Lead muito engajado - agendar visita presencial')
    } else if (factors.engagementScore < 30) {
      recommendations.push('📢 Lead pouco engajado - intensificar follow-up')
    }
    
    if (factors.fitScore < 40) {
      recommendations.push('🎯 Refinar critérios do lead - perguntas de qualificação')
    }
    
    if (factors.behaviorScore >= 70) {
      recommendations.push('🚀 Comportamento ativo - lead pronto para proposta')
    }
    
    // Recomendações específicas baseadas no lead
    if (!lead.phone) {
      recommendations.push('📞 Obter telefone para contato direto')
    }
    
    if (!lead.maxPrice) {
      recommendations.push('💸 Definir orçamento para melhor direcionamento')
    }
    
    return recommendations
  }
  
  // === PERSISTÊNCIA ===
  
  private async saveLeadScore(leadId: string, score: number, factors: ScoringFactors) {
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 7) // Score válido por 7 dias
    
    await prisma.leadScore.create({
      data: {
        leadId,
        scoreValue: score,
        factors: JSON.stringify(factors),
        validUntil
      }
    })
  }
  
  // === ATIVIDADES DE LEAD ===
  
  async trackActivity(leadId: string, activityType: string, activityData?: any) {
    try {
      // Pontuação por atividade
      const scoreImpacts = {
        'email_opened': 2,
        'email_clicked': 5,
        'whatsapp_replied': 8,
        'property_viewed': 10,
        'document_downloaded': 7,
        'financing_simulation': 15,
        'visit_scheduled': 20,
        'visit_completed': 25,
        'proposal_requested': 30
      }
      
      const scoreImpact = scoreImpacts[activityType as keyof typeof scoreImpacts] || 0
      
      await prisma.leadActivity.create({
        data: {
          leadId,
          activityType,
          activityData: activityData ? JSON.stringify(activityData) : null,
          scoreImpact
        }
      })
      
      // Recalcular score automaticamente se atividade importante
      if (scoreImpact >= 10) {
        await this.calculateLeadScore(leadId)
      }
      
      return { success: true }
    } catch (error) {
      return { success: false, error: `Erro ao registrar atividade: ${error}` }
    }
  }
  
  // === BATCH SCORING ===
  
  async scoreMulfipleLeads(companyId: string, limit = 50) {
    try {
      // Buscar leads ativos sem score recente
      const leads = await prisma.lead.findMany({
        where: {
          companyId,
          status: 'ACTIVE'
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
      
      const results = []
      for (const lead of leads) {
        try {
          const score = await this.calculateLeadScore(lead.id)
          results.push(score)
        } catch (error) {
          console.error(`Erro ao calcular score do lead ${lead.id}:`, error)
        }
      }
      
      return { success: true, data: results }
    } catch (error) {
      return { success: false, error: `Erro no batch scoring: ${error}` }
    }
  }
  
  // === RELATÓRIOS ===
  
  async getLeadScoreDistribution(companyId: string) {
    try {
      const scores = await prisma.leadScore.findMany({
        where: {
          validUntil: { gte: new Date() }, // Scores válidos
          // Filtrar por company através do lead
        },
        orderBy: { calculatedAt: 'desc' }
      })
      
      const distribution = {
        A: scores.filter(s => s.scoreValue >= 80).length,
        B: scores.filter(s => s.scoreValue >= 60 && s.scoreValue < 80).length,
        C: scores.filter(s => s.scoreValue >= 40 && s.scoreValue < 60).length,
        D: scores.filter(s => s.scoreValue < 40).length
      }
      
      const averageScore = scores.reduce((sum, s) => sum + s.scoreValue, 0) / scores.length
      
      return {
        success: true,
        data: {
          total: scores.length,
          distribution,
          averageScore: Math.round(averageScore),
          highPriority: distribution.A + distribution.B
        }
      }
    } catch (error) {
      return { success: false, error: `Erro ao gerar relatório: ${error}` }
    }
  }
  
  // === TOP LEADS ===
  
  async getTopLeads(companyId: string, limit = 10) {
    try {
      const topScores = await prisma.leadScore.findMany({
        where: {
          validUntil: { gte: new Date() }
        },
        orderBy: { scoreValue: 'desc' },
        take: limit,
        include: {
          // Incluir dados do lead seria ideal aqui
        }
      })
      
      return { success: true, data: topScores }
    } catch (error) {
      return { success: false, error: `Erro ao buscar top leads: ${error}` }
    }
  }
}

export const leadScoringEngine = new LeadScoringEngine()