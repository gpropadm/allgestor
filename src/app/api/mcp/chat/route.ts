import { NextRequest, NextResponse } from 'next/server'
import { crmMCP } from '@/lib/mcp-server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Função para executar comandos MCP baseados na requisição do Claude
async function executeMCPCommand(command: string, params: any, userId: string): Promise<any> {
  try {
    switch (command) {
      case 'get_properties':
        return await crmMCP.getProperties({ ...params, userId })
      
      case 'get_property_analytics':
        return await crmMCP.getPropertyAnalytics(params.propertyId)
      
      case 'get_contracts':
        return await crmMCP.getContracts({ ...params, userId })
      
      case 'get_payments':
        // Converter status "overdue" para parâmetro overdue: true
        const paymentParams = { ...params, userId }
        if (params.status === 'overdue') {
          paymentParams.overdue = true
          delete paymentParams.status
        }
        return await crmMCP.getPayments(paymentParams)
      
      case 'get_financial_summary':
        return await crmMCP.getFinancialSummary(userId, params.month, params.year)
      
      case 'get_leads':
        return await crmMCP.getLeads({ ...params, userId })
      
      case 'find_property_matches':
        return await crmMCP.findPropertyMatches(params.leadId)
      
      case 'get_market_analysis':
        return await crmMCP.getMarketAnalysis(params.location, params.propertyType)
      
      default:
        return { success: false, error: `Comando MCP não reconhecido: ${command}` }
    }
  } catch (error) {
    return { success: false, error: `Erro ao executar comando MCP: ${error}` }
  }
}

// Sistema de prompt inteligente para análise de requisições
const SYSTEM_PROMPT = `Você é um assistente especialista em CRM imobiliário. Você tem acesso a um sistema MCP (Model Context Protocol) que conecta você aos dados do CRM.

COMANDOS MCP DISPONÍVEIS:
- get_properties: Buscar propriedades (filtros: available, type, city, minPrice, maxPrice)
- get_property_analytics: Análise de propriedade específica (propertyId)
- get_contracts: Buscar contratos (filtros: active, expiringSoon, propertyId)
- get_payments: Buscar pagamentos (filtros: status, overdue, contractId, fromDate, toDate)
- get_financial_summary: Resumo financeiro (month, year)
- get_leads: Buscar leads (filtros: status, budget, location)
- find_property_matches: Encontrar propriedades para um lead (leadId)
- get_market_analysis: Análise de mercado (location, propertyType)

INSTRUÇÕES:
1. Analise a pergunta do usuário e identifique quais dados são necessários
2. Use os comandos MCP apropriados para buscar os dados
3. Analise os dados retornados e forneça insights valiosos
4. Seja proativo em sugerir ações baseadas nos dados
5. Use linguagem natural e amigável

FORMATO DE RESPOSTA:
- Use Markdown para formatação
- Inclua emojis relevantes para melhor visualização
- Destaque informações importantes
- Forneça insights acionáveis
- Sugira próximos passos quando apropriado

Exemplo de análise:
"Com base nos dados do seu portfólio, identifiquei que você tem 3 propriedades com contratos vencendo em 30 dias. Sugiro entrar em contato com os inquilinos para renovação..."

IMPORTANTE: Quando identificar a necessidade de buscar dados, responda APENAS com um JSON válido no formato:
{
  "action": "mcp_command",
  "command": "nome_do_comando",
  "params": { "parametro": "valor" }
}

NUNCA inclua explicações, markdown, ou texto adicional. Apenas o JSON puro.
Caso contrário, responda normalmente analisando os dados fornecidos.`

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { message, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
    }

    // Primeiro, enviar para GPT para identificar se precisa buscar dados
    const initialResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1000,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Usuário perguntou: "${message}"\n\nContexto anterior: ${context || 'Nenhum'}\n\nAnálise: O que você precisa saber para responder esta pergunta?`
        }
      ]
    })

    const gptResponse = initialResponse.choices[0]?.message?.content || ''

    // Verificar se GPT quer executar um comando MCP ou detectar intenção
    let mcpResult = null
    try {
      // Limpar resposta GPT de markdown e espaços
      const cleanResponse = gptResponse.replace(/```json\n?|\n?```/g, '').trim()
      const mcpRequest = JSON.parse(cleanResponse)
      if (mcpRequest.action === 'mcp_command') {
        mcpResult = await executeMCPCommand(
          mcpRequest.command, 
          mcpRequest.params, 
          session.user.id
        )
      }
    } catch (e) {
      // Se não for JSON, usar detecção inteligente
      const messageLC = message.toLowerCase()
      
      if (messageLC.includes('pagamento') && (messageLC.includes('atraso') || messageLC.includes('vencido') || messageLC.includes('pendente'))) {
        mcpResult = await executeMCPCommand('get_payments', { overdue: true }, session.user.id)
      } else if (messageLC.includes('lead') && messageLC.includes('match')) {
        mcpResult = await executeMCPCommand('get_leads', {}, session.user.id)
        // Depois processar matches se houver leads
      } else if (messageLC.includes('propriedade') || messageLC.includes('portfólio') || messageLC.includes('imóv')) {
        mcpResult = await executeMCPCommand('get_properties', {}, session.user.id)
      } else if (messageLC.includes('contrato')) {
        mcpResult = await executeMCPCommand('get_contracts', {}, session.user.id)
      } else if (messageLC.includes('financeiro') || messageLC.includes('receita') || messageLC.includes('faturamento')) {
        const now = new Date()
        mcpResult = await executeMCPCommand('get_financial_summary', { 
          month: now.getMonth() + 1, 
          year: now.getFullYear() 
        }, session.user.id)
      }
    }

    // Se executou comando MCP, enviar dados para GPT para análise final
    let finalResponse = gptResponse
    if (mcpResult) {
      const analysisResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 2000,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: `Pergunta do usuário: "${message}"

Dados obtidos via MCP:
${JSON.stringify(mcpResult.data, null, 2)}

Por favor, analise estes dados e forneça uma resposta completa e útil para o usuário. Inclua insights, tendências e sugestões de ação quando apropriado.`
          }
        ]
      })

      finalResponse = analysisResponse.choices[0]?.message?.content || 'Erro ao processar resposta'
    }

    return NextResponse.json({ 
      response: finalResponse,
      mcpData: mcpResult?.data || null,
      success: true
    })

  } catch (error) {
    console.error('Erro na API MCP Chat:', error)
    
    if (error instanceof Error && (error.message.includes('insufficient_quota') || error.message.includes('rate_limit'))) {
      return NextResponse.json({ 
        error: 'Créditos insuficientes na conta OpenAI ou limite de taxa excedido. Verifique sua conta.',
        type: 'credits'
      }, { status: 402 })
    }

    return NextResponse.json({ 
      error: 'Erro ao processar mensagem. Tente novamente.',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}