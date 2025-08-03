import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { conversionAnalytics } from '@/lib/conversion-analytics'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const period = searchParams.get('period') as 'week' | 'month' | 'quarter' | 'year'
    const export_format = searchParams.get('export')

    switch (type) {
      case 'conversion':
        return await getConversionMetrics(session.user.companyId, period)
      
      case 'funnel':
        return await getFunnelAnalysis(session.user.companyId)
      
      case 'agents':
        return await getAgentPerformance(session.user.companyId, period as 'month' | 'quarter')
      
      case 'roi':
        return await getROIAnalysis(session.user.companyId)
      
      case 'executive':
        return await getExecutiveReport(session.user.companyId, export_format)
      
      case 'dashboard':
        return await getDashboardData(session.user.companyId)
      
      default:
        return NextResponse.json({ error: 'Tipo de análise inválido' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro na API analytics:', error)
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
      case 'save_metric':
        return await saveCustomMetric(data, session.user.companyId)
      
      case 'create_report':
        return await createCustomReport(data, session.user.companyId)
      
      case 'schedule_report':
        return await scheduleReport(data, session.user.companyId)
      
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro na API analytics POST:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// === IMPLEMENTAÇÕES ===

async function getConversionMetrics(companyId: string, period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  try {
    const metrics = await conversionAnalytics.getConversionMetrics(companyId, period)
    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro nas métricas: ${error}` }, { status: 500 })
  }
}

async function getFunnelAnalysis(companyId: string) {
  try {
    const analysis = await conversionAnalytics.getFunnelAnalysis(companyId)
    return NextResponse.json({ success: true, data: analysis })
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro na análise do funil: ${error}` }, { status: 500 })
  }
}

async function getAgentPerformance(companyId: string, period: 'month' | 'quarter' = 'month') {
  try {
    const performance = await conversionAnalytics.getAgentPerformance(companyId, period)
    return NextResponse.json({ success: true, data: performance })
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro na performance: ${error}` }, { status: 500 })
  }
}

async function getROIAnalysis(companyId: string) {
  try {
    const analysis = await conversionAnalytics.getROIAnalysis(companyId)
    return NextResponse.json({ success: true, data: analysis })
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro na análise de ROI: ${error}` }, { status: 500 })
  }
}

async function getExecutiveReport(companyId: string, exportFormat?: string | null) {
  try {
    const report = await conversionAnalytics.generateExecutiveReport(companyId)
    
    if (exportFormat) {
      let exportUrl = ''
      if (exportFormat === 'pdf') {
        exportUrl = await conversionAnalytics.exportToPDF(report, 'executive_report')
      } else if (exportFormat === 'csv') {
        exportUrl = await conversionAnalytics.exportToCSV(report, 'executive_report')
      }
      
      return NextResponse.json({ 
        success: true, 
        data: report, 
        exportUrl 
      })
    }
    
    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro no relatório executivo: ${error}` }, { status: 500 })
  }
}

async function getDashboardData(companyId: string) {
  try {
    // Combinar várias métricas para o dashboard
    const [conversionMetrics, funnelAnalysis, agentPerformance] = await Promise.all([
      conversionAnalytics.getConversionMetrics(companyId, 'month'),
      conversionAnalytics.getFunnelAnalysis(companyId),
      conversionAnalytics.getAgentPerformance(companyId, 'month')
    ])

    // Calcular KPIs principais
    const kpis = {
      totalLeads: conversionMetrics.totalLeads,
      conversionRate: conversionMetrics.conversionRate,
      revenue: conversionMetrics.totalRevenue,
      pipelineValue: conversionMetrics.pipelineValue,
      avgDealValue: conversionMetrics.averageDealValue,
      avgTimeToClose: conversionMetrics.averageTimeToClose
    }

    // Top performers
    const topAgents = agentPerformance
      .sort((a, b) => b.metrics.conversionRate - a.metrics.conversionRate)
      .slice(0, 3)

    // Alertas e notificações
    const alerts = generateAlerts(conversionMetrics, funnelAnalysis, agentPerformance)

    const dashboardData = {
      kpis,
      conversionTrend: conversionMetrics.monthlyTrend,
      funnelStages: funnelAnalysis.stages,
      topAgents,
      leadsPerSource: conversionMetrics.leadsPerSource,
      conversionBySource: conversionMetrics.conversionBySource,
      alerts,
      lastUpdated: new Date()
    }

    return NextResponse.json({ success: true, data: dashboardData })
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro no dashboard: ${error}` }, { status: 500 })
  }
}

async function saveCustomMetric(data: any, companyId: string) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    const metric = await prisma.conversionMetric.create({
      data: {
        companyId,
        metricName: data.name,
        metricValue: data.value,
        metricType: data.type,
        period: data.period,
        metadata: JSON.stringify(data.metadata || {})
      }
    })

    return NextResponse.json({ success: true, data: metric })
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro ao salvar métrica: ${error}` }, { status: 500 })
  }
}

async function createCustomReport(data: any, companyId: string) {
  try {
    // Implementar criação de relatórios customizados
    const report = {
      id: `report_${Date.now()}`,
      name: data.name,
      type: data.type,
      filters: data.filters,
      generatedAt: new Date(),
      url: `/reports/custom_${Date.now()}.pdf`
    }

    console.log('📊 Criando relatório customizado:', report.name)

    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro ao criar relatório: ${error}` }, { status: 500 })
  }
}

async function scheduleReport(data: any, companyId: string) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    // Salvar agendamento de relatório
    const schedule = await prisma.reportSchedule.create({
      data: {
        companyId,
        reportType: data.reportType,
        frequency: data.frequency, // daily, weekly, monthly
        recipients: JSON.stringify(data.recipients),
        nextRunAt: new Date(data.nextRunDate),
        isActive: true
      }
    })

    return NextResponse.json({ success: true, data: schedule })
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro ao agendar relatório: ${error}` }, { status: 500 })
  }
}

function generateAlerts(conversionMetrics: any, funnelAnalysis: any, agentPerformance: any[]) {
  const alerts = []

  // Alert de conversão baixa
  if (conversionMetrics.conversionRate < 10) {
    alerts.push({
      type: 'warning',
      title: 'Taxa de Conversão Baixa',
      message: `Taxa atual: ${conversionMetrics.conversionRate.toFixed(1)}%. Recomenda-se revisar processo de qualificação.`,
      action: 'review_qualification'
    })
  }

  // Alert de gargalos no funil
  const highDropoffStages = funnelAnalysis.stages.filter((stage: any) => stage.dropoffRate > 50)
  if (highDropoffStages.length > 0) {
    alerts.push({
      type: 'error',
      title: 'Gargalos no Funil',
      message: `Estágio "${highDropoffStages[0].stage}" com ${highDropoffStages[0].dropoffRate.toFixed(1)}% de abandono.`,
      action: 'optimize_funnel'
    })
  }

  // Alert de agentes com baixa performance
  const lowPerformingAgents = agentPerformance.filter(agent => agent.metrics.conversionRate < 5)
  if (lowPerformingAgents.length > 0) {
    alerts.push({
      type: 'info',
      title: 'Treinamento Necessário',
      message: `${lowPerformingAgents.length} agente(s) com conversão abaixo de 5%. Considere treinamento adicional.`,
      action: 'schedule_training'
    })
  }

  // Alert de pipeline baixo
  if (conversionMetrics.pipelineValue < conversionMetrics.totalRevenue * 2) {
    alerts.push({
      type: 'warning',
      title: 'Pipeline Baixo',
      message: 'Valor do pipeline está baixo. Recomenda-se intensificar prospecção.',
      action: 'increase_prospecting'
    })
  }

  return alerts
}

// === MÉTRICAS EM TEMPO REAL ===

export async function getRealtimeMetrics(companyId: string) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Métricas do dia
    const todayLeads = await prisma.lead.count({
      where: {
        companyId,
        createdAt: { gte: today }
      }
    })

    const todayOpportunities = await prisma.salesOpportunity.count({
      where: {
        companyId,
        createdAt: { gte: today }
      }
    })

    const todayRevenue = await prisma.salesOpportunity.aggregate({
      where: {
        companyId,
        status: 'WON',
        closedAt: { gte: today }
      },
      _sum: { value: true }
    })

    // Atividades recentes
    const recentActivities = await prisma.leadActivity.findMany({
      where: {
        lead: { companyId },
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Últimas 2 horas
      },
      include: {
        lead: { select: { name: true } },
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return {
      success: true,
      data: {
        today: {
          leads: todayLeads,
          opportunities: todayOpportunities,
          revenue: todayRevenue._sum.value || 0
        },
        recentActivities: recentActivities.map(activity => ({
          id: activity.id,
          type: activity.activityType,
          description: activity.description,
          leadName: activity.lead?.name,
          agentName: activity.user?.name,
          timestamp: activity.createdAt
        }))
      }
    }
  } catch (error) {
    return { success: false, error: `Erro nas métricas em tempo real: ${error}` }
  }
}