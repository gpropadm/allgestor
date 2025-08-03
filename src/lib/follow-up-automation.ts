// Sistema de Follow-up Automático
// Gerencia sequências automatizadas de contato com leads

import { prisma } from './prisma'
import { addDays, addHours } from 'date-fns'

interface FollowUpSequenceConfig {
  name: string
  description?: string
  triggerEvent: 'lead_created' | 'visit_scheduled' | 'proposal_sent' | 'no_response'
  steps: FollowUpStepConfig[]
  companyId: string
}

interface FollowUpStepConfig {
  stepOrder: number
  delayDays: number
  delayHours?: number
  actionType: 'email' | 'whatsapp' | 'call_reminder' | 'task_reminder'
  templateSubject?: string
  templateContent: string
}

export class FollowUpAutomation {
  
  // === CRIAÇÃO DE SEQUÊNCIAS ===
  
  async createSequence(config: FollowUpSequenceConfig) {
    try {
      const sequence = await prisma.followUpSequence.create({
        data: {
          name: config.name,
          description: config.description,
          triggerEvent: config.triggerEvent,
          companyId: config.companyId,
          steps: {
            create: config.steps.map(step => ({
              stepOrder: step.stepOrder,
              delayDays: step.delayDays,
              delayHours: step.delayHours || 0,
              actionType: step.actionType,
              templateSubject: step.templateSubject,
              templateContent: step.templateContent
            }))
          }
        },
        include: { steps: true }
      })
      
      return { success: true, data: sequence }
    } catch (error) {
      return { success: false, error: `Erro ao criar sequência: ${error}` }
    }
  }
  
  // === GATILHOS AUTOMÁTICOS ===
  
  async triggerSequence(leadId: string, triggerEvent: string, companyId: string) {
    try {
      // Buscar sequências ativas para o evento
      const sequences = await prisma.followUpSequence.findMany({
        where: {
          triggerEvent,
          companyId,
          active: true
        },
        include: { steps: { where: { active: true }, orderBy: { stepOrder: 'asc' } } }
      })
      
      const scheduled = []
      
      for (const sequence of sequences) {
        for (const step of sequence.steps) {
          const scheduledFor = this.calculateScheduleTime(step.delayDays, step.delayHours)
          
          const execution = await prisma.followUpExecution.create({
            data: {
              leadId,
              stepId: step.id,
              scheduledFor,
              status: 'pending'
            }
          })
          
          scheduled.push(execution)
        }
      }
      
      return { success: true, data: { scheduled: scheduled.length } }
    } catch (error) {
      return { success: false, error: `Erro ao agendar follow-ups: ${error}` }
    }
  }
  
  // === EXECUÇÃO DE FOLLOW-UPS ===
  
  async executePendingFollowUps() {
    try {
      const now = new Date()
      
      const pendingExecutions = await prisma.followUpExecution.findMany({
        where: {
          status: 'pending',
          scheduledFor: { lte: now }
        },
        include: {
          step: {
            include: {
              sequence: true
            }
          }
        },
        take: 100 // Processar em lotes
      })
      
      let executed = 0
      let failed = 0
      
      for (const execution of pendingExecutions) {
        try {
          await this.executeFollowUpAction(execution)
          
          await prisma.followUpExecution.update({
            where: { id: execution.id },
            data: {
              status: 'executed',
              executedAt: new Date(),
              result: 'Success'
            }
          })
          
          executed++
        } catch (error) {
          await prisma.followUpExecution.update({
            where: { id: execution.id },
            data: {
              status: 'failed',
              result: `Error: ${error}`
            }
          })
          
          failed++
        }
      }
      
      return { 
        success: true, 
        data: { 
          processed: pendingExecutions.length,
          executed,
          failed 
        } 
      }
    } catch (error) {
      return { success: false, error: `Erro ao executar follow-ups: ${error}` }
    }
  }
  
  // === AÇÕES DE FOLLOW-UP ===
  
  private async executeFollowUpAction(execution: any) {
    const { step, leadId } = execution
    
    switch (step.actionType) {
      case 'email':
        return await this.sendEmail(leadId, step)
      case 'whatsapp':
        return await this.sendWhatsApp(leadId, step)
      case 'call_reminder':
        return await this.createCallReminder(leadId, step)
      case 'task_reminder':
        return await this.createTaskReminder(leadId, step)
      default:
        throw new Error(`Ação não suportada: ${step.actionType}`)
    }
  }
  
  private async sendEmail(leadId: string, step: any) {
    // Buscar dados do lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    })
    
    if (!lead) throw new Error('Lead não encontrado')
    
    // Substituir variáveis no template
    const content = this.replaceTemplateVariables(step.templateContent, {
      leadName: lead.name,
      leadEmail: lead.email,
      maxPrice: lead.maxPrice?.toLocaleString() || 'N/A'
    })
    
    const subject = this.replaceTemplateVariables(step.templateSubject || 'Follow-up Imobiliário', {
      leadName: lead.name
    })
    
    // Simular envio de email (aqui você integraria com um serviço real)
    console.log(`📧 EMAIL ENVIADO:`)
    console.log(`Para: ${lead.email}`)
    console.log(`Assunto: ${subject}`)
    console.log(`Conteúdo: ${content}`)
    
    return true
  }
  
  private async sendWhatsApp(leadId: string, step: any) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    })
    
    if (!lead) throw new Error('Lead não encontrado')
    
    const message = this.replaceTemplateVariables(step.templateContent, {
      leadName: lead.name,
      maxPrice: lead.maxPrice?.toLocaleString() || 'N/A'
    })
    
    // Simular envio WhatsApp (aqui você integraria com WhatsApp Business API)
    console.log(`📱 WHATSAPP ENVIADO:`)
    console.log(`Para: ${lead.phone}`)
    console.log(`Mensagem: ${message}`)
    
    return true
  }
  
  private async createCallReminder(leadId: string, step: any) {
    // Criar lembrete de ligação (pode integrar com calendário)
    console.log(`📞 LEMBRETE DE LIGAÇÃO criado para lead ${leadId}`)
    return true
  }
  
  private async createTaskReminder(leadId: string, step: any) {
    // Criar tarefa no sistema
    console.log(`✅ TAREFA criada para lead ${leadId}: ${step.templateContent}`)
    return true
  }
  
  // === UTILITÁRIOS ===
  
  private calculateScheduleTime(delayDays: number, delayHours = 0): Date {
    let scheduleTime = new Date()
    scheduleTime = addDays(scheduleTime, delayDays)
    scheduleTime = addHours(scheduleTime, delayHours)
    return scheduleTime
  }
  
  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      result = result.replace(new RegExp(placeholder, 'g'), value)
    })
    
    return result
  }
  
  // === SEQUÊNCIAS PRÉ-DEFINIDAS ===
  
  async createDefaultSequences(companyId: string) {
    const sequences = [
      {
        name: 'Boas-vindas para Novo Lead',
        description: 'Sequência automática para leads recém-cadastrados',
        triggerEvent: 'lead_created' as const,
        companyId,
        steps: [
          {
            stepOrder: 1,
            delayDays: 0,
            delayHours: 1,
            actionType: 'whatsapp' as const,
            templateContent: 'Olá {{leadName}}! 👋 Recebemos seu interesse em nossos imóveis. Em breve entraremos em contato com opções perfeitas para você!'
          },
          {
            stepOrder: 2,
            delayDays: 1,
            actionType: 'email' as const,
            templateSubject: 'Imóveis selecionados para {{leadName}}',
            templateContent: 'Olá {{leadName}}, selecionamos alguns imóveis que podem interessar você, considerando seu orçamento de até R$ {{maxPrice}}.'
          },
          {
            stepOrder: 3,
            delayDays: 3,
            actionType: 'call_reminder' as const,
            templateContent: 'Ligar para {{leadName}} e agendar visita'
          },
          {
            stepOrder: 4,
            delayDays: 7,
            actionType: 'whatsapp' as const,
            templateContent: '{{leadName}}, ainda está procurando imóvel? Temos novas opções que chegaram esta semana! 🏠'
          }
        ]
      },
      {
        name: 'Follow-up Pós-Visita',
        description: 'Acompanhamento após visita agendada',
        triggerEvent: 'visit_scheduled' as const,
        companyId,
        steps: [
          {
            stepOrder: 1,
            delayDays: 0,
            delayHours: 2,
            actionType: 'whatsapp' as const,
            templateContent: '{{leadName}}, sua visita está confirmada! Alguma dúvida antes de irmos ao imóvel? 😊'
          },
          {
            stepOrder: 2,
            delayDays: 1,
            actionType: 'email' as const,
            templateSubject: 'Como foi sua visita, {{leadName}}?',
            templateContent: 'Esperamos que tenha gostado do imóvel! Tem alguma dúvida? Estamos aqui para ajudar.'
          },
          {
            stepOrder: 3,
            delayDays: 3,
            actionType: 'call_reminder' as const,
            templateContent: 'Ligar e verificar interesse após visita'
          }
        ]
      }
    ]
    
    const created = []
    for (const sequence of sequences) {
      const result = await this.createSequence(sequence)
      if (result.success) {
        created.push(result.data)
      }
    }
    
    return { success: true, data: created }
  }
  
  // === RELATÓRIOS ===
  
  async getFollowUpStats(companyId: string, days = 30) {
    try {
      const since = addDays(new Date(), -days)
      
      const stats = await prisma.followUpExecution.findMany({
        where: {
          createdAt: { gte: since },
          step: {
            sequence: {
              companyId
            }
          }
        },
        include: {
          step: {
            include: {
              sequence: true
            }
          }
        }
      })
      
      const byStatus = stats.reduce((acc, execution) => {
        acc[execution.status] = (acc[execution.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const byAction = stats.reduce((acc, execution) => {
        const actionType = execution.step.actionType
        acc[actionType] = (acc[actionType] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      return {
        success: true,
        data: {
          total: stats.length,
          byStatus,
          byAction,
          executionRate: stats.length > 0 ? (byStatus.executed || 0) / stats.length * 100 : 0
        }
      }
    } catch (error) {
      return { success: false, error: `Erro ao buscar estatísticas: ${error}` }
    }
  }
}

export const followUpAutomation = new FollowUpAutomation()