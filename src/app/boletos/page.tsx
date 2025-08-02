'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/dashboard-layout'
import BoletoForm from '@/components/boleto-form'
import { Plus, FileText, DollarSign } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  dueDate: string
  paidDate?: string
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  gateway: 'ASAAS' | 'PJBANK'
  boletoUrl?: string
  pixQrCode?: string
  ownerAmount?: number
  companyAmount?: number
  gatewayFee?: number
  contract: {
    id: string
    property: {
      title: string
    }
    tenant: {
      name: string
    }
  }
}

export default function BoletosPage() {
  const { data: session } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (session) {
      loadPayments()
    }
  }, [session])

  const loadPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payments')
      const data = await response.json()
      
      if (data.success) {
        setPayments(data.data.filter((p: Payment) => p.gateway))
      }
    } catch (error) {
      console.error('Erro ao carregar boletos:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Pago'
      case 'PENDING':
        return 'Pendente'
      case 'OVERDUE':
        return 'Vencido'
      case 'CANCELLED':
        return 'Cancelado'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{borderColor: '#f63c6a'}}></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Boletos</h1>
            <p className="text-gray-600 mt-1">
              Gerencie boletos com split de pagamento
            </p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
            style={{backgroundColor: '#f63c6a'}}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.backgroundColor = '#e03659'
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.backgroundColor = '#f63c6a'
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Boleto
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Boletos</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{payments.length}</p>
              </div>
              <div className="p-3 rounded-lg" style={{backgroundColor: '#fef2f2'}}>
                <FileText className="w-6 h-6" style={{color: '#f63c6a'}} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{backgroundColor: '#fef2f2'}}>
                <DollarSign className="w-6 h-6" style={{color: '#f63c6a'}} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Boletos Pagos</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {payments.filter(p => p.status === 'PAID').length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Boletos List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Boletos</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {payments.map((payment) => (
              <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#fef2f2'}}>
                      <FileText className="w-5 h-5" style={{color: '#f63c6a'}} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {payment.contract.property.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {payment.contract.tenant.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Venc: {formatDate(payment.dueDate)}
                      </p>
                    </div>
                    
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                    
                    <div className="flex space-x-2">
                      {payment.boletoUrl && (
                        <a
                          href={payment.boletoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Ver Boleto
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Split Details */}
                {(payment.ownerAmount || payment.companyAmount || payment.gatewayFee) && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 mb-2">Split de Pagamento:</p>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      {payment.ownerAmount && (
                        <div>
                          <span className="text-gray-500">Proprietário:</span>
                          <span className="font-medium text-gray-900 ml-1">
                            {formatCurrency(payment.ownerAmount)}
                          </span>
                        </div>
                      )}
                      {payment.companyAmount && (
                        <div>
                          <span className="text-gray-500">Imobiliária:</span>
                          <span className="font-medium text-gray-900 ml-1">
                            {formatCurrency(payment.companyAmount)}
                          </span>
                        </div>
                      )}
                      {payment.gatewayFee && (
                        <div>
                          <span className="text-gray-500">Taxa Gateway:</span>
                          <span className="font-medium text-gray-900 ml-1">
                            {formatCurrency(payment.gatewayFee)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {payments.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Nenhum boleto encontrado. Crie seu primeiro boleto clicando no botão "Novo Boleto".
              </div>
            )}
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <BoletoForm
                onSuccess={(result) => {
                  console.log('Boleto criado:', result)
                  setShowForm(false)
                  loadPayments()
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}