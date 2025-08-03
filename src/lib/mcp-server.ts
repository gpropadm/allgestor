// MCP Server para CRM Imobiliário
// Conecta Claude com dados do CRM via Model Context Protocol

import { prisma } from './prisma'
import type { Property, Owner, Tenant, Contract, Payment, Lead } from '@prisma/client'

interface MCPResponse {
  success: boolean
  data?: any
  error?: string
}

export class CRMMCPServer {
  // === PROPRIEDADES ===
  
  async getProperties(filters?: {
    available?: boolean
    type?: string
    city?: string
    minPrice?: number
    maxPrice?: number
    userId?: string
    companyId?: string
  }): Promise<MCPResponse> {
    try {
      const where: any = {}
      
      // SEGURANÇA: SEMPRE filtrar por companyId para isolamento de dados
      if (filters?.companyId) {
        where.companyId = filters.companyId
      } else {
        throw new Error('CompanyId é obrigatório para segurança dos dados')
      }
      
      if (filters?.available !== undefined) {
        where.isAvailable = filters.available
      }
      if (filters?.type) {
        where.type = filters.type
      }
      if (filters?.city) {
        where.city = { contains: filters.city, mode: 'insensitive' }
      }
      if (filters?.minPrice || filters?.maxPrice) {
        where.rentAmount = {}
        if (filters.minPrice) where.rentAmount.gte = filters.minPrice
        if (filters.maxPrice) where.rentAmount.lte = filters.maxPrice
      }
      if (filters?.userId) {
        where.userId = filters.userId
      }

      const properties = await prisma.property.findMany({
        where,
        include: {
          owner: true,
          contracts: {
            include: {
              tenant: true,
              payments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return { success: true, data: properties }
    } catch (error) {
      return { success: false, error: `Erro ao buscar propriedades: ${error}` }
    }
  }

  async getPropertyAnalytics(propertyId?: string): Promise<MCPResponse> {
    try {
      const analytics: any = {}

      if (propertyId) {
        // Análise de propriedade específica
        const property = await prisma.property.findUnique({
          where: { id: propertyId },
          include: {
            contracts: {
              include: {
                payments: true,
                tenant: true
              }
            }
          }
        })

        if (!property) {
          return { success: false, error: 'Propriedade não encontrada' }
        }

        const totalRevenue = property.contracts.reduce((sum, contract) => 
          sum + contract.payments.filter(p => p.status === 'PAID').reduce((pSum, payment) => pSum + payment.amount, 0), 0
        )

        const occupancyDays = property.contracts.reduce((sum, contract) => {
          const start = new Date(contract.startDate)
          const end = contract.endDate ? new Date(contract.endDate) : new Date()
          return sum + Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        }, 0)

        analytics.property = property
        analytics.totalRevenue = totalRevenue
        analytics.occupancyDays = occupancyDays
        analytics.occupancyRate = property.contracts.length > 0 ? (occupancyDays / 365) * 100 : 0
      } else {
        // Análise geral do portfólio
        const totalProperties = await prisma.property.count()
        const availableProperties = await prisma.property.count({ where: { isAvailable: true } })
        const totalContracts = await prisma.contract.count()
        
        const totalRevenue = await prisma.payment.aggregate({
          where: { status: 'PAID' },
          _sum: { amount: true }
        })

        analytics.portfolio = {
          totalProperties,
          availableProperties,
          occupiedProperties: totalProperties - availableProperties,
          totalContracts,
          totalRevenue: totalRevenue._sum.amount || 0,
          occupancyRate: totalProperties > 0 ? ((totalProperties - availableProperties) / totalProperties) * 100 : 0
        }
      }

      return { success: true, data: analytics }
    } catch (error) {
      return { success: false, error: `Erro ao analisar propriedades: ${error}` }
    }
  }

  // === CONTRATOS ===
  
  async getContracts(filters?: {
    active?: boolean
    expiringSoon?: boolean
    userId?: string
    propertyId?: string
    companyId?: string
  }): Promise<MCPResponse> {
    try {
      const where: any = {}
      
      // SEGURANÇA: SEMPRE filtrar por companyId
      if (filters?.companyId) {
        where.companyId = filters.companyId
      } else {
        throw new Error('CompanyId é obrigatório para segurança dos dados')
      }
      
      if (filters?.userId) {
        where.userId = filters.userId
      }
      if (filters?.propertyId) {
        where.propertyId = filters.propertyId
      }
      if (filters?.active) {
        where.status = 'ACTIVE'
      }
      if (filters?.expiringSoon) {
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        where.endDate = {
          lte: thirtyDaysFromNow,
          gte: new Date()
        }
      }

      const contracts = await prisma.contract.findMany({
        where,
        include: {
          property: true,
          tenant: true,
          owner: true,
          payments: {
            orderBy: { dueDate: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return { success: true, data: contracts }
    } catch (error) {
      return { success: false, error: `Erro ao buscar contratos: ${error}` }
    }
  }

  // === PAGAMENTOS ===
  
  async getPayments(filters?: {
    status?: 'PENDING' | 'PAID' | 'OVERDUE'
    overdue?: boolean
    userId?: string
    contractId?: string
    fromDate?: Date
    toDate?: Date
    companyId?: string
  }): Promise<MCPResponse> {
    try {
      const where: any = {}
      
      // SEGURANÇA: SEMPRE filtrar por companyId através do contrato
      if (filters?.companyId) {
        where.contract = { companyId: filters.companyId }
        if (filters?.userId) {
          where.contract.userId = filters.userId
        }
      } else {
        throw new Error('CompanyId é obrigatório para segurança dos dados')
      }
      if (filters?.contractId) {
        where.contractId = filters.contractId
      }
      if (filters?.status) {
        where.status = filters.status
      }
      if (filters?.overdue) {
        where.status = 'PENDING'
        where.dueDate = { lt: new Date() }
      }
      if (filters?.fromDate || filters?.toDate) {
        where.dueDate = {}
        if (filters.fromDate) where.dueDate.gte = filters.fromDate
        if (filters.toDate) where.dueDate.lte = filters.toDate
      }

      const payments = await prisma.payment.findMany({
        where,
        include: {
          contract: {
            include: {
              property: true,
              tenant: true
            }
          }
        },
        orderBy: { dueDate: 'desc' }
      })

      return { success: true, data: payments }
    } catch (error) {
      return { success: false, error: `Erro ao buscar pagamentos: ${error}` }
    }
  }

  async getFinancialSummary(userId?: string, companyId?: string, month?: number, year?: number): Promise<MCPResponse> {
    try {
      const currentDate = new Date()
      const targetMonth = month || currentDate.getMonth() + 1
      const targetYear = year || currentDate.getFullYear()
      
      const startDate = new Date(targetYear, targetMonth - 1, 1)
      const endDate = new Date(targetYear, targetMonth, 0)

      const where: any = {
        dueDate: {
          gte: startDate,
          lte: endDate
        }
      }

      if (userId) {
        where.contract = { userId }
      }

      const [paidPayments, pendingPayments, overduePayments] = await Promise.all([
        prisma.payment.findMany({
          where: { ...where, status: 'PAID' },
          include: { contract: { include: { property: true, tenant: true } } }
        }),
        prisma.payment.findMany({
          where: { ...where, status: 'PENDING', dueDate: { gte: new Date() } },
          include: { contract: { include: { property: true, tenant: true } } }
        }),
        prisma.payment.findMany({
          where: { ...where, status: 'PENDING', dueDate: { lt: new Date() } },
          include: { contract: { include: { property: true, tenant: true } } }
        })
      ])

      const summary = {
        period: { month: targetMonth, year: targetYear },
        paid: {
          count: paidPayments.length,
          total: paidPayments.reduce((sum, p) => sum + p.amount, 0),
          payments: paidPayments
        },
        pending: {
          count: pendingPayments.length,
          total: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
          payments: pendingPayments
        },
        overdue: {
          count: overduePayments.length,
          total: overduePayments.reduce((sum, p) => sum + p.amount, 0),
          payments: overduePayments
        }
      }

      summary.total = summary.paid.total + summary.pending.total + summary.overdue.total

      return { success: true, data: summary }
    } catch (error) {
      return { success: false, error: `Erro ao gerar resumo financeiro: ${error}` }
    }
  }

  // === LEADS ===
  
  async getLeads(filters?: {
    status?: string
    budget?: { min?: number, max?: number }
    location?: string
    userId?: string
  }): Promise<MCPResponse> {
    try {
      const where: any = {}
      
      if (filters?.userId) {
        where.userId = filters.userId
      }
      if (filters?.status) {
        where.status = filters.status
      }
      if (filters?.budget?.min || filters?.budget?.max) {
        where.budget = {}
        if (filters.budget.min) where.budget.gte = filters.budget.min
        if (filters.budget.max) where.budget.lte = filters.budget.max
      }
      if (filters?.location) {
        where.OR = [
          { city: { contains: filters.location, mode: 'insensitive' } },
          { neighborhood: { contains: filters.location, mode: 'insensitive' } }
        ]
      }

      const leads = await prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })

      return { success: true, data: leads }
    } catch (error) {
      return { success: false, error: `Erro ao buscar leads: ${error}` }
    }
  }

  // === SISTEMA DE VENDAS INTELIGENTE ===

  // NOVO: Análise de leads quentes para vendas
  async getHotLeads(userId: string): Promise<MCPResponse> {
    try {
      const leads = await prisma.lead.findMany({
        where: { userId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }
      })

      // Calcular score de urgência para cada lead
      const hotLeads = leads.map(lead => {
        let urgencyScore = 0
        let reasons = []

        // Tempo no funil (mais antigo = mais urgente)
        const daysInFunnel = Math.floor((new Date().getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        if (daysInFunnel > 7) {
          urgencyScore += 30
          reasons.push(`${daysInFunnel} dias no funil`)
        }

        // Orçamento realista
        if (lead.maxPrice && lead.maxPrice >= 3000) {
          urgencyScore += 25
          reasons.push('Orçamento adequado')
        }

        // Especificações claras
        if (lead.minBedrooms && lead.maxBedrooms) {
          urgencyScore += 15
          reasons.push('Critérios definidos')
        }

        // Interesse específico
        if (lead.preferredCities && JSON.parse(lead.preferredCities).length <= 2) {
          urgencyScore += 20
          reasons.push('Localização focada')
        }

        // Base score para leads ativos
        urgencyScore += 10

        return {
          ...lead,
          urgencyScore,
          urgencyReasons: reasons,
          priority: urgencyScore >= 70 ? 'ALTA' : urgencyScore >= 40 ? 'MÉDIA' : 'BAIXA'
        }
      }).sort((a, b) => b.urgencyScore - a.urgencyScore)

      return { success: true, data: hotLeads }
    } catch (error) {
      return { success: false, error: `Erro ao analisar leads quentes: ${error}` }
    }
  }

  // NOVO: Gerador de argumentos personalizados de venda
  async getSalesArguments(leadId: string, propertyId: string): Promise<MCPResponse> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      })

      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: { owner: true }
      })

      if (!lead || !property) {
        return { success: false, error: 'Lead ou propriedade não encontrados' }
      }

      const salesArguments = {
        leadProfile: {
          name: lead.name,
          budget: lead.maxPrice,
          needs: `${lead.minBedrooms || 0}-${lead.maxBedrooms || 'N/A'} quartos`,
          location: JSON.parse(lead.preferredCities || '[]').join(', ')
        },
        propertyHighlights: [],
        personalizedPitch: '',
        objectionHandling: [],
        valueProposition: '',
        nextSteps: []
      }

      // Destacar pontos fortes da propriedade
      if (property.amenities) {
        const amenities = JSON.parse(property.amenities)
        salesArguments.propertyHighlights.push(...amenities.slice(0, 3))
      }

      // Proposta de valor personalizada
      const priceMatch = lead.maxPrice >= property.rentPrice
      const bedroomMatch = !lead.minBedrooms || property.bedrooms >= lead.minBedrooms

      if (priceMatch && bedroomMatch) {
        salesArguments.personalizedPitch = `${lead.name}, encontrei o imóvel perfeito para você! Este ${property.propertyType.toLowerCase()} em ${property.city} tem exatamente ${property.bedrooms} quartos dentro do seu orçamento de R$ ${lead.maxPrice?.toLocaleString()}.`
      }

      // Tratamento de objeções
      if (property.rentPrice > (lead.maxPrice || 0) * 0.9) {
        salesArguments.objectionHandling.push('Preço: "O valor está dentro da faixa de mercado para esta localização premium. Considere o custo-benefício da localização e amenidades."')
      }

      // Próximos passos
      salesArguments.nextSteps = [
        'Agendar visita presencial',
        'Enviar mais fotos e vídeo do imóvel',
        'Apresentar documentação necessária',
        'Discutir condições de contrato'
      ]

      return { success: true, data: salesArguments }
    } catch (error) {
      return { success: false, error: `Erro ao gerar argumentos de venda: ${error}` }
    }
  }

  // NOVO: Alertas de oportunidades diárias
  async getDailySalesOpportunities(userId: string): Promise<MCPResponse> {
    try {
      const opportunities = {
        urgentActions: [],
        hotLeads: [],
        availableProperties: [],
        suggestedActions: [],
        kpis: {
          totalLeads: 0,
          hotLeads: 0,
          availableProperties: 0,
          potentialRevenue: 0
        }
      }

      // Buscar leads quentes
      const hotLeadsResult = await this.getHotLeads(userId)
      if (hotLeadsResult.success) {
        opportunities.hotLeads = hotLeadsResult.data.slice(0, 5)
        opportunities.kpis.hotLeads = hotLeadsResult.data.filter(l => l.priority === 'ALTA').length
      }

      // Buscar propriedades disponíveis
      const propertiesResult = await this.getProperties({ userId, available: true })
      if (propertiesResult.success) {
        opportunities.availableProperties = propertiesResult.data.slice(0, 3)
        opportunities.kpis.availableProperties = propertiesResult.data.length
        opportunities.kpis.potentialRevenue = propertiesResult.data.reduce((sum, p) => sum + (p.rentPrice || 0), 0)
      }

      // Ações urgentes
      const leadsResult = await this.getLeads({ userId })
      if (leadsResult.success) {
        opportunities.kpis.totalLeads = leadsResult.data.length
        
        leadsResult.data.forEach(lead => {
          const daysInFunnel = Math.floor((new Date().getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          if (daysInFunnel > 14) {
            opportunities.urgentActions.push({
              type: 'FOLLOW_UP',
              leadName: lead.name,
              reason: `${daysInFunnel} dias sem contato`,
              priority: 'ALTA'
            })
          }
        })
      }

      // Sugestões de ações
      opportunities.suggestedActions = [
        'Ligar para os 3 leads mais quentes do dia',
        'Enviar fotos de propriedades para leads com critérios específicos',
        'Agendar visitas para propriedades premium',
        'Fazer follow-up de propostas pendentes'
      ]

      return { success: true, data: opportunities }
    } catch (error) {
      return { success: false, error: `Erro ao gerar oportunidades: ${error}` }
    }
  }

  // === MATCHING INTELIGENTE MELHORADO ===
  
  async findPropertyMatches(leadId: string): Promise<MCPResponse> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      })

      if (!lead) {
        return { success: false, error: 'Lead não encontrado' }
      }

      const where: any = {
        isAvailable: true
      }

      // Filtros baseados no lead
      if (lead.propertyType) {
        where.type = lead.propertyType
      }
      if (lead.budget) {
        where.rentAmount = { lte: lead.budget * 1.1 } // 10% de margem
      }
      if (lead.city) {
        where.city = { contains: lead.city, mode: 'insensitive' }
      }
      if (lead.bedrooms) {
        where.bedrooms = { gte: lead.bedrooms }
      }

      const matches = await prisma.property.findMany({
        where,
        include: {
          owner: true
        },
        orderBy: { createdAt: 'desc' }
      })

      // Calcular score de match
      const matchesWithScore = matches.map(property => {
        let score = 0
        
        if (property.type === lead.propertyType) score += 30
        if (property.city?.toLowerCase() === lead.city?.toLowerCase()) score += 25
        if (property.neighborhood?.toLowerCase() === lead.neighborhood?.toLowerCase()) score += 20
        if (lead.budget && property.rentAmount <= lead.budget) score += 15
        if (lead.bedrooms && property.bedrooms >= lead.bedrooms) score += 10

        return { ...property, matchScore: score }
      }).sort((a, b) => b.matchScore - a.matchScore)

      return { success: true, data: matchesWithScore }
    } catch (error) {
      return { success: false, error: `Erro ao buscar matches: ${error}` }
    }
  }

  // === MARKET INTELLIGENCE ===
  
  async getMarketAnalysis(location?: string, propertyType?: string): Promise<MCPResponse> {
    try {
      const where: any = {}
      
      if (location) {
        where.OR = [
          { city: { contains: location, mode: 'insensitive' } },
          { neighborhood: { contains: location, mode: 'insensitive' } }
        ]
      }
      if (propertyType) {
        where.type = propertyType
      }

      const properties = await prisma.property.findMany({
        where,
        include: {
          contracts: {
            include: {
              payments: {
                where: { status: 'PAID' }
              }
            }
          }
        }
      })

      if (properties.length === 0) {
        return { success: false, error: 'Nenhuma propriedade encontrada para análise' }
      }

      const rentAmounts = properties.map(p => p.rentAmount).filter(Boolean)
      const avgRent = rentAmounts.reduce((sum, rent) => sum + rent, 0) / rentAmounts.length
      const minRent = Math.min(...rentAmounts)
      const maxRent = Math.max(...rentAmounts)
      
      const occupancyRate = properties.filter(p => !p.isAvailable).length / properties.length * 100

      const analysis = {
        location: location || 'Todas as localidades',
        propertyType: propertyType || 'Todos os tipos',
        totalProperties: properties.length,
        priceAnalysis: {
          averageRent: Math.round(avgRent),
          minRent,
          maxRent,
          priceRange: `R$ ${minRent.toLocaleString()} - R$ ${maxRent.toLocaleString()}`
        },
        marketHealth: {
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          availableProperties: properties.filter(p => p.isAvailable).length,
          occupiedProperties: properties.filter(p => !p.isAvailable).length
        }
      }

      return { success: true, data: analysis }
    } catch (error) {
      return { success: false, error: `Erro na análise de mercado: ${error}` }
    }
  }
}

// Instância singleton
export const crmMCP = new CRMMCPServer()