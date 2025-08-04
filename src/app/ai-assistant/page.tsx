'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useSearchParams } from 'next/navigation'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  mcpData?: any
}

interface AIAssistant {
  id: string
  name: string
  role: string
  personality: string
  speciality: string
  isPrimary: boolean
  avatarUrl?: string
}

function AIAssistantContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [companyName, setCompanyName] = useState('')
  const [currentAssistant, setCurrentAssistant] = useState<AIAssistant | null>(null)
  const [availableAssistants, setAvailableAssistants] = useState<AIAssistant[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showAssistants, setShowAssistants] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (session?.user?.companyId) {
      fetchCompanyName()
      loadAssistants()
    }
  }, [session])

  useEffect(() => {
    const assistantId = searchParams.get('assistant')
    if (assistantId && availableAssistants.length > 0) {
      const assistant = availableAssistants.find(a => a.id === assistantId)
      if (assistant) {
        switchAssistant(assistant)
      }
    }
  }, [searchParams, availableAssistants])

  const fetchCompanyName = async () => {
    try {
      const response = await fetch('/api/users/profile')
      if (response.ok) {
        const userProfile = await response.json()
        if (userProfile.company && userProfile.company.name) {
          setCompanyName(userProfile.company.name)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar nome da empresa:', error)
    }
  }

  const loadAssistants = async () => {
    try {
      const response = await fetch('/api/ai-assistants')
      if (response.ok) {
        const data = await response.json()
        const assistants = data.assistants || []
        setAvailableAssistants(assistants)
        
        // Se não tem assistente selecionado, usar o primário
        if (!currentAssistant && assistants.length > 0) {
          const primary = assistants.find((a: AIAssistant) => a.isPrimary) || assistants[0]
          switchAssistant(primary)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar assistentes:', error)
    }
  }

  const switchAssistant = (assistant: AIAssistant) => {
    setCurrentAssistant(assistant)
    setConversationId(null) // Reset conversation
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: getWelcomeMessage(assistant),
        timestamp: new Date()
      }
    ])
    setShowAssistants(false)
  }

  const getWelcomeMessage = (assistant: AIAssistant) => {
    const welcomeMessages: Record<string, string> = {
      'SOFIA': `💼 Olá! Sou **SOFIA**, sua especialista em vendas! Posso ajudar você a:

• 🎯 **Analisar leads quentes** e prioridades
• 💰 **Identificar oportunidades** de alto valor
• 🔍 **Encontrar matches perfeitos** para compradores
• 📈 **Gerar argumentos personalizados** de venda
• 🚀 **Acelerar fechamentos** com insights inteligentes

**Como ${assistant.role}, estou focada em converter leads em vendas!**

O que você gostaria de saber sobre suas oportunidades hoje?`,

      'CARLOS': `💰 Olá! Sou **CARLOS**, seu CFO Virtual! Posso ajudar você a:

• 📊 **Analisar fluxo de caixa** e inadimplência
• 💳 **Monitorar pagamentos** e vencimentos
• 📈 **Gerar relatórios financeiros** precisos
• ⚠️ **Identificar riscos** financeiros
• 💡 **Otimizar cobrança** e recebimentos

**Como ${assistant.role}, mantenho suas finanças sempre organizadas!**

Que análise financeira você precisa hoje?`,

      'MARIA': `📋 Olá! Sou **MARIA**, sua Gerente Jurídica! Posso ajudar você a:

• ⏰ **Monitorar vencimentos** de contratos
• 🔄 **Gerenciar renovações** e reajustes
• ⚖️ **Verificar cláusulas** importantes
• 🚨 **Alertar sobre prazos** críticos
• 📝 **Garantir conformidade** legal

**Como ${assistant.role}, nunca deixo prazos passarem!**

Que contratos você precisa que eu analise hoje?`,

      'PEDRO': `🏠 Olá! Sou **PEDRO**, seu Gerente de Portfólio! Posso ajudar você a:

• 🔍 **Monitorar todas as propriedades**
• 🔧 **Gerenciar manutenções** e melhorias
• 📊 **Otimizar ocupação** e disponibilidade
• 💡 **Identificar oportunidades** de valorização
• ✨ **Manter qualidade** do portfólio

**Como ${assistant.role}, conheço cada imóvel pessoalmente!**

Que propriedades você quer que eu analise hoje?`,

      'ALEX': `👑 Olá! Sou **ALEX**, seu CEO Virtual! Posso ajudar você a:

• 🎯 **Coordenar todos os assistentes** (SOFIA, CARLOS, MARIA, PEDRO)
• 📈 **Fornecer visão estratégica** do negócio
• 💡 **Tomar decisões executivas** baseadas em dados
• 🔍 **Identificar tendências** e oportunidades
• 🚀 **Otimizar a operação** como um todo

**Como ${assistant.role}, orquestro toda sua operação imobiliária!**

Que análise estratégica você precisa hoje?`
    }

    return welcomeMessages[assistant.name] || `🤖 Olá! Sou **${assistant.name}**, ${assistant.role}. Como posso ajudar você hoje?`
  }

  const getAssistantIcon = (name: string) => {
    const icons: Record<string, string> = {
      'SOFIA': '💼',
      'CARLOS': '💰',
      'MARIA': '📋',
      'PEDRO': '🏠',
      'ALEX': '👑'
    }
    return icons[name] || '🤖'
  }

  const getAssistantColor = (name: string) => {
    const colors: Record<string, string> = {
      'SOFIA': 'from-pink-500 to-rose-500',
      'CARLOS': 'from-green-500 to-emerald-500',
      'MARIA': 'from-blue-500 to-indigo-500',
      'PEDRO': 'from-orange-500 to-amber-500',
      'ALEX': 'from-purple-500 to-violet-500'
    }
    return colors[name] || 'from-gray-500 to-gray-600'
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    
    // Auto-resize
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px'
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !currentAssistant) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage.content,
          assistantId: currentAssistant.id,
          conversationId: conversationId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao enviar mensagem')
      }

      const data = await response.json()
      
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        mcpData: data.mcpData,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
    } catch (error) {
      console.error('Erro:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `❌ **Erro**: ${error instanceof Error ? error.message : 'Erro desconhecido'}\\n\\nTente uma pergunta mais simples ou verifique sua conexão.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
    
    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const newConversation = () => {
    if (currentAssistant) {
      setConversationId(null)
      setMessages([
        {
          id: '1',
          type: 'assistant',
          content: getWelcomeMessage(currentAssistant),
          timestamp: new Date()
        }
      ])
    }
  }

  const formatMessage = (content: string) => {
    return content
      .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
      .replace(/\\*(.*?)\\*/g, '<em>$1</em>')
      .replace(/•/g, '•')
      .replace(/\\n/g, '<br>')
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    redirect('/login')
  }

  if (!currentAssistant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando assistente...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between relative">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-gradient-to-r ${getAssistantColor(currentAssistant.name)} rounded-full flex items-center justify-center text-white text-lg font-bold`}>
            {getAssistantIcon(currentAssistant.name)}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentAssistant.name} - {currentAssistant.role} {companyName && `| ${companyName}`}
            </h1>
            <p className="text-xs text-gray-500">{currentAssistant.speciality}</p>
          </div>
          <button
            onClick={() => setShowAssistants(!showAssistants)}
            className="ml-4 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
          >
            Trocar ↕️
          </button>
        </div>
        
        {/* Dropdown de Assistentes */}
        {showAssistants && (
          <div className="absolute top-full left-6 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[300px]">
            <div className="p-2">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Escolher Assistente:</h3>
              {availableAssistants.map((assistant) => (
                <button
                  key={assistant.id}
                  onClick={() => switchAssistant(assistant)}
                  className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                    currentAssistant.id === assistant.id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 bg-gradient-to-r ${getAssistantColor(assistant.name)} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                      {getAssistantIcon(assistant.name)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{assistant.name}</div>
                      <div className="text-xs text-gray-600">{assistant.role}</div>
                    </div>
                    {assistant.isPrimary && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Principal</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Voltar
          </button>
          <button 
            onClick={newConversation}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Nova Conversa
          </button>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="message-fade-in">
              {message.type === 'assistant' ? (
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 bg-gradient-to-r ${getAssistantColor(currentAssistant.name)} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {getAssistantIcon(currentAssistant.name)}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3">
                      <div 
                        className="text-gray-900 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                      />
                      {message.mcpData && (
                        <details className="mt-3 text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            📊 Dados utilizados
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(message.mcpData, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-4">
                      {message.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-3 justify-end">
                  <div className="flex-1 max-w-2xl">
                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-md px-4 py-3">
                      <p>{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 mr-4 text-right">
                      {message.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 text-sm font-medium">👤</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="message-fade-in">
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 bg-gradient-to-r ${getAssistantColor(currentAssistant.name)} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {getAssistantIcon(currentAssistant.name)}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-700">{currentAssistant.name} analisando...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea 
                ref={textareaRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Pergunte para ${currentAssistant.name} sobre ${currentAssistant.speciality.toLowerCase()}...`}
                className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button 
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 px-4">
            Enter para enviar • Shift+Enter para nova linha
          </p>
        </div>
      </div>

      <style jsx global>{`
        .message-fade-in {
          animation: fadeInUp 0.3s ease-out;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default function AIAssistant() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando assistente...</p>
        </div>
      </div>
    }>
      <AIAssistantContent />
    </Suspense>
  )
}