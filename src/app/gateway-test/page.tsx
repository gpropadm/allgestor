'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'

export default function GatewayTest() {
  const [selectedGateway, setSelectedGateway] = useState('asaas')
  const [credentials, setCredentials] = useState({
    // Asaas
    asaas_api_key: '',
    asaas_environment: 'sandbox',
    
    // PJBank  
    pjbank_credencial: '',
    pjbank_chave: ''
  })
  const [testResult, setTestResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }))
  }

  const testConnection = async () => {
    setLoading(true)
    setTestResult('Testando conexão...')
    
    try {
      const response = await fetch('/api/gateway/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: selectedGateway,
          credentials: credentials
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

  const generateTestBoleto = async () => {
    setLoading(true)
    setTestResult('Gerando boleto de teste...')
    
    try {
      const response = await fetch('/api/gateway/generate-boleto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: selectedGateway,
          credentials: credentials,
          amount: 100.00,
          dueDate: '2025-07-15',
          customer: {
            name: 'Cliente Teste',
            email: 'teste@email.com',
            document: '12345678901'
          }
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🧪 Teste de Gateway de Pagamento</h1>
          
          {/* Seleção do Gateway */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gateway de Pagamento
            </label>
            <select 
              value={selectedGateway}
              onChange={(e) => setSelectedGateway(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="asaas">Asaas</option>
              <option value="pjbank">PJBank</option>
            </select>
          </div>

          {/* Credenciais Asaas */}
          {selectedGateway === 'asaas' && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold">Credenciais Asaas</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={credentials.asaas_api_key}
                  onChange={(e) => handleCredentialChange('asaas_api_key', e.target.value)}
                  placeholder="$aact_YTU5YjRlMjM5N2QyZjI4ZjY0NzFiMjN..."
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ambiente
                </label>
                <select
                  value={credentials.asaas_environment}
                  onChange={(e) => handleCredentialChange('asaas_environment', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="sandbox">Sandbox (Teste)</option>
                  <option value="production">Produção</option>
                </select>
              </div>
            </div>
          )}

          {/* Credenciais PJBank */}
          {selectedGateway === 'pjbank' && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold">Credenciais PJBank</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credencial
                </label>
                <input
                  type="text"
                  value={credentials.pjbank_credencial}
                  onChange={(e) => handleCredentialChange('pjbank_credencial', e.target.value)}
                  placeholder="1234567890abcdef..."
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chave
                </label>
                <input
                  type="password"
                  value={credentials.pjbank_chave}
                  onChange={(e) => handleCredentialChange('pjbank_chave', e.target.value)}
                  placeholder="abcdef1234567890..."
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Botões de Teste */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={testConnection}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testando...' : 'Testar Conexão'}
            </button>
            
            <button
              onClick={generateTestBoleto}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Gerando...' : 'Gerar Boleto Teste'}
            </button>
          </div>

          {/* Resultado */}
          {testResult && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Resultado:</h3>
              <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                {testResult}
              </pre>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}