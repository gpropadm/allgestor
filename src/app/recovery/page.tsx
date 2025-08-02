'use client'

import { useState, useEffect } from 'react'

interface Owner {
  id: string
  name: string
  email: string
  phone: string
  document: string
  address: string
  city: string
  state: string
  zipCode: string
  userId: string
  companyId: string
  bankAccounts: any[]
  properties: any[]
  createdAt: string
}

interface RecoveryData {
  success: boolean
  message?: string
  dbStatus: string
  counts: {
    users: number
    owners: number
    bankAccounts: number
  }
  owners: Owner[]
  timestamp: string
  error?: string
  details?: string
}

export default function Recovery() {
  const [data, setData] = useState<RecoveryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRecoveryData()
  }, [])

  const fetchRecoveryData = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('🔄 Fetching recovery data...')
      const response = await fetch('/api/recovery', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      
      const result = await response.json()
      console.log('📊 Recovery result:', result)
      
      if (response.ok && result.success) {
        setData(result)
      } else {
        setError(result.error || `HTTP ${response.status}: ${result.details || 'Unknown error'}`)
      }
      
    } catch (err) {
      console.error('❌ Recovery fetch error:', err)
      setError('Erro de conexão: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Recuperando dados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-800 mb-4">❌ Erro na Recuperação</h1>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={fetchRecoveryData}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-yellow-800 mb-4">⚠️ Nenhum Dado</h1>
            <p className="text-yellow-700">Não foi possível recuperar os dados.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔧 Recuperação de Dados</h1>
        
        {/* Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Status do Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Banco de Dados</p>
              <p className={`font-semibold ${data.dbStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                {data.dbStatus === 'connected' ? '✅ Conectado' : '❌ Erro'}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Usuários</p>
              <p className="text-2xl font-bold text-blue-600">{data.counts.users}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Proprietários</p>
              <p className="text-2xl font-bold text-purple-600">{data.counts.owners}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Contas Bancárias</p>
              <p className="text-2xl font-bold text-orange-600">{data.counts.bankAccounts}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Última atualização: {new Date(data.timestamp).toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Owners List */}
        {data.owners.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Proprietários Encontrados</h2>
              <button 
                onClick={fetchRecoveryData}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Recarregar
              </button>
            </div>
            
            <div className="space-y-4">
              {data.owners.map((owner) => (
                <div key={owner.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{owner.name}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>📧 {owner.email}</p>
                        <p>📞 {owner.phone}</p>
                        <p>🆔 {owner.document}</p>
                        <p>📍 {owner.address}, {owner.city} - {owner.state}</p>
                        <p>📮 CEP: {owner.zipCode}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="space-y-2 text-sm">
                        <div className="bg-gray-50 p-2 rounded">
                          <p><strong>User ID:</strong> {owner.userId}</p>
                          <p><strong>Company ID:</strong> {owner.companyId || 'N/A'}</p>
                        </div>
                        
                        <div className="flex space-x-4">
                          <div className={`px-3 py-1 rounded text-xs font-semibold ${
                            owner.bankAccounts.length > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {owner.bankAccounts.length > 0 ? 'Completo' : 'Pendente'}
                          </div>
                          
                          <span className="text-xs text-gray-500">
                            🏦 {owner.bankAccounts.length} contas | 🏠 {owner.properties.length} imóveis
                          </span>
                        </div>
                        
                        {owner.bankAccounts.length > 0 && (
                          <div className="bg-blue-50 p-2 rounded text-xs">
                            <p><strong>Dados Bancários:</strong></p>
                            {owner.bankAccounts.map((bank, index) => (
                              <div key={index} className="mt-1">
                                {bank.bankName} | {bank.accountType} | Ag: {bank.agency} | Conta: {bank.account}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Criado em: {new Date(owner.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Nenhum Proprietário Encontrado</h2>
            <p className="text-gray-600">
              O banco de dados está conectado, mas não há proprietários cadastrados.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}