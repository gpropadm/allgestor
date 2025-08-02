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
  }): Promise<MCPResponse> {
    try {
      const where: any = {}
      
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
  }): Promise<MCPResponse> {
    try {
      const where: any = {}
      
      if (filters?.userId) {
        where.userId = filters.userId
      }
      if (filters?.propertyId) {
        where.propertyId = filters.propertyId
      }
      if (filters?.active) {
        where.isActive = true
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
  }): Promise<MCPResponse> {
    try {
      const where: any = {}
      
      if (filters?.userId) {
        where.contract = { userId: filters.userId }
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

  async getFinancialSummary(userId?: string, month?: number, year?: number): Promise<MCPResponse> {
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

  // === MATCHING INTELIGENTE ===
  
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