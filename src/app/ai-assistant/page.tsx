'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { SofiaAvatar } from '@/components/sofia-avatar'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  mcpData?: any
}

export default function AIAssistant() {
  const { data: session, status } = useSession()
  const [companyName, setCompanyName] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: '🏠 Olá! Sou seu assistente inteligente do CRM Imobiliário. Posso ajudar você a:\n\n• 📊 **Analisar seu portfólio** de propriedades\n• 💰 **Acompanhar pagamentos** e inadimplência\n• 🎯 **Encontrar matches** para seus leads\n• 📈 **Análises de mercado** em tempo real\n• 📋 **Gerenciar contratos** e vencimentos\n\nO que você gostaria de saber hoje?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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
    }
  }, [session])

  const fetchCompanyName = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const companies = await response.json()
        if (companies.length > 0) {
          setCompanyName(companies[0].name)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar nome da empresa:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    
    // Auto-resize
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px'
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return
    
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
      const response = await fetch('/api/mcp/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage.content,
          context: messages.slice(-3).map(m => `${m.type}: ${m.content}`).join('\n')
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao enviar mensagem')
      }

      const data = await response.json()
      
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
        content: `❌ **Erro**: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nTente uma pergunta mais simples ou verifique sua conexão.`,
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
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: '🤖 Olá! Sou a **SOFIA**, sua assistente inteligente de vendas! Posso ajudar você a:\n\n• 📊 **Analisar leads quentes** e prioridades\n• 💰 **Identificar oportunidades** de R$ 7,95M em vendas\n• 🎯 **Encontrar matches perfeitos** para compradores\n• 📈 **Gerar argumentos personalizados** de venda\n• 🚀 **Acelerar fechamentos** com insights inteligentes\n\n**Tenho 6 leads de compra esperando sua atenção!**\n\nO que você gostaria de saber hoje?',
        timestamp: new Date()
      }
    ])
  }

  const formatMessage = (content: string) => {
    // Converter markdown básico para HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/•/g, '•')
      .replace(/\n/g, '<br>')
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

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SofiaAvatar size="sm" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              SOFIA - Assistente IA {companyName && `| ${companyName}`}
            </h1>
            <p className="text-xs text-gray-500">SOFIA - Sistema Otimizado de Fechamento Imobiliário Avançado</p>
          </div>
        </div>
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
                  <SofiaAvatar size="sm" className="flex-shrink-0" />
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
                <SofiaAvatar size="sm" className="flex-shrink-0" />
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-700">SOFIA analisando suas oportunidades...</span>
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
                placeholder="Pergunte sobre suas propriedades, pagamentos, leads..."
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