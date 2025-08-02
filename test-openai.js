require('dotenv').config({ path: '.env.local' })
const OpenAI = require('openai')

async function testOpenAI() {
  try {
    console.log('🤖 Testando OpenAI API...')
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    console.log('🔑 API Key configurada:', process.env.OPENAI_API_KEY ? 'Sim' : 'Não')
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 100,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: "Olá! Você está funcionando? Responda em português."
        }
      ]
    })
    
    console.log('✅ Resposta do GPT:', response.choices[0]?.message?.content)
    
    // Testar também o gpt-3.5-turbo como backup
    console.log('\n🔄 Testando modelo alternativo...')
    const backupResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      max_tokens: 50,
      messages: [
        {
          role: "user", 
          content: "Teste rápido"
        }
      ]
    })
    
    console.log('✅ Backup GPT-3.5:', backupResponse.choices[0]?.message?.content)
    
  } catch (error) {
    console.error('❌ Erro ao testar OpenAI:')
    console.error('Tipo:', error.constructor.name)
    console.error('Mensagem:', error.message)
    
    if (error.status) {
      console.error('Status HTTP:', error.status)
    }
    
    if (error.code) {
      console.error('Código:', error.code)
    }
  }
}

testOpenAI()