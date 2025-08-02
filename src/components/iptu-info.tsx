'use client'

import { useState } from 'react'
import { FileText, RefreshCw, AlertCircle, CheckCircle, XCircle, Calendar, DollarSign, MapPin } from 'lucide-react'
import type { IPTUResponse, IPTUDebt, IPTUInstallment } from '@/services/iptu-service'

interface IPTUInfoProps {
  propertyRegistration: string | null
  propertyAddress?: string
}

export function IPTUInfo({ propertyRegistration, propertyAddress }: IPTUInfoProps) {
  const [loading, setLoading] = useState(false)
  const [iptuData, setIptuData] = useState<IPTUResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConsultIPTU = async () => {
    if (!propertyRegistration) {
      setError('Cadastro do imóvel não informado')
      return
    }

    setLoading(true)
    setError(null)
    setIptuData(null)

    try {
      const response = await fetch('/api/iptu/consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyRegistration
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro na consulta')
      }

      setIptuData(data)
      
      if (!data.success) {
        setError(data.error || 'Erro desconhecido na consulta')
      }

    } catch (err) {
      console.error('Erro ao consultar IPTU:', err)
      setError(err instanceof Error ? err.message : 'Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const getInstallmentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getInstallmentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paga'
      case 'overdue':
        return 'Vencida'
      case 'pending':
        return 'Pendente'
      default:
        return status
    }
  }

  const formatCurrency = (value: string) => {
    try {
      // Se já está formatado, retorna como está
      if (value.includes('R$')) return value
      
      // Tenta converter para número e formatar
      const numValue = parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.'))
      if (isNaN(numValue)) return value
      
      return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    } catch {
      return value
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return 'Data não informada'
      
      // Se já está no formato dd/mm/yyyy, retorna como está
      if (dateStr.includes('/')) return dateStr
      
      // Tenta converter de outros formatos
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      
      return date.toLocaleDateString('pt-BR')
    } catch {
      return dateStr
    }
  }

  if (!propertyRegistration) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center text-gray-500">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="text-sm">
            Cadastro do imóvel não informado. Adicione o número do cadastro municipal para consultar débitos de IPTU.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Consulta IPTU</h3>
        </div>
        <button
          onClick={handleConsultIPTU}
          disabled={loading}
          className="flex items-center px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{backgroundColor: loading ? '#d1d5db' : '#f63c6a'}}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement
            if (!loading) {
              target.style.backgroundColor = '#e03659'
            }
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement
            if (!loading) {
              target.style.backgroundColor = '#f63c6a'
            }
          }}
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Consultando...' : 'Consultar IPTU'}
        </button>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          <strong>Cadastro do Imóvel:</strong> {propertyRegistration}
        </div>
        {propertyAddress && (
          <div className="text-sm text-gray-600 mt-1">
            <strong>Endereço:</strong> {propertyAddress}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-800">
            <XCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {iptuData?.success && iptuData.data && (
        <div className="space-y-6">
          {/* Informações gerais */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center text-green-800 mb-2">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Consulta realizada com sucesso</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-700">
                <MapPin className="w-4 h-4 mr-2" />
                <span><strong>Endereço:</strong> {iptuData.data.propertyAddress}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <FileText className="w-4 h-4 mr-2" />
                <span><strong>Número SQL:</strong> {iptuData.data.taxNumber}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <DollarSign className="w-4 h-4 mr-2" />
                <span><strong>Total de Débitos:</strong> {formatCurrency(iptuData.data.totalDebt)}</span>
              </div>
            </div>
          </div>

          {/* Lista de débitos por ano */}
          {iptuData.data.debts && iptuData.data.debts.length > 0 ? (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Débitos por Exercício</h4>
              <div className="space-y-4">
                {iptuData.data.debts.map((debt: IPTUDebt, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">Exercício {debt.year}</h5>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Total: {formatCurrency(debt.totalAmount)}</div>
                        <div className="text-sm text-gray-600">Pendente: {formatCurrency(debt.remainingAmount)}</div>
                      </div>
                    </div>

                    {debt.installments && debt.installments.length > 0 && (
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Parcelas</h6>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-3 font-medium text-gray-600">Parcela</th>
                                <th className="text-left py-2 px-3 font-medium text-gray-600">Vencimento</th>
                                <th className="text-left py-2 px-3 font-medium text-gray-600">Valor</th>
                                <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                                <th className="text-left py-2 px-3 font-medium text-gray-600">Pagamento</th>
                              </tr>
                            </thead>
                            <tbody>
                              {debt.installments.map((installment: IPTUInstallment, idx: number) => (
                                <tr key={idx} className="border-b border-gray-100">
                                  <td className="py-2 px-3">{installment.installment}</td>
                                  <td className="py-2 px-3">
                                    <div className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                                      {formatDate(installment.dueDate)}
                                    </div>
                                  </td>
                                  <td className="py-2 px-3">{formatCurrency(installment.amount)}</td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getInstallmentStatusColor(installment.status)}`}>
                                      {getInstallmentStatusText(installment.status)}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    {installment.paymentDate ? formatDate(installment.paymentDate) : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center text-green-800">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>Nenhum débito encontrado! Imóvel está em dia com o IPTU.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Informações sobre o serviço */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-xs text-blue-800">
          <strong>Sobre o serviço:</strong> Consulta realizada através da API InfoSimples, que busca informações oficiais 
          junto aos órgãos municipais. Os dados podem levar alguns minutos para serem atualizados após pagamentos recentes.
        </div>
      </div>
    </div>
  )
}