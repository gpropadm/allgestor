'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'

interface Company {
  id: string
  name: string
  tradeName?: string
  document: string
  email: string
  subscription: string
  gatewaySettings?: {
    pjbank_credencial?: string
    pjbank_chave?: string
    asaas_api_key?: string
    asaas_environment?: string
    asaas_wallet_id?: string
    gateway_preference?: string
  }
}

export default function AdminGatewaySettings() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState('')
  const [formData, setFormData] = useState({
    gateway_preference: 'pjbank',
    pjbank_credencial: '',
    pjbank_chave: '',
    asaas_api_key: '',
    asaas_environment: 'sandbox',
    asaas_wallet_id: ''
  })

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies')
      const data = await response.json()
      setCompanies(data.companies || [])
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    }
  }

  const loadCompanySettings = async (company: Company) => {
    setSelectedCompany(company)
    
    try {
      const response = await fetch(`/api/admin/gateway-settings/${company.id}`)
      const data = await response.json()
      
      if (data.success && data.settings) {
        setFormData(data.settings)
      } else {
        // Reset form for new company
        setFormData({
          gateway_preference: 'pjbank',
          pjbank_credencial: '',
          pjbank_chave: '',
          asaas_api_key: '',
          asaas_environment: 'sandbox',
          asaas_wallet_id: ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const testConnection = async () => {
    if (!selectedCompany) return
    
    setLoading(true)
    setTestResult('Testando conexão...')
    
    try {
      const response = await fetch('/api/gateway/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: formData.gateway_preference,
          credentials: formData
        })
      })
      
      const result = await response.json()
      setTestResult(JSON.stringify(result, null, 2))
    } catch (error) {
      setTestResult(`Erro: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!selectedCompany) return
    
    setLoading(true)
    
    try {
      const response = await fetch(`/api/admin/gateway-settings/${selectedCompany.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('Configurações salvas com sucesso!')
        loadCompanies() // Reload to show updated status
      } else {
        alert('Erro ao salvar: ' + result.error)
      }
    } catch (error) {
      alert('Erro ao salvar configurações')
    } finally {
      setLoading(false)
    }
  }

  const removeSettings = async () => {
    if (!selectedCompany) return
    
    if (!confirm(`Remover todas as configurações de gateway da empresa ${selectedCompany.name}?`)) {
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch(`/api/admin/gateway-settings/${selectedCompany.id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('Configurações removidas com sucesso!')
        setSelectedCompany(null)
        loadCompanies()
      } else {
        alert('Erro ao remover: ' + result.error)
      }
    } catch (error) {
      alert('Erro ao remover configurações')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🏢 Configurações de Gateway por Empresa
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Empresas */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Empresas Cadastradas</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    onClick={() => loadCompanySettings(company)}
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedCompany?.id === company.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{company.name}</h3>
                        {company.tradeName && (
                          <p className="text-sm text-gray-600">{company.tradeName}</p>
                        )}
                        <p className="text-sm text-gray-500">{company.document}</p>
                        <p className="text-xs text-gray-400">{company.subscription}</p>
                      </div>
                      <div className="text-right">
                        {company.gatewaySettings ? (
                          <span className="inline-block w-3 h-3 bg-green-500 rounded-full" title="Gateway configurado"></span>
                        ) : (
                          <span className="inline-block w-3 h-3 bg-gray-300 rounded-full" title="Gateway não configurado"></span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Configurações */}
            {selectedCompany && (
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  Configurar Gateway: {selectedCompany.name}
                </h2>
                
                {/* Preferência de Gateway */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gateway Preferencial
                  </label>
                  <select
                    value={formData.gateway_preference}
                    onChange={(e) => handleInputChange('gateway_preference', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="pjbank">PJBank</option>
                    <option value="asaas">Asaas</option>
                  </select>
                </div>

                {/* Credenciais condicionais baseadas na seleção */}
                {formData.gateway_preference === 'pjbank' && (
                  <div className="space-y-4 mb-6">
                    <h3 className="text-md font-semibold text-blue-600">🏦 Credenciais PJBank</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Credencial (CNPJ Token) *
                      </label>
                      <input
                        type="text"
                        value={formData.pjbank_credencial}
                        onChange={(e) => handleInputChange('pjbank_credencial', e.target.value)}
                        placeholder="1234567890abcdef..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chave Token *
                      </label>
                      <input
                        type="password"
                        value={formData.pjbank_chave}
                        onChange={(e) => handleInputChange('pjbank_chave', e.target.value)}
                        placeholder="abcdef1234567890..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                      💡 <strong>Dica:</strong> Essas credenciais são fornecidas pelo PJBank após aprovação da conta empresarial.
                    </div>
                  </div>
                )}

                {formData.gateway_preference === 'asaas' && (
                  <div className="space-y-4 mb-6">
                    <h3 className="text-md font-semibold text-green-600">💳 Credenciais Asaas</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Key *
                      </label>
                      <input
                        type="password"
                        value={formData.asaas_api_key}
                        onChange={(e) => handleInputChange('asaas_api_key', e.target.value)}
                        placeholder="$aact_YTU5YjRlMjM5N2QyZjI4ZjY0NzFiMjN..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ambiente *
                      </label>
                      <select
                        value={formData.asaas_environment}
                        onChange={(e) => handleInputChange('asaas_environment', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="sandbox">Sandbox (Teste)</option>
                        <option value="production">Produção</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wallet ID (para Split de Pagamentos)
                      </label>
                      <input
                        type="text"
                        value={formData.asaas_wallet_id}
                        onChange={(e) => handleInputChange('asaas_wallet_id', e.target.value)}
                        placeholder="d7ce7ac3-4557-40c6-99a6-5295f706bf09"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Usado para split de pagamentos entre contas Asaas
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-sm text-green-800">
                      💡 <strong>Dica:</strong> Use o ambiente Sandbox para testes e Produção apenas quando aprovado pelo cliente.
                    </div>
                  </div>
                )}

                {/* Botões */}
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={testConnection}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Testando...' : 'Testar Conexão'}
                  </button>
                  
                  <button
                    onClick={saveSettings}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : 'Salvar Configurações'}
                  </button>
                  
                  <button
                    onClick={removeSettings}
                    disabled={loading}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Remover
                  </button>
                </div>

                {/* Resultado do Teste */}
                {testResult && (
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Resultado:</h3>
                    <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                      {testResult}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}