// Sistema de Relatórios e Análise de Conversão
// Gera insights avançados sobre performance de vendas e conversões

import { prisma } from './prisma'
import { differenceInDays, startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

interface ConversionMetrics {
  totalLeads: number
  convertedLeads: number
  conversionRate: number
  averageTimeToClose: number
  totalRevenue: number
  averageDealValue: number
  pipelineValue: number
  leadsPerSource: Record<string, number>
  conversionBySource: Record<string, number>
  conversionByAgent: Record<string, { leads: number; conversions: number; rate: number }>
  monthlyTrend: Array<{
    month: string
    leads: number
    conversions: number
    revenue: number
    rate: number
  }>
}

interface LeadFunnelAnalysis {
  stages: Array<{
    stage: string
    count: number
    percentage: number
    averageTime: number
    dropoffRate: number
  }>
  bottlenecks: Array<{
    stage: string
    issue: string
    impact: 'high' | 'medium' | 'low'
    recommendation: string
  }>
  opportunities: Array<{
    area: string
    potentialGain: number
    description: string
  }>
}

interface AgentPerformance {
  agentId: string
  agentName: string
  metrics: {
    totalLeads: number
    convertedLeads: number
    conversionRate: number
    averageTimeToClose: number
    totalRevenue: number
    averageDealValue: number
    activitiesPerLead: number
    responseTime: number
  }
  ranking: number
  trends: {
    lastMonth: number
    growthRate: number
    trend: 'up' | 'down' | 'stable'
  }
  strengths: string[]
  improvementAreas: string[]
}

interface ROIAnalysis {
  marketingChannels: Array<{
    channel: string
    cost: number
    leads: number
    conversions: number
    revenue: number
    roi: number
    costPerLead: number
    costPerAcquisition: number
  }>
  campaigns: Array<{
    campaign: string
    period: string
    investment: number
    return: number
    roi: number
    effectiveness: 'high' | 'medium' | 'low'
  }>
  recommendations: Array<{
    action: string
    expectedImpact: number
    priority: 'high' | 'medium' | 'low'
  }>
}

export class ConversionAnalytics {
  
  // === MÉTRICAS GERAIS DE CONVERSÃO ===
  
  async getConversionMetrics(companyId: string, period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<ConversionMetrics> {
    try {
      const dateFrom = this.getDateRange(period)
      
      // Buscar todos os leads do período
      const leads = await prisma.lead.findMany({
        where: {
          companyId,
          createdAt: { gte: dateFrom }
        },
        include: {
          activities: true,
          opportunities: true
        }
      })

      // Buscar oportunidades fechadas
      const closedOpportunities = await prisma.salesOpportunity.findMany({
        where: {
          companyId,
          status: 'WON',
          closedAt: { gte: dateFrom }
        },
        include: {
          lead: true
        }
      })

      // Calcular métricas básicas
      const totalLeads = leads.length
      const convertedLeads = closedOpportunities.length
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
      
      const totalRevenue = closedOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0)
      const averageDealValue = convertedLeads > 0 ? totalRevenue / convertedLeads : 0
      
      // Calcular tempo médio para fechamento
      const averageTimeToClose = this.calculateAverageTimeToClose(closedOpportunities)
      
      // Valor do pipeline (oportunidades ativas)
      const activeOpportunities = await prisma.salesOpportunity.findMany({
        where: {
          companyId,
          status: { in: ['QUALIFIED', 'PROPOSAL', 'NEGOTIATION'] }
        }
      })
      const pipelineValue = activeOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0)

      // Análise por fonte
      const leadsPerSource = this.groupByField(leads, 'source')
      const conversionBySource = this.calculateConversionBySource(leads, closedOpportunities)

      // Análise por agente
      const conversionByAgent = await this.getConversionByAgent(companyId, dateFrom)

      // Tendência mensal
      const monthlyTrend = await this.getMonthlyTrend(companyId, 6)

      return {
        totalLeads,
        convertedLeads,
        conversionRate,
        averageTimeToClose,
        totalRevenue,
        averageDealValue,
        pipelineValue,
        leadsPerSource,
        conversionBySource,
        conversionByAgent,
        monthlyTrend
      }
    } catch (error) {
      throw new Error(`Erro ao calcular métricas de conversão: ${error}`)
    }
  }

  // === ANÁLISE DO FUNIL DE VENDAS ===

  async getFunnelAnalysis(companyId: string): Promise<LeadFunnelAnalysis> {
    try {
      const leads = await prisma.lead.findMany({
        where: { companyId },
        include: { activities: true, opportunities: true }
      })

      // Definir estágios do funil
      const stages = [
        { name: 'Leads Gerados', filter: (l: any) => true },
        { name: 'Leads Qualificados', filter: (l: any) => l.activities.length >= 3 },
        { name: 'Proposta Enviada', filter: (l: any) => l.opportunities.some((o: any) => o.status !== 'NEW') },
        { name: 'Negociação', filter: (l: any) => l.opportunities.some((o: any) => ['PROPOSAL', 'NEGOTIATION'].includes(o.status)) },
        { name: 'Fechamento', filter: (l: any) => l.opportunities.some((o: any) => o.status === 'WON') }
      ]

      const funnelStages = stages.map((stage, index) => {
        const stageLeads = leads.filter(stage.filter)
        const count = stageLeads.length
        const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0
        
        // Calcular tempo médio no estágio
        const averageTime = this.calculateAverageStageTime(stageLeads, index)
        
        // Calcular taxa de abandono
        const nextStage = stages[index + 1]
        const dropoffRate = nextStage ? 
          ((count - leads.filter(nextStage.filter).length) / count) * 100 : 0

        return {
          stage: stage.name,
          count,
          percentage,
          averageTime,
          dropoffRate
        }
      })

      // Identificar gargalos
      const bottlenecks = this.identifyBottlenecks(funnelStages)

      // Identificar oportunidades
      const opportunities = this.identifyOpportunities(funnelStages, leads)

      return {
        stages: funnelStages,
        bottlenecks,
        opportunities
      }
    } catch (error) {
      throw new Error(`Erro na análise de funil: ${error}`)
    }
  }

  // === PERFORMANCE POR AGENTE ===

  async getAgentPerformance(companyId: string, period: 'month' | 'quarter' = 'month'): Promise<AgentPerformance[]> {
    try {
      const dateFrom = this.getDateRange(period)

      // Buscar todos os usuários da empresa
      const users = await prisma.user.findMany({
        where: { companyId }
      })

      const agentPerformances: AgentPerformance[] = []

      for (const user of users) {
        // Buscar leads atribuídos ao agente
        const agentLeads = await prisma.lead.findMany({
          where: {
            companyId,
            ownerId: user.id,
            createdAt: { gte: dateFrom }
          },
          include: {
            activities: true,
            opportunities: true
          }
        })

        // Calcular métricas do agente
        const totalLeads = agentLeads.length
        const convertedLeads = agentLeads.filter(lead => 
          lead.opportunities.some(opp => opp.status === 'WON')
        ).length
        
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
        
        const revenue = agentLeads.reduce((sum, lead) => 
          sum + lead.opportunities
            .filter(opp => opp.status === 'WON')
            .reduce((oppSum, opp) => oppSum + (opp.value || 0), 0), 0
        )
        
        const averageDealValue = convertedLeads > 0 ? revenue / convertedLeads : 0
        const activitiesPerLead = totalLeads > 0 ? 
          agentLeads.reduce((sum, lead) => sum + lead.activities.length, 0) / totalLeads : 0

        // Calcular tempo médio de fechamento
        const wonOpportunities = agentLeads.flatMap(lead => 
          lead.opportunities.filter(opp => opp.status === 'WON')
        )
        const averageTimeToClose = this.calculateAverageTimeToClose(wonOpportunities)

        // Calcular tempo de resposta (simulado)
        const responseTime = Math.round(2 + Math.random() * 8) // 2-10 horas

        // Buscar dados do mês anterior para tendência
        const lastMonthFrom = subMonths(dateFrom, 1)
        const lastMonthLeads = await prisma.lead.count({
          where: {
            companyId,
            ownerId: user.id,
            createdAt: { gte: lastMonthFrom, lt: dateFrom }
          }
        })

        const growthRate = lastMonthLeads > 0 ? 
          ((totalLeads - lastMonthLeads) / lastMonthLeads) * 100 : 0

        const trend = growthRate > 5 ? 'up' : growthRate < -5 ? 'down' : 'stable'

        // Análise de pontos fortes e melhorias
        const { strengths, improvementAreas } = this.analyzeAgentProfile({
          conversionRate,
          activitiesPerLead,
          responseTime,
          averageTimeToClose
        })

        agentPerformances.push({
          agentId: user.id,
          agentName: user.name || 'Usuário',
          metrics: {
            totalLeads,
            convertedLeads,
            conversionRate,
            averageTimeToClose,
            totalRevenue: revenue,
            averageDealValue,
            activitiesPerLead,
            responseTime
          },
          ranking: 0, // Será calculado depois
          trends: {
            lastMonth: lastMonthLeads,
            growthRate,
            trend
          },
          strengths,
          improvementAreas
        })
      }

      // Calcular ranking
      agentPerformances
        .sort((a, b) => b.metrics.conversionRate - a.metrics.conversionRate)
        .forEach((agent, index) => {
          agent.ranking = index + 1
        })

      return agentPerformances
    } catch (error) {
      throw new Error(`Erro na análise de performance: ${error}`)
    }
  }

  // === ANÁLISE DE ROI ===

  async getROIAnalysis(companyId: string): Promise<ROIAnalysis> {
    try {
      // Simular dados de canais de marketing
      const marketingChannels = [
        {
          channel: 'Google Ads',
          cost: 5000,
          leads: 150,
          conversions: 12,
          revenue: 240000,
          roi: 4700, // (240000 - 5000) / 5000 * 100
          costPerLead: 33.33,
          costPerAcquisition: 416.67
        },
        {
          channel: 'Facebook Ads',
          cost: 3000,
          leads: 80,
          conversions: 8,
          revenue: 160000,
          roi: 5233,
          costPerLead: 37.5,
          costPerAcquisition: 375
        },
        {
          channel: 'Portal Imobiliário',
          cost: 2000,
          leads: 200,
          conversions: 15,
          revenue: 300000,
          roi: 14900,
          costPerLead: 10,
          costPerAcquisition: 133.33
        },
        {
          channel: 'Indicações',
          cost: 0,
          leads: 50,
          conversions: 8,
          revenue: 160000,
          roi: Infinity,
          costPerLead: 0,
          costPerAcquisition: 0
        }
      ]

      // Simular campanhas
      const campaigns = [
        {
          campaign: 'Campanha Verão 2024',
          period: 'Jan-Mar 2024',
          investment: 8000,
          return: 320000,
          roi: 3900,
          effectiveness: 'high' as const
        },
        {
          campaign: 'Black Friday Imóveis',
          period: 'Nov 2023',
          investment: 12000,
          return: 480000,
          roi: 3900,
          effectiveness: 'high' as const
        },
        {
          campaign: 'Lançamento Residencial',
          period: 'Set 2023',
          investment: 15000,
          return: 600000,
          roi: 3900,
          effectiveness: 'medium' as const
        }
      ]

      // Gerar recomendações
      const recommendations = [
        {
          action: 'Aumentar investimento em Portal Imobiliário',
          expectedImpact: 25,
          priority: 'high' as const
        },
        {
          action: 'Implementar programa de indicações estruturado',
          expectedImpact: 15,
          priority: 'high' as const
        },
        {
          action: 'Otimizar campanhas do Google Ads',
          expectedImpact: 10,
          priority: 'medium' as const
        },
        {
          action: 'Testar novos canais (TikTok, LinkedIn)',
          expectedImpact: 8,
          priority: 'low' as const
        }
      ]

      return {
        marketingChannels,
        campaigns,
        recommendations
      }
    } catch (error) {
      throw new Error(`Erro na análise de ROI: ${error}`)
    }
  }

  // === RELATÓRIO EXECUTIVO ===

  async generateExecutiveReport(companyId: string): Promise<any> {
    try {
      const [metrics, funnelAnalysis, agentPerformance, roiAnalysis] = await Promise.all([
        this.getConversionMetrics(companyId),
        this.getFunnelAnalysis(companyId),
        this.getAgentPerformance(companyId),
        this.getROIAnalysis(companyId)
      ])

      // Insights principais
      const insights = {
        topInsights: [
          {
            metric: 'Taxa de Conversão',
            value: `${metrics.conversionRate.toFixed(1)}%`,
            trend: metrics.monthlyTrend.length > 1 ? 
              (metrics.monthlyTrend[metrics.monthlyTrend.length - 1].rate > 
               metrics.monthlyTrend[metrics.monthlyTrend.length - 2].rate ? 'up' : 'down') : 'stable',
            status: metrics.conversionRate > 15 ? 'good' : metrics.conversionRate > 10 ? 'warning' : 'critical'
          },
          {
            metric: 'Receita do Mês',
            value: `R$ ${metrics.totalRevenue.toLocaleString()}`,
            trend: 'up',
            status: 'good'
          },
          {
            metric: 'Pipeline Value',
            value: `R$ ${metrics.pipelineValue.toLocaleString()}`,
            trend: 'stable',
            status: 'good'
          }
        ],
        recommendations: [
          ...funnelAnalysis.opportunities.map(opp => ({
            area: 'Funil de Vendas',
            action: opp.description,
            impact: 'high'
          })),
          ...roiAnalysis.recommendations.slice(0, 2).map(rec => ({
            area: 'Marketing ROI',
            action: rec.action,
            impact: rec.priority
          }))
        ]
      }

      return {
        summary: {
          period: 'Último Mês',
          totalLeads: metrics.totalLeads,
          conversionRate: metrics.conversionRate,
          revenue: metrics.totalRevenue,
          pipelineValue: metrics.pipelineValue
        },
        insights,
        metrics,
        funnelAnalysis,
        agentPerformance: agentPerformance.slice(0, 5), // Top 5
        roiAnalysis,
        generatedAt: new Date()
      }
    } catch (error) {
      throw new Error(`Erro ao gerar relatório executivo: ${error}`)
    }
  }

  // === MÉTODOS AUXILIARES ===

  private getDateRange(period: 'week' | 'month' | 'quarter' | 'year'): Date {
    const now = new Date()
    switch (period) {
      case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month': return startOfMonth(now)
      case 'quarter': return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      case 'year': return new Date(now.getFullYear(), 0, 1)
      default: return startOfMonth(now)
    }
  }

  private calculateAverageTimeToClose(opportunities: any[]): number {
    if (opportunities.length === 0) return 0
    
    const times = opportunities
      .filter(opp => opp.closedAt && opp.createdAt)
      .map(opp => differenceInDays(opp.closedAt, opp.createdAt))
    
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0
  }

  private groupByField(items: any[], field: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item[field] || 'Não Informado'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  }

  private calculateConversionBySource(leads: any[], conversions: any[]): Record<string, number> {
    const conversionCounts = conversions.reduce((acc, conv) => {
      const source = conv.lead?.source || 'Não Informado'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {})

    const leadCounts = this.groupByField(leads, 'source')

    const result: Record<string, number> = {}
    Object.keys(leadCounts).forEach(source => {
      const converted = conversionCounts[source] || 0
      const total = leadCounts[source]
      result[source] = total > 0 ? (converted / total) * 100 : 0
    })

    return result
  }

  private async getConversionByAgent(companyId: string, dateFrom: Date): Promise<Record<string, any>> {
    const users = await prisma.user.findMany({
      where: { companyId }
    })

    const result: Record<string, any> = {}

    for (const user of users) {
      const leads = await prisma.lead.count({
        where: {
          companyId,
          ownerId: user.id,
          createdAt: { gte: dateFrom }
        }
      })

      const conversions = await prisma.salesOpportunity.count({
        where: {
          companyId,
          status: 'WON',
          lead: { ownerId: user.id },
          closedAt: { gte: dateFrom }
        }
      })

      result[user.name || 'Usuário'] = {
        leads,
        conversions,
        rate: leads > 0 ? (conversions / leads) * 100 : 0
      }
    }

    return result
  }

  private async getMonthlyTrend(companyId: string, months: number): Promise<any[]> {
    const trends = []
    
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i))
      const monthEnd = endOfMonth(monthStart)
      
      const leads = await prisma.lead.count({
        where: {
          companyId,
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      })

      const conversions = await prisma.salesOpportunity.count({
        where: {
          companyId,
          status: 'WON',
          closedAt: { gte: monthStart, lte: monthEnd }
        }
      })

      const revenue = await prisma.salesOpportunity.aggregate({
        where: {
          companyId,
          status: 'WON',
          closedAt: { gte: monthStart, lte: monthEnd }
        },
        _sum: { value: true }
      })

      trends.push({
        month: format(monthStart, 'MMM yyyy'),
        leads,
        conversions,
        revenue: revenue._sum.value || 0,
        rate: leads > 0 ? (conversions / leads) * 100 : 0
      })
    }

    return trends
  }

  private calculateAverageStageTime(leads: any[], stageIndex: number): number {
    // Simulação de tempo médio por estágio
    const baseTimes = [0, 2, 7, 14, 30] // dias
    return baseTimes[stageIndex] || 0
  }

  private identifyBottlenecks(stages: any[]): any[] {
    const bottlenecks = []
    
    stages.forEach((stage, index) => {
      if (stage.dropoffRate > 50) {
        bottlenecks.push({
          stage: stage.stage,
          issue: 'Alta taxa de abandono',
          impact: 'high' as const,
          recommendation: 'Revisar processo e qualificação neste estágio'
        })
      }
      
      if (stage.averageTime > 30) {
        bottlenecks.push({
          stage: stage.stage,
          issue: 'Tempo excessivo no estágio',
          impact: 'medium' as const,
          recommendation: 'Implementar automações para acelerar o processo'
        })
      }
    })

    return bottlenecks
  }

  private identifyOpportunities(stages: any[], leads: any[]): any[] {
    const opportunities = []

    // Analisar potencial de melhoria
    const conversionRate = stages[stages.length - 1]?.percentage || 0
    
    if (conversionRate < 10) {
      opportunities.push({
        area: 'Qualificação de Leads',
        potentialGain: 5,
        description: 'Melhorar qualificação pode aumentar conversão em 5%'
      })
    }

    if (stages[2]?.dropoffRate > 40) {
      opportunities.push({
        area: 'Follow-up Automático',
        potentialGain: 3,
        description: 'Implementar follow-up automatizado pode recuperar 3% dos leads'
      })
    }

    return opportunities
  }

  private analyzeAgentProfile(metrics: any): { strengths: string[]; improvementAreas: string[] } {
    const strengths = []
    const improvementAreas = []

    if (metrics.conversionRate > 15) strengths.push('Alta taxa de conversão')
    if (metrics.activitiesPerLead > 5) strengths.push('Muito engajado com leads')
    if (metrics.responseTime < 4) strengths.push('Resposta rápida')
    if (metrics.averageTimeToClose < 20) strengths.push('Fechamento eficiente')

    if (metrics.conversionRate < 10) improvementAreas.push('Melhorar técnicas de fechamento')
    if (metrics.activitiesPerLead < 3) improvementAreas.push('Aumentar follow-up com leads')
    if (metrics.responseTime > 8) improvementAreas.push('Reduzir tempo de resposta')
    if (metrics.averageTimeToClose > 45) improvementAreas.push('Acelerar processo de vendas')

    return { strengths, improvementAreas }
  }

  // === EXPORT DE RELATÓRIOS ===

  async exportToCSV(data: any, type: string): Promise<string> {
    // Implementação de export para CSV seria aqui
    console.log(`📊 Exportando relatório ${type} para CSV`)
    return `/reports/${type}_${Date.now()}.csv`
  }

  async exportToPDF(data: any, type: string): Promise<string> {
    // Implementação de export para PDF seria aqui
    console.log(`📊 Exportando relatório ${type} para PDF`)
    return `/reports/${type}_${Date.now()}.pdf`
  }
}

export const conversionAnalytics = new ConversionAnalytics()