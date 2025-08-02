'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface UserStatus {
  authenticated: boolean
  user?: {
    id: string
    email: string
    name: string
    role: string
    isActive: boolean
    isBlocked: boolean
    lastLogin: string | null
  }
  company?: {
    id: string
    name: string
    tradeName: string
    document: string
    active: boolean
  } | null
  session?: {
    companyId?: string
    role?: string
  }
  issues?: Array<{
    type: string
    message: string
    severity: string
    solution: string
  }>
}

interface SystemStatus {
  summary: {
    totalUsers: number
    usersWithCompany: number
    usersWithoutCompany: number
    totalCompanies: number
  }
  issues: {
    usersWithoutCompany: Array<{
      email: string
      name: string
      role: string
    }>
  }
  recommendations: string[]
}

export default function DebugAuthPage() {
  const { data: session, status } = useSession()
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [fixing, setFixing] = useState(false)
  const [fixResult, setFixResult] = useState<string | null>(null)

  useEffect(() => {
    fetchStatuses()
  }, [session])

  const fetchStatuses = async () => {
    setLoading(true)
    try {
      // Fetch user status
      const userResponse = await fetch('/api/user-status')
      const userData = await userResponse.json()
      setUserStatus(userData)

      // Fetch system status
      const systemResponse = await fetch('/api/debug-user-company')
      const systemData = await systemResponse.json()
      setSystemStatus(systemData)
    } catch (error) {
      console.error('Error fetching statuses:', error)
    }
    setLoading(false)
  }

  const fixUserCompany = async () => {
    setFixing(true)
    setFixResult(null)
    try {
      const response = await fetch('/api/fix-user-company', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setFixResult(`✅ Sucesso: ${data.message}. ${data.fixed} usuário(s) corrigido(s).`)
        // Refresh statuses
        await fetchStatuses()
      } else {
        setFixResult(`❌ Erro: ${data.error}`)
      }
    } catch (error) {
      setFixResult(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
    setFixing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando diagnóstico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔍 Diagnóstico de Autenticação
        </h1>

        {/* Session Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status da Sessão</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Status NextAuth:</strong> {status}
            </div>
            <div>
              <strong>Usuário:</strong> {session?.user?.email || 'Não autenticado'}
            </div>
            <div>
              <strong>Role:</strong> {session?.user?.role || 'N/A'}
            </div>
            <div>
              <strong>Company ID:</strong> {session?.user?.companyId || 'Não definido'}
            </div>
          </div>
        </div>

        {/* User Status */}
        {userStatus && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Status do Usuário</h2>
            
            {userStatus.authenticated ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>Email:</strong> {userStatus.user?.email}
                  </div>
                  <div>
                    <strong>Nome:</strong> {userStatus.user?.name}
                  </div>
                  <div>
                    <strong>Role:</strong> {userStatus.user?.role}
                  </div>
                  <div>
                    <strong>Ativo:</strong> {userStatus.user?.isActive ? '✅' : '❌'}
                  </div>
                  <div>
                    <strong>Bloqueado:</strong> {userStatus.user?.isBlocked ? '❌' : '✅'}
                  </div>
                  <div>
                    <strong>Último Login:</strong> {userStatus.user?.lastLogin ? new Date(userStatus.user.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
                  </div>
                </div>

                {userStatus.company ? (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-800">✅ Empresa Associada</h3>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><strong>Nome:</strong> {userStatus.company.name}</div>
                      <div><strong>Nome Fantasia:</strong> {userStatus.company.tradeName}</div>
                      <div><strong>CNPJ:</strong> {userStatus.company.document}</div>
                      <div><strong>Ativa:</strong> {userStatus.company.active ? '✅' : '❌'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg">
                    <h3 className="font-semibold text-red-800">❌ Nenhuma Empresa Associada</h3>
                    <p className="text-sm text-red-600 mt-1">
                      Este usuário não está associado a uma empresa.
                    </p>
                  </div>
                )}

                {userStatus.issues && userStatus.issues.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-orange-800 mb-2">⚠️ Problemas Identificados</h3>
                    <div className="space-y-2">
                      {userStatus.issues.map((issue, idx) => (
                        <div key={idx} className={`p-3 rounded-lg ${
                          issue.severity === 'CRITICAL' ? 'bg-red-50 border-red-200' :
                          issue.severity === 'HIGH' ? 'bg-orange-50 border-orange-200' :
                          'bg-yellow-50 border-yellow-200'
                        } border`}>
                          <div className="font-medium">{issue.message}</div>
                          <div className="text-sm text-gray-600">{issue.solution}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600">❌ Usuário não autenticado</div>
            )}
          </div>
        )}

        {/* System Status */}
        {systemStatus && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Status do Sistema</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{systemStatus.summary.totalUsers}</div>
                <div className="text-sm text-blue-600">Total de Usuários</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{systemStatus.summary.usersWithCompany}</div>
                <div className="text-sm text-green-600">Com Empresa</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{systemStatus.summary.usersWithoutCompany}</div>
                <div className="text-sm text-red-600">Sem Empresa</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{systemStatus.summary.totalCompanies}</div>
                <div className="text-sm text-purple-600">Empresas</div>
              </div>
            </div>

            {systemStatus.issues.usersWithoutCompany.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">❌ Usuários sem Empresa</h3>
                <div className="space-y-1">
                  {systemStatus.issues.usersWithoutCompany.map((user, idx) => (
                    <div key={idx} className="text-sm">
                      {user.email} ({user.name}) - {user.role}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {systemStatus.recommendations.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">💡 Recomendações</h3>
                <ul className="text-sm space-y-1">
                  {systemStatus.recommendations.map((rec, idx) => (
                    <li key={idx}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Fix Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Ações de Correção</h2>
          
          <div className="space-y-4">
            <div>
              <button
                onClick={fixUserCompany}
                disabled={fixing}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fixing ? 'Corrigindo...' : '🔧 Corrigir Associações Usuário-Empresa'}
              </button>
              <p className="text-sm text-gray-600 mt-1">
                Associa automaticamente usuários sem empresa a uma empresa padrão.
              </p>
            </div>

            <div>
              <button
                onClick={fetchStatuses}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                🔄 Atualizar Diagnóstico
              </button>
              <p className="text-sm text-gray-600 mt-1">
                Recarrega todos os dados de diagnóstico.
              </p>
            </div>

            {fixResult && (
              <div className={`p-3 rounded-lg ${
                fixResult.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {fixResult}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}