'use client'

import React, { useState, useEffect, useRef } from 'react'

interface WhatsAppMessage {
  id: string
  content: string
  direction: 'sent' | 'received'
  timestamp: Date
  status: 'sent' | 'delivered' | 'read' | 'failed'
  type: 'text' | 'image' | 'document' | 'template'
}

interface WhatsAppSession {
  id: string
  leadName: string
  phoneNumber: string
  lastMessageAt: Date
  messageCount: number
  status: 'active' | 'expired' | 'closed'
  unreadCount?: number
}

interface WhatsAppTemplate {
  id: string
  name: string
  category: string
  language: string
  preview: string
}

interface WhatsAppPanelProps {
  leadId?: string
  onMessageSent?: () => void
}

export function WhatsAppPanel({ leadId, onMessageSent }: WhatsAppPanelProps) {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [selectedSession, setSelectedSession] = useState<WhatsAppSession | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [templateParams, setTemplateParams] = useState<Record<string, string>>({})
  const [isConfigured, setIsConfigured] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'templates' | 'stats' | 'config'>('chat')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkConfiguration()
    loadSessions()
    loadTemplates()
    loadStats()
  }, [])

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.id)
    }
  }, [selectedSession])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/whatsapp?action=config')
      const data = await response.json()
      setIsConfigured(data.data?.isConfigured || false)
    } catch (error) {
      console.error('Erro ao verificar configuração:', error)
    }
  }

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/whatsapp?action=sessions')
      const data = await response.json()
      if (data.success) {
        setSessions(data.data)
        if (data.data.length > 0 && !selectedSession) {
          setSelectedSession(data.data[0])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar sessões:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/whatsapp?action=messages&leadId=${sessionId}`)
      const data = await response.json()
      if (data.success) {
        // Converter atividades em mensagens para visualização
        const mockMessages: WhatsAppMessage[] = data.data.activities.map((activity: any) => ({
          id: activity.id,
          content: activity.description,
          direction: activity.activityType === 'whatsapp_sent' ? 'sent' : 'received',
          timestamp: new Date(activity.createdAt),
          status: 'delivered',
          type: 'text'
        }))
        setMessages(mockMessages)
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/whatsapp?action=templates')
      const data = await response.json()
      if (data.success) {
        const formattedTemplates = data.data.map((t: any) => ({
          id: t.id,
          name: t.name,
          category: t.category,
          language: t.language,
          preview: JSON.parse(t.components).find((c: any) => c.type === 'BODY')?.text || 'Template sem prévia'
        }))
        setTemplates(formattedTemplates)
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/whatsapp?action=stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          to: selectedSession.phoneNumber,
          type: 'text',
          text: { body: newMessage }
        })
      })

      const data = await response.json()
      if (data.success) {
        setNewMessage('')
        loadMessages(selectedSession.id)
        onMessageSent?.()
      } else {
        alert(`Erro ao enviar mensagem: ${data.error}`)
      }
    } catch (error) {
      alert('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const sendTemplate = async () => {
    if (!selectedTemplate || !selectedSession || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_template',
          to: selectedSession.phoneNumber,
          templateName: selectedTemplate,
          parameters: templateParams
        })
      })

      const data = await response.json()
      if (data.success) {
        setSelectedTemplate('')
        setTemplateParams({})
        loadMessages(selectedSession.id)
        onMessageSent?.()
      } else {
        alert(`Erro ao enviar template: ${data.error}`)
      }
    } catch (error) {
      alert('Erro ao enviar template')
    } finally {
      setSending(false)
    }
  }

  const setupDefaultTemplates = async () => {
    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup_defaults' })
      })

      const data = await response.json()
      if (data.success) {
        alert('Templates padrão criados com sucesso!')
        loadTemplates()
      } else {
        alert(`Erro ao criar templates: ${data.error}`)
      }
    } catch (error) {
      alert('Erro ao criar templates padrão')
    }
  }

  const sendAutomatedMessage = async (trigger: string) => {
    if (!selectedSession) return

    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_automated',
          leadId: selectedSession.id,
          trigger
        })
      })

      const data = await response.json()
      if (data.success) {
        loadMessages(selectedSession.id)
        onMessageSent?.()
      } else {
        alert(`Erro na automação: ${data.error}`)
      }
    } catch (error) {
      alert('Erro ao enviar mensagem automática')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return '✓'
      case 'delivered': return '✓✓'
      case 'read': return '✓✓'
      case 'failed': return '❌'
      default: return '⏳'
    }
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (!isConfigured) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">WhatsApp não configurado</h2>
          <p className="text-gray-600 mb-4">
            Configure as variáveis de ambiente do WhatsApp Business API para usar este recurso.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-left text-sm">
            <p className="font-medium mb-2">Variáveis necessárias:</p>
            <ul className="space-y-1 text-gray-600">
              <li>• WHATSAPP_PHONE_NUMBER_ID</li>
              <li>• WHATSAPP_ACCESS_TOKEN</li>
              <li>• WHATSAPP_WEBHOOK_SECRET</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando WhatsApp...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <span className="text-green-600 mr-2">📱</span>
            WhatsApp Business
          </h2>
          <div className="flex space-x-2">
            {['chat', 'templates', 'stats', 'config'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab === 'chat' && '💬'}
                {tab === 'templates' && '📋'}
                {tab === 'stats' && '📊'}
                {tab === 'config' && '⚙️'}
                {' '}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex h-96">
        {/* Sidebar - Sessões */}
        {activeTab === 'chat' && (
          <>
            <div className="w-80 border-r border-gray-200 bg-gray-50">
              <div className="p-3 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Conversas Ativas</h3>
              </div>
              <div className="overflow-y-auto h-full">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 ${
                      selectedSession?.id === session.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{session.leadName}</h4>
                        <p className="text-sm text-gray-600">{session.phoneNumber}</p>
                        <p className="text-xs text-gray-500">
                          {formatTime(session.lastMessageAt)} • {session.messageCount} mensagens
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className={`w-3 h-3 rounded-full ${
                          session.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        {session.unreadCount && session.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 mt-1">
                            {session.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    <p>Nenhuma conversa ativa</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedSession ? (
                <>
                  {/* Chat Header */}
                  <div className="p-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{selectedSession.leadName}</h3>
                        <p className="text-sm text-gray-600">{selectedSession.phoneNumber}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => sendAutomatedMessage('follow_up_geral')}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                        >
                          🤖 Follow-up
                        </button>
                        <button
                          onClick={() => sendAutomatedMessage('property_match')}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                        >
                          🏠 Imóvel
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.direction === 'sent' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.direction === 'sent'
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
                            message.direction === 'sent' ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            <span>{formatTime(message.timestamp)}</span>
                            {message.direction === 'sent' && (
                              <span className={message.status === 'read' ? 'text-blue-200' : ''}>
                                {getStatusIcon(message.status)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="space-y-3">
                      {/* Template Selection */}
                      <div className="flex space-x-2">
                        <select
                          value={selectedTemplate}
                          onChange={(e) => setSelectedTemplate(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Selecionar template...</option>
                          {templates.map(template => (
                            <option key={template.id} value={template.name}>
                              {template.name} - {template.preview.substring(0, 50)}...
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={sendTemplate}
                          disabled={!selectedTemplate || sending}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          📋 Enviar Template
                        </button>
                      </div>

                      {/* Text Message */}
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Digite sua mensagem..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          📎
                        </button>
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || sending}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {sending ? '⏳' : '📤'}
                        </button>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*,application/pdf,.doc,.docx"
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">💬</div>
                    <p>Selecione uma conversa para começar</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Templates WhatsApp</h3>
              <button
                onClick={setupDefaultTemplates}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                📋 Criar Templates Padrão
              </button>
            </div>
            <div className="space-y-4">
              {templates.map(template => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.preview}</p>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                      ✏️ Editar
                    </button>
                    <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">
                      🗑️ Excluir
                    </button>
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📋</div>
                  <p>Nenhum template configurado</p>
                  <p className="text-sm">Clique em "Criar Templates Padrão" para começar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="flex-1 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Estatísticas WhatsApp</h3>
            {stats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalMessages}</div>
                  <div className="text-sm text-gray-600">Total de Mensagens</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.sentMessages}</div>
                  <div className="text-sm text-gray-600">Mensagens Enviadas</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.receivedMessages}</div>
                  <div className="text-sm text-gray-600">Mensagens Recebidas</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.responseRate}%</div>
                  <div className="text-sm text-gray-600">Taxa de Resposta</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.activeSessions}</div>
                  <div className="text-sm text-gray-600">Sessões Ativas</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{stats.avgResponseTime}min</div>
                  <div className="text-sm text-gray-600">Tempo Médio de Resposta</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Carregando estatísticas...</p>
              </div>
            )}
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="flex-1 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Configuração WhatsApp</h3>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-green-600 mr-3">✅</div>
                  <div>
                    <h4 className="font-medium text-green-800">WhatsApp Configurado</h4>
                    <p className="text-sm text-green-600">
                      A integração com WhatsApp Business API está ativa e funcionando.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Recursos Disponíveis</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>✅ Envio de mensagens de texto</li>
                  <li>✅ Templates de mensagem</li>
                  <li>✅ Automação por triggers</li>
                  <li>✅ Estatísticas de conversas</li>
                  <li>✅ Webhook para recebimento</li>
                  <li>⏳ Envio de imagens/documentos</li>
                  <li>⏳ Bot de atendimento automático</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-yellow-600 mr-3">⚠️</div>
                  <div>
                    <h4 className="font-medium text-yellow-800">Importante</h4>
                    <p className="text-sm text-yellow-600">
                      Este é um ambiente de simulação. Em produção, configure as credenciais reais da Meta.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}