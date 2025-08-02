'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Wallet, CheckCircle, XCircle, AlertCircle, CreditCard, Receipt, Clock, FileText } from 'lucide-react'

interface GatewayStatus {
  configured: boolean
  gateway: string
  environment?: string
  lastTest?: string
  isActive: boolean
}

interface BoletoHistory {
  id: string
  amount: number
  dueDate: string
  status: string
  customer: string
  boletoUrl?: string
  createdAt: string
}

export default function UserGateway() {
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus | null>(null)
  const [boletoHistory, setBoletoHistory] = useState<BoletoHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [showBoletoForm, setShowBoletoForm] = useState(false)
  const [boletoForm, setBoletoForm] = useState({
    amount: '',
    dueDate: '',
    customer_name: '',
    customer_email: '',
    customer_document: '',
    customer_phone: '',
    description: ''
  })

  useEffect(() => {
    loadGatewayStatus()
    loadBoletoHistory()
  }, [])

  const loadGatewayStatus = async () => {
    try {
      const response = await fetch('/api/user/gateway-status')
      const data = await response.json()
      setGatewayStatus(data.status)
    } catch (error) {
      console.error('Error loading gateway status:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBoletoHistory = async () => {
    try {
      const response = await fetch('/api/user/boleto-history')
      const data = await response.json()
      setBoletoHistory(data.history || [])
    } catch (error) {
      console.error('Error loading boleto history:', error)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setBoletoForm(prev => ({ ...prev, [key]: value }))
  }

  const generateBoleto = async () => {
    setGenerateLoading(true)
    
    try {
      const response = await fetch('/api/user/generate-boleto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(boletoForm.amount),
          dueDate: boletoForm.dueDate,
          customer: {
            name: boletoForm.customer_name,
            email: boletoForm.customer_email,
            document: boletoForm.customer_document,
            phone: boletoForm.customer_phone
          },
          description: boletoForm.description || 'Pagamento via CRM Imobiliário'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('Boleto gerado com sucesso!')
        setShowBoletoForm(false)
        setBoletoForm({
          amount: '',
          dueDate: '',
          customer_name: '',
          customer_email: '',
          customer_document: '',
          customer_phone: '',
          description: ''
        })
        loadBoletoHistory() // Recarregar histórico
        
        // Abrir boleto em nova aba
        if (result.boleto.boletoUrl) {
          window.open(result.boleto.boletoUrl, '_blank')
        }
      } else {
        alert('Erro ao gerar boleto: ' + result.error)
      }
    } catch (error) {
      alert('Erro ao gerar boleto')
    } finally {
      setGenerateLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <Wallet className="w-8 h-8 mr-3 text-blue-600" />
            Gateway de Pagamento
          </h1>
          <p className="text-gray-600">Gerencie boletos e pagamentos da sua empresa</p>
        </div>

        {/* Status do Gateway */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Status da Configuração
          </h2>
          
          {!gatewayStatus?.configured ? (
            <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Gateway não configurado</p>
                <p className="text-sm text-yellow-600">
                  Entre em contato com o administrador para configurar seu gateway de pagamento.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Gateway configurado: {gatewayStatus.gateway?.toUpperCase()}
                </p>
                <p className="text-sm text-green-600">
                  Ambiente: {gatewayStatus.environment || 'Produção'} • 
                  Status: {gatewayStatus.isActive ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ações disponíveis */}
        {gatewayStatus?.configured && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gerar Boleto */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                Gerar Boleto
              </h3>
              
              {!showBoletoForm ? (
                <div>
                  <p className="text-gray-600 mb-4">
                    Crie boletos bancários para seus clientes de forma rápida e segura.
                  </p>
                  <button
                    onClick={() => setShowBoletoForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Novo Boleto
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={boletoForm.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="100.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Vencimento *
                      </label>
                      <input
                        type="date"
                        value={boletoForm.dueDate}
                        onChange={(e) => handleInputChange('dueDate', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Cliente *
                      </label>
                      <input
                        type="text"
                        value={boletoForm.customer_name}
                        onChange={(e) => handleInputChange('customer_name', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="João Silva"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email do Cliente *
                      </label>
                      <input
                        type="email"
                        value={boletoForm.customer_email}
                        onChange={(e) => handleInputChange('customer_email', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="joao@email.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CPF/CNPJ *
                      </label>
                      <input
                        type="text"
                        value={boletoForm.customer_document}
                        onChange={(e) => handleInputChange('customer_document', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="123.456.789-00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={boletoForm.customer_phone}
                        onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={boletoForm.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="Aluguel referente ao mês de..."
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={generateBoleto}
                      disabled={generateLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {generateLoading ? 'Gerando...' : 'Gerar Boleto'}
                    </button>
                    <button
                      onClick={() => setShowBoletoForm(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Histórico Rápido */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-green-600" />
                Últimos Boletos
              </h3>
              
              {boletoHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum boleto gerado ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {boletoHistory.slice(0, 3).map((boleto) => (
                    <div key={boleto.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">{boleto.customer}</p>
                        <p className="text-sm text-gray-600">
                          R$ {boleto.amount.toFixed(2)} • {new Date(boleto.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          boleto.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          boleto.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {boleto.status === 'PAID' ? 'Pago' : 
                           boleto.status === 'PENDING' ? 'Pendente' : 'Vencido'}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-2">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Ver histórico completo →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}