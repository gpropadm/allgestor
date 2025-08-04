import { NextRequest, NextResponse } from 'next/server'
import { crmMCP } from '@/lib/mcp-server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs/promises'
import path from 'path'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Função para executar comandos MCP (mantém a mesma lógica)
async function executeMCPCommand(command: string, params: any, userId: string, companyId: string): Promise<any> {
  try {
    switch (command) {
      case 'get_properties':
        return await crmMCP.getProperties({ ...params, userId, companyId })
      
      case 'get_property_analytics':
        return await crmMCP.getPropertyAnalytics(params.propertyId, companyId)
      
      case 'get_contracts':
        return await crmMCP.getContracts({ ...params, userId, companyId })
      
      case 'get_payments':
        const paymentParams = { ...params, userId, companyId }
        if (params.status === 'overdue') {
          paymentParams.overdue = true
          delete paymentParams.status
        }
        return await crmMCP.getPayments(paymentParams)
      
      case 'get_financial_summary':
        return await crmMCP.getFinancialSummary(userId, companyId, params.month, params.year)
      
      case 'get_leads':
        return await crmMCP.getLeads({ ...params, userId, companyId })
      
      case 'find_property_matches':
        return await crmMCP.findPropertyMatches(params.leadId, companyId)
      
      case 'get_market_analysis':
        return await crmMCP.getMarketAnalysis(params.location, params.propertyType, companyId)
      
      case 'get_hot_leads':
        return await crmMCP.getHotLeads(userId, companyId)
      
      case 'get_sales_arguments':
        return await crmMCP.getSalesArguments(params.leadId, params.propertyId, companyId)
      
      case 'get_daily_sales_opportunities':
        return await crmMCP.getDailySalesOpportunities(userId, companyId)
      
      default:
        return { success: false, error: `Comando MCP não reconhecido: ${command}` }
    }
  } catch (error) {
    return { success: false, error: `Erro ao executar comando MCP: ${error}` }
  }
}

// Função para ler e atualizar contexto do assistente
async function readAssistantContext(contextFilePath: string): Promise<string> {
  try {
    if (await fs.access(contextFilePath).then(() => true).catch(() => false)) {
      return await fs.readFile(contextFilePath, 'utf8')
    }
    return ''
  } catch (error) {
    console.error('Erro ao ler contexto:', error)
    return ''
  }
}

async function updateAssistantContext(contextFilePath: string, newContext: string): Promise<void> {
  try {
    const dir = path.dirname(contextFilePath)
    await fs.mkdir(dir, { recursive: true })
    
    // Atualizar seção "Última Atualização"
    const updatedContext = newContext.replace(
      /## Última Atualização\n.*$/m,
      `## Última Atualização\n${new Date().toISOString()}`
    )
    
    await fs.writeFile(contextFilePath, updatedContext, 'utf8')
  } catch (error) {
    console.error('Erro ao atualizar contexto:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.companyId) {
      return NextResponse.json({ error: 'Não autorizado ou sem empresa associada' }, { status: 401 })
    }

    const { message, assistantId, conversationId } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
    }

    // Buscar assistente específico ou usar o primário
    let assistant
    if (assistantId) {
      assistant = await prisma.aIAssistant.findFirst({
        where: {
          id: assistantId,
          userId: session.user.id,
          companyId: session.user.companyId,
          isActive: true
        }
      })
    } else {
      // Usar assistente primário (SOFIA por padrão)
      assistant = await prisma.aIAssistant.findFirst({
        where: {
          userId: session.user.id,
          companyId: session.user.companyId,
          isPrimary: true,
          isActive: true
        }
      })
    }

    if (!assistant) {
      return NextResponse.json({ error: 'Assistente não encontrado' }, { status: 404 })
    }

    // Buscar ou criar conversa
    let conversation
    if (conversationId) {
      conversation = await prisma.aIConversation.findFirst({
        where: {
          id: conversationId,
          userId: session.user.id,
          assistantId: assistant.id
        }
      })
    }

    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: {
          userId: session.user.id,
          assistantId: assistant.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          contextData: JSON.stringify({ messages: [] })
        }
      })
    }

    // Ler contexto do assistente do arquivo .MD
    const assistantContext = assistant.contextFilePath 
      ? await readAssistantContext(assistant.contextFilePath)
      : ''

    // Buscar mensagens anteriores da conversa
    const previousMessages = await prisma.aIMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 10 // Últimas 10 mensagens para contexto
    })

    // Construir prompt com contexto do assistente e histórico
    const contextualPrompt = `${assistant.systemPrompt}

## CONTEXTO DO ASSISTENTE:
${assistantContext}

## HISTÓRICO DA CONVERSA:
${previousMessages.map(msg => `${msg.type}: ${msg.content}`).join('\n')}

## NOVA MENSAGEM DO USUÁRIO:
${message}

## INSTRUÇÕES:
1. Use seu conhecimento específico e personalidade definida
2. Consulte dados via MCP se necessário (responda com JSON se precisar de dados)
3. Mantenha consistência com conversas anteriores
4. Seja prático e focado na sua especialidade`

    // Primeira análise com o assistente específico
    const initialResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: `${contextualPrompt}\n\nUsuário: ${message}`
        }
      ]
    })

    const gptResponse = initialResponse.content[0]?.type === 'text' ? initialResponse.content[0].text : ''

    // Verificar se precisa executar comando MCP
    let mcpResult = null
    try {
      const cleanResponse = gptResponse.replace(/```json\n?|\n?```/g, '').trim()
      const mcpRequest = JSON.parse(cleanResponse)
      if (mcpRequest.action === 'mcp_command') {
        mcpResult = await executeMCPCommand(
          mcpRequest.command, 
          mcpRequest.params, 
          session.user.id,
          session.user.companyId
        )
      }
    } catch (e) {
      // Detecção inteligente baseada na especialidade do assistente
      const messageLC = message.toLowerCase()
      
      // SOFIA - Especialista em Vendas
      if (assistant.name === 'SOFIA') {
        if (messageLC.includes('lead')) {
          mcpResult = await executeMCPCommand('get_leads', {}, session.user.id, session.user.companyId)
        } else if (messageLC.includes('oportunidade')) {
          mcpResult = await executeMCPCommand('get_daily_sales_opportunities', {}, session.user.id, session.user.companyId)
        } else if (messageLC.includes('quente')) {
          mcpResult = await executeMCPCommand('get_hot_leads', {}, session.user.id, session.user.companyId)
        }
      }
      // CARLOS - Especialista Financeiro
      else if (assistant.name === 'CARLOS') {
        if (messageLC.includes('pagamento') || messageLC.includes('financeiro')) {
          mcpResult = await executeMCPCommand('get_payments', {}, session.user.id, session.user.companyId)
        } else if (messageLC.includes('receita') || messageLC.includes('faturamento')) {
          const now = new Date()
          mcpResult = await executeMCPCommand('get_financial_summary', { 
            month: now.getMonth() + 1, 
            year: now.getFullYear() 
          }, session.user.id, session.user.companyId)
        }
      }
      // MARIA - Especialista em Contratos
      else if (assistant.name === 'MARIA') {
        if (messageLC.includes('contrato')) {
          mcpResult = await executeMCPCommand('get_contracts', {}, session.user.id, session.user.companyId)
        }
      }
      // PEDRO - Especialista em Propriedades
      else if (assistant.name === 'PEDRO') {
        if (messageLC.includes('propriedade') || messageLC.includes('imóv')) {
          mcpResult = await executeMCPCommand('get_properties', {}, session.user.id, session.user.companyId)
        }
      }
    }

    // Resposta final do assistente
    let finalResponse = gptResponse
    if (mcpResult) {
      const hasData = mcpResult.data && 
        ((Array.isArray(mcpResult.data) && mcpResult.data.length > 0) ||
         (typeof mcpResult.data === 'object' && Object.keys(mcpResult.data).length > 0))

      if (!hasData) {
        finalResponse = `🏠 **Dados Insuficientes** - Como ${assistant.role}, preciso que você cadastre mais dados no sistema para fornecer análises precisas sobre sua consulta.

💡 **Dica**: Cadastre informações em:
• **Propriedades** no módulo de Imóveis
• **Contratos** no módulo de Contratos  
• **Leads** na página de Leads
• **Pagamentos** registrados

Após cadastrar essas informações, poderei ajudar com insights valiosos específicos da minha área! 📊`
      } else {
        const analysisResponse = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2000,
          temperature: 0.3,
          messages: [
            {
              role: "user",
              content: `${contextualPrompt}

Pergunta: "${message}"

Dados obtidos:
${JSON.stringify(mcpResult.data, null, 2)}

Analise estes dados na sua área de especialidade e forneça insights valiosos.`
            }
          ]
        })

        finalResponse = analysisResponse.content[0]?.type === 'text' ? analysisResponse.content[0].text : 'Erro ao processar resposta'
      }
    }

    // Salvar mensagens na conversa
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        type: 'USER',
        content: message
      }
    })

    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        type: 'ASSISTANT',
        content: finalResponse,
        mcpData: mcpResult?.data ? JSON.stringify(mcpResult.data) : null,
        tokensUsed: (initialResponse.usage?.input_tokens || 0) + (initialResponse.usage?.output_tokens || 0)
      }
    })

    // Atualizar contexto do assistente
    if (assistant.contextFilePath) {
      const updatedContext = assistantContext + `\n\n### ${new Date().toISOString()}\n**Usuário**: ${message}\n**${assistant.name}**: ${finalResponse}\n`
      await updateAssistantContext(assistant.contextFilePath, updatedContext)
    }

    return NextResponse.json({ 
      response: finalResponse,
      mcpData: mcpResult?.data || null,
      assistant: {
        id: assistant.id,
        name: assistant.name,
        role: assistant.role
      },
      conversationId: conversation.id,
      success: true
    })

  } catch (error) {
    console.error('Erro na API AI Chat:', error)
    
    if (error instanceof Error && (error.message.includes('insufficient_quota') || error.message.includes('rate_limit'))) {
      return NextResponse.json({ 
        error: 'Créditos insuficientes na conta OpenAI ou limite de taxa excedido.',
        type: 'credits'
      }, { status: 402 })
    }

    return NextResponse.json({ 
      error: 'Erro ao processar mensagem. Tente novamente.',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}