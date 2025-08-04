'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

interface AIAssistant {
  id: string
  name: string
  role: string
  personality: string
  speciality: string
  systemPrompt: string
  isActive: boolean
  isPrimary: boolean
  avatarUrl?: string
  createdAt: string
}

export default function AIAssistantsPage() {
  const { data: session, status } = useSession()
  const [assistants, setAssistants] = useState<AIAssistant[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (session) {
      loadAssistants()
    }
  }, [session])

  const loadAssistants = async () => {
    try {
      const response = await fetch('/api/ai-assistants')
      if (response.ok) {
        const data = await response.json()
        setAssistants(data.assistants || [])
      }
    } catch (error) {
      console.error('Erro ao carregar assistentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultAssistants = async () => {
    setCreating(true)
    try {
      const response = await fetch('/api/ai-assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAssistants(data.assistants || [])
        alert('Assistentes criados com sucesso!')
      } else {
        const error = await response.json()
        alert(error.message || 'Erro ao criar assistentes')
      }
    } catch (error) {
      console.error('Erro ao criar assistentes:', error)
      alert('Erro ao criar assistentes')
    } finally {
      setCreating(false)
    }
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
      'SOFIA': 'bg-pink-500',
      'CARLOS': 'bg-green-500',
      'MARIA': 'bg-blue-500',
      'PEDRO': 'bg-orange-500',
      'ALEX': 'bg-purple-500'
    }
    return colors[name] || 'bg-gray-500'
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🤖 Assistentes IA</h1>
              <p className="mt-2 text-gray-600">
                Gerencie sua equipe virtual de assistentes especializados
              </p>
            </div>
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Voltar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Carregando assistentes...</span>
          </div>
        ) : assistants.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum assistente configurado
              </h3>
              <p className="text-gray-600 mb-6">
                Crie seus assistentes IA especializados para começar a usar o sistema inteligente
              </p>
            </div>
            <button
              onClick={createDefaultAssistants}
              disabled={creating}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {creating ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando Assistentes...
                </>
              ) : (
                <>
                  ✨ Criar Assistentes Padrão
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assistants
              .sort((a, b) => {
                if (a.isPrimary && !b.isPrimary) return -1
                if (!a.isPrimary && b.isPrimary) return 1
                return a.name.localeCompare(b.name)
              })
              .map((assistant) => (
                <div
                  key={assistant.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 ${getAssistantColor(assistant.name)} rounded-full flex items-center justify-center text-white text-xl font-bold`}>
                          {getAssistantIcon(assistant.name)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            {assistant.name}
                            {assistant.isPrimary && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                👑 Principal
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">{assistant.role}</p>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${assistant.isActive ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                    </div>

                    {/* Especialidade */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Especialidade:</strong>
                      </p>
                      <p className="text-sm text-gray-800">{assistant.speciality}</p>
                    </div>

                    {/* Personalidade */}
                    <div className="mb-6">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Personalidade:</strong>
                      </p>
                      <p className="text-sm text-gray-800">{assistant.personality}</p>
                    </div>

                    {/* Ações */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.location.href = `/ai-assistant?assistant=${assistant.id}`}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        💬 Conversar
                      </button>
                      <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                        ⚙️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Sistema de Sub-Agentes Info */}
        {assistants.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🧠 Sistema de Sub-Agentes Ativo
              </h2>
              <p className="text-gray-700 mb-6 max-w-3xl mx-auto">
                Seu sistema inteligente está operacional! Cada assistente tem personalidade única, 
                memória preservada em arquivos .MD e especialização específica. Use-os individualmente 
                ou deixe o ALEX coordenar toda a operação.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/50 rounded-lg p-4">
                  <div className="text-2xl mb-2">📝</div>
                  <h3 className="font-semibold mb-1">Contexto Preservado</h3>
                  <p className="text-gray-600">Cada conversa é salva em arquivos .MD individuais</p>
                </div>
                <div className="bg-white/50 rounded-lg p-4">
                  <div className="text-2xl mb-2">🎯</div>
                  <h3 className="font-semibold mb-1">Especialização</h3>
                  <p className="text-gray-600">Cada assistente tem conhecimento específico da área</p>
                </div>
                <div className="bg-white/50 rounded-lg p-4">
                  <div className="text-2xl mb-2">🤝</div>
                  <h3 className="font-semibold mb-1">Coordenação</h3>
                  <p className="text-gray-600">ALEX orquestra toda a equipe quando necessário</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}