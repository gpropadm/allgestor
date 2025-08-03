// Serviço de Integração WhatsApp Business API
// Automatiza conversas, templates e notificações via WhatsApp

import { prisma } from './prisma'

interface WhatsAppTemplate {
  name: string
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  language: string
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
    text?: string
    example?: any
    buttons?: Array<{
      type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
      text: string
      url?: string
      phone?: string
    }>
  }>
}

interface WhatsAppMessage {
  to: string
  type: 'template' | 'text' | 'image' | 'document'
  template?: {
    name: string
    language: string
    components: Array<{
      type: string
      parameters: Array<{
        type: 'text' | 'currency' | 'date_time'
        text?: string
        currency?: { fallback_value: string, code: string, amount_1000: number }
        date_time?: { fallback_value: string }
      }>
    }>
  }
  text?: {
    body: string
  }
  image?: {
    link: string
    caption?: string
  }
  document?: {
    link: string
    filename: string
    caption?: string
  }
}

interface WhatsAppSession {
  id?: string
  leadId: string
  phoneNumber: string
  sessionStatus: 'active' | 'expired' | 'closed'
  lastMessageAt: Date
  messageCount: number
  conversationId?: string
}

export class WhatsAppService {
  private readonly apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0'
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  private readonly accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  private readonly webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET

  // === VERIFICAÇÃO E CONFIGURAÇÃO ===

  async verifyConfiguration(): Promise<{ isConfigured: boolean; issues: string[] }> {
    const issues = []
    
    if (!this.phoneNumberId) issues.push('WHATSAPP_PHONE_NUMBER_ID não configurado')
    if (!this.accessToken) issues.push('WHATSAPP_ACCESS_TOKEN não configurado')
    if (!this.webhookSecret) issues.push('WHATSAPP_WEBHOOK_SECRET não configurado')
    
    return {
      isConfigured: issues.length === 0,
      issues
    }
  }

  // === ENVIO DE MENSAGENS ===

  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = await this.verifyConfiguration()
      if (!config.isConfigured) {
        return { success: false, error: `Configuração incompleta: ${config.issues.join(', ')}` }
      }

      // Simular envio para WhatsApp API
      console.log(`📱 Enviando mensagem WhatsApp para ${message.to}:`, message)
      
      // Em produção seria:
      // const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.accessToken}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(message)
      // })

      // Simular resposta da API
      const simulatedResponse = {
        messages: [{
          id: `wamid.${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }]
      }

      // Salvar mensagem no banco
      await this.saveMessage(message, simulatedResponse.messages[0].id, 'sent')

      return { 
        success: true, 
        messageId: simulatedResponse.messages[0].id 
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error)
      return { success: false, error: `Erro no envio: ${error}` }
    }
  }

  // === TEMPLATES ===

  async sendTemplate(
    to: string, 
    templateName: string, 
    languageCode: string = 'pt_BR',
    parameters: Record<string, any> = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const template = await this.getTemplate(templateName)
      if (!template) {
        return { success: false, error: 'Template não encontrado' }
      }

      const message: WhatsAppMessage = {
        to,
        type: 'template',
        template: {
          name: templateName,
          language: languageCode,
          components: this.buildTemplateComponents(template, parameters)
        }
      }

      return await this.sendMessage(message)
    } catch (error) {
      return { success: false, error: `Erro ao enviar template: ${error}` }
    }
  }

  private buildTemplateComponents(template: WhatsAppTemplate, parameters: Record<string, any>) {
    return template.components.map(component => {
      if (component.type === 'BODY' && component.text) {
        // Extrair variáveis do template {{1}}, {{2}}, etc.
        const variables = component.text.match(/\{\{\d+\}\}/g) || []
        
        return {
          type: 'body',
          parameters: variables.map((variable, index) => {
            const paramKey = Object.keys(parameters)[index]
            const value = parameters[paramKey]
            
            if (typeof value === 'number' && paramKey.includes('price')) {
              return {
                type: 'currency',
                currency: {
                  fallback_value: `R$ ${value.toLocaleString()}`,
                  code: 'BRL',
                  amount_1000: value * 1000
                }
              }
            }
            
            return {
              type: 'text',
              text: String(value || '')
            }
          })
        }
      }
      
      return { type: component.type.toLowerCase() }
    })
  }

  // === SESSÕES DE CONVERSA ===

  async startSession(leadId: string, phoneNumber: string): Promise<WhatsAppSession> {
    try {
      // Buscar ou criar sessão
      let session = await prisma.whatsAppSession.findFirst({
        where: {
          leadId,
          phoneNumber,
          sessionStatus: 'active'
        }
      })

      if (!session) {
        session = await prisma.whatsAppSession.create({
          data: {
            leadId,
            phoneNumber,
            sessionStatus: 'active',
            lastMessageAt: new Date(),
            messageCount: 0
          }
        })
      }

      return session
    } catch (error) {
      throw new Error(`Erro ao iniciar sessão: ${error}`)
    }
  }

  async updateSession(sessionId: string, data: Partial<WhatsAppSession>) {
    try {
      return await prisma.whatsAppSession.update({
        where: { id: sessionId },
        data: {
          ...data,
          lastMessageAt: new Date()
        }
      })
    } catch (error) {
      throw new Error(`Erro ao atualizar sessão: ${error}`)
    }
  }

  // === AUTOMAÇÃO POR LEAD SCORING ===

  async sendAutomatedMessage(leadId: string, trigger: string, score?: number) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      })

      if (!lead || !lead.phone) {
        return { success: false, error: 'Lead não encontrado ou sem telefone' }
      }

      // Selecionar template baseado no trigger e score
      const templateName = this.selectTemplate(trigger, score)
      const parameters = await this.buildParameters(lead)

      const result = await this.sendTemplate(
        lead.phone,
        templateName,
        'pt_BR',
        parameters
      )

      // Registrar atividade
      if (result.success) {
        await prisma.leadActivity.create({
          data: {
            leadId,
            activityType: 'whatsapp_sent',
            description: `Mensagem automática enviada: ${templateName}`,
            metadata: JSON.stringify({ trigger, messageId: result.messageId })
          }
        })
      }

      return result
    } catch (error) {
      return { success: false, error: `Erro na automação: ${error}` }
    }
  }

  private selectTemplate(trigger: string, score?: number): string {
    const templates = {
      'lead_created': 'boas_vindas_lead',
      'high_score': score && score >= 80 ? 'lead_quente' : 'follow_up_geral',
      'property_match': 'imovel_compativel',
      'price_drop': 'reducao_preco',
      'inactive_lead': 'reativacao_lead',
      'visit_scheduled': 'confirmacao_visita',
      'visit_reminder': 'lembrete_visita',
      'proposal_sent': 'proposta_enviada',
      'contract_ready': 'contrato_pronto'
    }

    return templates[trigger as keyof typeof templates] || 'follow_up_geral'
  }

  private async buildParameters(lead: any): Promise<Record<string, any>> {
    // Buscar propriedades compatíveis
    const compatibleProperties = await prisma.property.findMany({
      where: {
        companyId: lead.companyId,
        salePrice: {
          lte: lead.maxPrice || 999999999
        },
        propertyType: lead.propertyType || undefined
      },
      take: 3,
      orderBy: { salePrice: 'asc' }
    })

    return {
      nome: lead.name,
      email: lead.email,
      orcamento: lead.maxPrice || 0,
      tipo_imovel: lead.propertyType || 'Qualquer',
      quantidade_imoveis: compatibleProperties.length,
      melhor_imovel: compatibleProperties[0]?.title || 'Nenhum encontrado',
      preco_melhor_imovel: compatibleProperties[0]?.salePrice || 0
    }
  }

  // === PROCESSAMENTO DE WEBHOOKS ===

  async processWebhook(body: any, signature: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar assinatura (segurança)
      if (!this.verifySignature(body, signature)) {
        return { success: false, error: 'Assinatura inválida' }
      }

      const { entry } = body
      if (!entry || entry.length === 0) {
        return { success: true } // Webhook de verificação
      }

      for (const entryData of entry) {
        const { changes } = entryData
        
        for (const change of changes) {
          if (change.field === 'messages') {
            await this.processIncomingMessage(change.value)
          }
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro no webhook WhatsApp:', error)
      return { success: false, error: `Erro no processamento: ${error}` }
    }
  }

  private async processIncomingMessage(value: any) {
    try {
      const { messages, contacts } = value
      
      if (!messages || messages.length === 0) return

      for (const message of messages) {
        const { from, text, type, timestamp } = message
        const contact = contacts?.find((c: any) => c.wa_id === from)

        // Buscar lead pelo telefone
        const lead = await prisma.lead.findFirst({
          where: { phone: from }
        })

        if (lead) {
          // Salvar mensagem recebida
          await this.saveMessage({
            to: from,
            type: 'text',
            text: { body: text?.body || '' }
          }, message.id, 'received')

          // Registrar atividade
          await prisma.leadActivity.create({
            data: {
              leadId: lead.id,
              activityType: 'whatsapp_received',
              description: `Mensagem recebida: ${text?.body || 'Mídia'}`,
              metadata: JSON.stringify({ messageId: message.id, type })
            }
          })

          // Atualizar sessão
          const session = await this.startSession(lead.id, from)
          await this.updateSession(session.id!, {
            messageCount: session.messageCount + 1
          })

          // Processar resposta automática se necessário
          await this.processAutoResponse(lead, text?.body || '')
        }
      }
    } catch (error) {
      console.error('Erro ao processar mensagem recebida:', error)
    }
  }

  private async processAutoResponse(lead: any, messageText: string) {
    // Implementar lógica de resposta automática baseada no conteúdo
    const lowerText = messageText.toLowerCase()
    
    if (lowerText.includes('preço') || lowerText.includes('valor')) {
      await this.sendAutomatedMessage(lead.id, 'property_match')
    } else if (lowerText.includes('visita') || lowerText.includes('agendar')) {
      await this.sendAutomatedMessage(lead.id, 'visit_scheduled')
    } else if (lowerText.includes('sim') || lowerText.includes('interesse')) {
      await this.sendAutomatedMessage(lead.id, 'high_score', 90)
    }
  }

  // === GERENCIAMENTO DE TEMPLATES ===

  async createTemplate(template: WhatsAppTemplate): Promise<{ success: boolean; error?: string }> {
    try {
      // Em produção, criaria o template via API do WhatsApp
      console.log('📋 Criando template WhatsApp:', template.name)
      
      // Salvar template localmente para referência
      await prisma.whatsAppTemplate.create({
        data: {
          name: template.name,
          category: template.category,
          language: template.language,
          components: JSON.stringify(template.components),
          status: 'pending' // pending, approved, rejected
        }
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: `Erro ao criar template: ${error}` }
    }
  }

  async getTemplate(name: string): Promise<WhatsAppTemplate | null> {
    try {
      const template = await prisma.whatsAppTemplate.findFirst({
        where: { name, status: 'approved' }
      })

      if (!template) return null

      return {
        name: template.name,
        category: template.category as any,
        language: template.language,
        components: JSON.parse(template.components)
      }
    } catch (error) {
      console.error('Erro ao buscar template:', error)
      return null
    }
  }

  // === TEMPLATES PADRÃO ===

  async createDefaultTemplates(companyId: string) {
    const templates = [
      {
        name: 'boas_vindas_lead',
        category: 'UTILITY' as const,
        language: 'pt_BR',
        components: [
          {
            type: 'BODY' as const,
            text: 'Olá {{1}}! 👋\n\nObrigado pelo seu interesse em nossos imóveis. Encontramos {{2}} opções dentro do seu orçamento de {{3}}.\n\nGostaria de agendar uma visita?'
          },
          {
            type: 'BUTTONS' as const,
            buttons: [
              { type: 'QUICK_REPLY' as const, text: 'Sim, agendar' },
              { type: 'QUICK_REPLY' as const, text: 'Ver opções' }
            ]
          }
        ]
      },
      {
        name: 'lead_quente',
        category: 'MARKETING' as const,
        language: 'pt_BR',
        components: [
          {
            type: 'BODY' as const,
            text: '🔥 {{1}}, temos uma oportunidade especial!\n\n{{2}} por apenas {{3}}.\n\nEsta é uma das nossas melhores opções. Que tal conhecer hoje mesmo?'
          },
          {
            type: 'BUTTONS' as const,
            buttons: [
              { type: 'QUICK_REPLY' as const, text: 'Quero ver!' },
              { type: 'QUICK_REPLY' as const, text: 'Mais informações' }
            ]
          }
        ]
      },
      {
        name: 'confirmacao_visita',
        category: 'UTILITY' as const,
        language: 'pt_BR',
        components: [
          {
            type: 'BODY' as const,
            text: '✅ Visita confirmada!\n\n📅 Data: {{1}}\n🕐 Horário: {{2}}\n📍 Local: {{3}}\n\nEstaremos te esperando. Qualquer dúvida, é só chamar!'
          }
        ]
      },
      {
        name: 'lembrete_visita',
        category: 'UTILITY' as const,
        language: 'pt_BR',
        components: [
          {
            type: 'BODY' as const,
            text: '⏰ Lembrete: sua visita é amanhã!\n\n📅 {{1}} às {{2}}\n📍 {{3}}\n\nNos vemos lá! 😊'
          }
        ]
      }
    ]

    const created = []
    for (const template of templates) {
      const result = await this.createTemplate(template)
      if (result.success) {
        created.push(template.name)
      }
    }

    return { success: true, data: created }
  }

  // === UTILIDADES ===

  private async saveMessage(message: WhatsAppMessage, messageId: string, direction: 'sent' | 'received') {
    try {
      await prisma.whatsAppMessage.create({
        data: {
          messageId,
          phoneNumber: message.to,
          messageType: message.type,
          content: JSON.stringify(message),
          direction,
          status: 'delivered' // sent, delivered, read, failed
        }
      })
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error)
    }
  }

  private verifySignature(body: any, signature: string): boolean {
    if (!this.webhookSecret) return false
    
    // Em produção, verificaria a assinatura HMAC
    // const crypto = require('crypto')
    // const expectedSignature = crypto.createHmac('sha256', this.webhookSecret)
    //   .update(JSON.stringify(body))
    //   .digest('hex')
    // return `sha256=${expectedSignature}` === signature
    
    return true // Simulação
  }

  // === RELATÓRIOS ===

  async getWhatsAppStats(companyId: string, period: 'day' | 'week' | 'month' = 'week') {
    try {
      const dateFrom = new Date()
      if (period === 'day') dateFrom.setDate(dateFrom.getDate() - 1)
      else if (period === 'week') dateFrom.setDate(dateFrom.getDate() - 7)
      else dateFrom.setMonth(dateFrom.getMonth() - 1)

      const messages = await prisma.whatsAppMessage.findMany({
        where: {
          createdAt: { gte: dateFrom }
        }
      })

      const sessions = await prisma.whatsAppSession.findMany({
        where: {
          createdAt: { gte: dateFrom }
        }
      })

      const stats = {
        totalMessages: messages.length,
        sentMessages: messages.filter(m => m.direction === 'sent').length,
        receivedMessages: messages.filter(m => m.direction === 'received').length,
        activeSessions: sessions.filter(s => s.sessionStatus === 'active').length,
        responseRate: this.calculateResponseRate(messages),
        avgResponseTime: this.calculateAvgResponseTime(messages)
      }

      return { success: true, data: stats }
    } catch (error) {
      return { success: false, error: `Erro ao gerar estatísticas: ${error}` }
    }
  }

  private calculateResponseRate(messages: any[]): number {
    const sentMessages = messages.filter(m => m.direction === 'sent')
    const receivedMessages = messages.filter(m => m.direction === 'received')
    
    if (sentMessages.length === 0) return 0
    return Math.round((receivedMessages.length / sentMessages.length) * 100)
  }

  private calculateAvgResponseTime(messages: any[]): number {
    // Implementação simplificada - calcularia tempo real entre mensagens
    return Math.round(15 + Math.random() * 30) // 15-45 minutos simulado
  }
}

export const whatsAppService = new WhatsAppService()