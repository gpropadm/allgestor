require('dotenv').config({ path: '.env.local' })
const OpenAI = require('openai')

async function testMainAPI() {
  try {
    console.log('🧪 Testando API principal diretamente...')
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    // Simular o sistema prompt
    const SYSTEM_PROMPT = `Você é um assistente especialista em CRM imobiliário. Você tem acesso a um sistema MCP (Model Context Protocol) que conecta você aos dados do CRM.

COMANDOS MCP DISPONÍVEIS:
- get_payments: Buscar pagamentos (filtros: status, overdue, contractId, fromDate, toDate)

INSTRUÇÕES:
1. Analise a pergunta do usuário e identifique quais dados são necessários
2. Use os comandos MCP apropriados para buscar os dados
3. Analise os dados retornados e forneça insights valiosos

IMPORTANTE: Quando identificar a necessidade de buscar dados, responda APENAS com um JSON no formato:
{
  "action": "mcp_command",
  "command": "nome_do_comando",
  "params": { "parametro": "valor" }
}

Caso contrário, responda normalmente analisando os dados fornecidos.`

    // Testar primeira etapa
    console.log('1️⃣ Primeira chamada - identificar comando...')
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
          content: `Usuário perguntou: "quais pagamentos estão em atraso?"\n\nContexto anterior: Nenhum\n\nAnálise: O que você precisa saber para responder esta pergunta?`
        }
      ]
    })

    const gptResponse = initialResponse.choices[0]?.message?.content || ''
    console.log('📝 Resposta GPT:', gptResponse)
    
    // Verificar se retornou JSON
    try {
      const mcpRequest = JSON.parse(gptResponse)
      console.log('✅ JSON detectado:', mcpRequest)
      
      if (mcpRequest.action === 'mcp_command') {
        console.log('🎯 Comando MCP identificado:', mcpRequest.command)
        console.log('🔧 Parâmetros:', mcpRequest.params)
      }
    } catch (e) {
      console.log('❌ Não é JSON válido, GPT respondeu diretamente')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

testMainAPI()