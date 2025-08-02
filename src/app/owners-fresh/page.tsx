'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'

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
  properties: Record<string, any>[]
  bankAccounts: {
    bankName: string
    accountType: string
    agency: string
    account: string
    pixKey?: string
  }[]
}

export default function OwnersFresh() {
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOwners()
  }, [])

  const fetchOwners = async () => {
    try {
      setError('')
      console.log('🔄 Fetching owners with cache bust:', Date.now())
      
      const response = await fetch(`/api/owners?_=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      console.log('📡 Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Received data:', data)
        setOwners(Array.isArray(data) ? data : [])
      } else {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        setError(`Erro ${response.status}: ${errorData.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('❌ Fetch Error:', error)
      setError('Erro de conexão. Verifique sua internet.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#f63c6a'}}></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">❌ {error}</div>
          <button 
            onClick={fetchOwners}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Tentar Novamente
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proprietários - Fresh Page (Debug)</h1>
          <p className="text-gray-600 mt-1">
            Total encontrado: {owners.length} proprietários
          </p>
        </div>

        {/* Debug Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800">Debug Info:</h3>
          <p className="text-yellow-700">
            Esta é uma página de debug sem cache. Total de proprietários: <strong>{owners.length}</strong>
          </p>
          <button 
            onClick={fetchOwners}
            className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm"
          >
            Recarregar Dados
          </button>
        </div>

        {owners.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum proprietário encontrado
            </h3>
            <p className="text-gray-600">
              Os dados podem não ter sido carregados ou você pode não ter proprietários cadastrados.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Lista de Proprietários</h3>
              <div className="space-y-4">
                {owners.map((owner) => (
                  <div key={owner.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{owner.name}</h4>
                        <p className="text-gray-600">📧 {owner.email}</p>
                        <p className="text-gray-600">📞 {owner.phone}</p>
                        <p className="text-gray-600">🆔 {owner.document}</p>
                        <p className="text-gray-600">📍 {owner.city} - {owner.state}</p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (owner.bankAccounts && owner.bankAccounts.length > 0) 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {(owner.bankAccounts && owner.bankAccounts.length > 0) ? 'Completo' : 'Pendente'}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          🏠 {owner.properties?.length || 0} imóveis
                        </p>
                        <p className="text-sm text-gray-500">
                          🏦 {owner.bankAccounts?.length || 0} contas bancárias
                        </p>
                      </div>
                    </div>
                    
                    {owner.bankAccounts && owner.bankAccounts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700">Dados Bancários:</p>
                        {owner.bankAccounts.map((bank, index) => (
                          <div key={index} className="text-sm text-gray-600 mt-1">
                            🏦 {bank.bankName} | {bank.accountType} | Ag: {bank.agency} | Conta: {bank.account}
                            {bank.pixKey && (
                              <div>💳 PIX: {bank.pixKey}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}