import { NextRequest, NextResponse } from 'next/server'
import { crmMCP } from '@/lib/mcp-server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Função para executar comandos MCP baseados na requisição do Claude
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
        // Converter status "overdue" para parâmetro overdue: true
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

// Sistema de prompt restritivo para SOFIA - CRM Imobiliário
const SYSTEM_PROMPT = `Você é SOFIA, assistente especializada EXCLUSIVAMENTE em CRM imobiliário. Você APENAS responde perguntas relacionadas aos dados das seguintes tabelas do CRM:

📊 **DADOS DISPONÍVEIS NO CRM:**
- **Propriedades**: imóveis, portfólio, disponibilidade, preços
- **Contratos**: locações, renovações, vencimentos  
- **Pagamentos**: recebimentos, inadimplência, boletos
- **Leads**: prospects, interessados em imóveis
- **Proprietários**: donos dos imóveis
- **Inquilinos**: locatários atuais
- **Análises Financeiras**: receitas, despesas, relatórios

🚫 **RESTRIÇÕES IMPORTANTES:**
1. **NÃO responda perguntas fora do contexto imobiliário/CRM**
2. **NÃO forneça informações gerais, receitas, piadas, ou assuntos não relacionados**
3. **SE não houver dados suficientes nas tabelas, informe claramente**
4. **SEMPRE base suas respostas nos dados reais do sistema**

⚠️ **QUANDO NÃO HÁ DADOS SUFICIENTES, responda:**
"🏠 **Dados Insuficientes** - Para fornecer uma análise precisa sobre [tópico], preciso que você cadastre mais dados no sistema:
• Propriedades no módulo de Imóveis
• Contratos no módulo de Contratos  
• Leads na página de Leads
• Pagamentos registrados

Cadastre essas informações primeiro para eu poder ajudar com insights valiosos! 📊"

⚠️ **PARA PERGUNTAS FORA DO CONTEXTO, responda:**
"🤖 Sou SOFIA, especialista em CRM imobiliário. Só posso ajudar com:
• 📊 Análise de propriedades e portfólio
• 💰 Controle de pagamentos e inadimplência  
• 🎯 Gestão de leads e oportunidades
• 📈 Relatórios financeiros imobiliários
• 📋 Contratos e renovações

Para outras questões, consulte outros recursos. Como posso ajudar com seu CRM imobiliário?"

COMANDOS MCP DISPONÍVEIS:
- get_properties, get_contracts, get_payments, get_leads
- get_financial_summary, get_hot_leads, find_property_matches
- get_property_analytics, get_market_analysis, get_sales_arguments

IMPORTANTE: Quando identificar necessidade de dados, responda APENAS com JSON:
{"action": "mcp_command", "command": "nome_comando", "params": {}}

Caso contrário, analise os dados fornecidos ou informe sobre dados insuficientes.`

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.companyId) {
      return NextResponse.json({ error: 'Não autorizado ou sem empresa associada' }, { status: 401 })
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
          session.user.id,
          session.user.companyId
        )
      }
    } catch (e) {
      // Se não for JSON, usar detecção inteligente
      const messageLC = message.toLowerCase()
      
      if (messageLC.includes('pagamento') && (messageLC.includes('atraso') || messageLC.includes('vencido') || messageLC.includes('pendente'))) {
        mcpResult = await executeMCPCommand('get_payments', { overdue: true }, session.user.id, session.user.companyId)
      } else if (messageLC.includes('lead') && messageLC.includes('match')) {
        mcpResult = await executeMCPCommand('get_leads', {}, session.user.id, session.user.companyId)
        // Depois processar matches se houver leads
      } else if (messageLC.includes('propriedade') || messageLC.includes('portfólio') || messageLC.includes('imóv')) {
        mcpResult = await executeMCPCommand('get_properties', {}, session.user.id, session.user.companyId)
      } else if (messageLC.includes('contrato')) {
        mcpResult = await executeMCPCommand('get_contracts', {}, session.user.id, session.user.companyId)
      } else if (messageLC.includes('financeiro') || messageLC.includes('receita') || messageLC.includes('faturamento')) {
        const now = new Date()
        mcpResult = await executeMCPCommand('get_financial_summary', { 
          month: now.getMonth() + 1, 
          year: now.getFullYear() 
        }, session.user.id, session.user.companyId)
      } else if (messageLC.includes('leads quentes') || messageLC.includes('prioridade') || messageLC.includes('urgente')) {
        mcpResult = await executeMCPCommand('get_hot_leads', {}, session.user.id, session.user.companyId)
      } else if (messageLC.includes('oportunidade') || messageLC.includes('vendas hoje') || messageLC.includes('ações do dia')) {
        mcpResult = await executeMCPCommand('get_daily_sales_opportunities', {}, session.user.id, session.user.companyId)
      } else if (messageLC.includes('argumento') || messageLC.includes('como convencer') || messageLC.includes('pitch')) {
        // Para argumentos de venda, precisaria de leadId e propertyId específicos
        // Por enquanto, vamos buscar leads quentes como alternativa
        mcpResult = await executeMCPCommand('get_hot_leads', {}, session.user.id, session.user.companyId)
      }
    }

    // Se executou comando MCP, enviar dados para GPT para análise final
    let finalResponse = gptResponse
    if (mcpResult) {
      // Verificar se há dados suficientes
      const hasData = mcpResult.data && 
        ((Array.isArray(mcpResult.data) && mcpResult.data.length > 0) ||
         (typeof mcpResult.data === 'object' && Object.keys(mcpResult.data).length > 0))

      if (!hasData) {
        // Resposta padrão quando não há dados
        finalResponse = `🏠 **Dados Insuficientes** - Para fornecer uma análise precisa sobre sua consulta, preciso que você cadastre mais dados no sistema:

• **Propriedades** no módulo de Imóveis
• **Contratos** no módulo de Contratos  
• **Leads** na página de Leads
• **Pagamentos** registrados

Cadastre essas informações primeiro para eu poder ajudar com insights valiosos! 📊

💡 **Dica**: Comece cadastrando algumas propriedades e leads para ver análises detalhadas.`
      } else {
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

IMPORTANTE: Se os dados estiverem vazios ou insuficientes, informe que precisa de mais dados cadastrados no sistema. Caso contrário, analise estes dados e forneça uma resposta completa e útil. Inclua insights, tendências e sugestões de ação quando apropriado.`
            }
          ]
        })

        finalResponse = analysisResponse.choices[0]?.message?.content || 'Erro ao processar resposta'
      }
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