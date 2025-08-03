import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { whatsAppService } from '@/lib/whatsapp-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const leadId = searchParams.get('leadId')
    const phoneNumber = searchParams.get('phoneNumber')

    switch (action) {
      case 'config':
        return await checkConfiguration()
      
      case 'stats':
        return await getStats(session.user.companyId)
      
      case 'messages':
        if (leadId) {
          return await getLeadMessages(leadId)
        }
        return NextResponse.json({ error: 'leadId obrigatório' }, { status: 400 })
      
      case 'sessions':
        return await getSessions(session.user.companyId)
      
      case 'templates':
        return await getTemplates()
      
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro na API WhatsApp GET:', error)
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
      case 'send_message':
        return await sendMessage(data)
      
      case 'send_template':
        return await sendTemplate(data)
      
      case 'start_session':
        return await startSession(data)
      
      case 'send_automated':
        return await sendAutomatedMessage(data)
      
      case 'create_template':
        return await createTemplate(data, session.user.companyId)
      
      case 'setup_defaults':
        return await setupDefaultTemplates(session.user.companyId)
      
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro na API WhatsApp POST:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Webhook para receber mensagens do WhatsApp
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get('x-hub-signature-256') || ''

    const result = await whatsAppService.processWebhook(body, signature)
    
    if (result.success) {
      return NextResponse.json({ status: 'ok' })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro no webhook WhatsApp:', error)
    return NextResponse.json({ error: 'Erro no webhook' }, { status: 500 })
  }
}

// === IMPLEMENTAÇÕES ===

async function checkConfiguration() {
  try {
    const config = await whatsAppService.verifyConfiguration()
    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro na configuração: ${error}` }, { status: 500 })
  }
}

async function getStats(companyId: string) {
  try {
    const stats = await whatsAppService.getWhatsAppStats(companyId)
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro nas estatísticas: ${error}` }, { status: 500 })
  }
}

async function getLeadMessages(leadId: string) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        // Precisaríamos fazer join com lead pelo phoneNumber
        // Por simplicidade, vamos buscar por atividades do lead
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const activities = await prisma.leadActivity.findMany({
      where: {
        leadId,
        activityType: { in: ['whatsapp_sent', 'whatsapp_received'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ success: true, data: { messages, activities } })
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro ao buscar mensagens: ${error}` }, { status: 500 })
  }
}

async function getSessions(companyId: string) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    const sessions = await prisma.whatsAppSession.findMany({
      include: {
        lead: {
          select: { name: true, email: true, phone: true }
        }
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 100
    })

    return NextResponse.json({ success: true, data: sessions })
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro ao buscar sessões: ${error}` }, { status: 500 })
  }
}

async function getTemplates() {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    const templates = await prisma.whatsAppTemplate.findMany({
      where: { status: 'approved' },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ success: true, data: templates })
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro ao buscar templates: ${error}` }, { status: 500 })
  }
}

async function sendMessage(data: any) {
  try {
    const { to, type, text, image, document } = data
    
    const message = {
      to,
      type,
      ...(type === 'text' && text && { text }),
      ...(type === 'image' && image && { image }),
      ...(type === 'document' && document && { document })
    }

    const result = await whatsAppService.sendMessage(message)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro ao enviar mensagem: ${error}` }, { status: 500 })
  }
}

async function sendTemplate(data: any) {
  try {
    const { to, templateName, language = 'pt_BR', parameters = {} } = data
    
    const result = await whatsAppService.sendTemplate(to, templateName, language, parameters)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro ao enviar template: ${error}` }, { status: 500 })
  }
}

async function startSession(data: any) {
  try {
    const { leadId, phoneNumber } = data
    
    const session = await whatsAppService.startSession(leadId, phoneNumber)
    return NextResponse.json({ success: true, data: session })
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro ao iniciar sessão: ${error}` }, { status: 500 })
  }
}

async function sendAutomatedMessage(data: any) {
  try {
    const { leadId, trigger, score } = data
    
    const result = await whatsAppService.sendAutomatedMessage(leadId, trigger, score)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro na automação: ${error}` }, { status: 500 })
  }
}

async function createTemplate(data: any, companyId: string) {
  try {
    const { template } = data
    
    const result = await whatsAppService.createTemplate(template)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro ao criar template: ${error}` }, { status: 500 })
  }
}

async function setupDefaultTemplates(companyId: string) {
  try {
    const result = await whatsAppService.createDefaultTemplates(companyId)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, error: `Erro ao criar templates padrão: ${error}` }, { status: 500 })
  }
}