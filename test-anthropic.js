require('dotenv').config({ path: '.env.local' })
const Anthropic = require('@anthropic-ai/sdk')

async function testAnthropicAPI() {
  try {
    console.log('🤖 Testando API do Anthropic...')
    
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
    
    console.log('🔑 API Key configurada:', process.env.ANTHROPIC_API_KEY ? 'Sim' : 'Não')
    
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 100,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: "Olá, você está funcionando?"
        }
      ]
    })
    
    console.log('✅ Resposta do Claude:', response.content[0]?.text)
    
  } catch (error) {
    console.error('❌ Erro ao testar API Anthropic:')
    console.error('Tipo:', error.constructor.name)
    console.error('Mensagem:', error.message)
    
    if (error.status) {
      console.error('Status HTTP:', error.status)
    }
    
    if (error.error?.type) {
      console.error('Tipo do erro:', error.error.type)
    }
  }
}

testAnthropicAPI()