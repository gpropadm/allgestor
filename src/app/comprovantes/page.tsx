'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { FileText, Download, Calendar, User, Building, CheckCircle, AlertTriangle } from 'lucide-react'

interface Proprietario {
  id: string
  nome: string
  documento: string
  contratos: Array<{
    id: string
    propriedade: string
    inquilino: string
    valorAluguel: number
    startDate: string
    endDate: string
    pagamentosPagos: number
  }>
}

interface Notification {
  type: 'success' | 'error' | 'info'
  message: string
  title?: string
}

export default function ComprovantesPage() {
  const [proprietarios, setProprietarios] = useState<Proprietario[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [notification, setNotification] = useState<Notification | null>(null)
  
  // Filtros
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchTerm, setSearchTerm] = useState('')

  // Anos disponíveis (últimos 5 anos)
  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  useEffect(() => {
    fetchProprietarios()
  }, [])

  const fetchProprietarios = async () => {
    try {
      const response = await fetch('/api/comprovantes')
      if (response.ok) {
        const data = await response.json()
        setProprietarios(data.proprietarios || [])
      } else {
        showNotification('error', 'Erro ao carregar proprietários')
      }
    } catch (error) {
      console.error('Erro:', error)
      showNotification('error', 'Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
    setNotification({ type, message, title })
    setTimeout(() => setNotification(null), 5000)
  }

  const gerarComprovante = async (ownerId: string, contractId: string, ownerName: string) => {
    setGenerating(true)
    try {
      console.log('🔄 Gerando comprovante:', { ownerId, contractId, selectedYear })
      
      const response = await fetch('/api/comprovantes/html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ownerId,
          contractId,
          ano: selectedYear
        })
      })

      if (response.ok) {
        const html = await response.text()
        
        // Abrir em nova janela para visualizar/imprimir
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(html)
          newWindow.document.close()
        }
        
        showNotification('success', `Comprovante gerado para ${ownerName} - ${selectedYear}`, 'Sucesso!')
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Erro ao gerar comprovante')
      }
    } catch (error) {
      console.error('Erro ao gerar comprovante:', error)
      showNotification('error', 'Erro ao gerar comprovante')
    } finally {
      setGenerating(false)
    }
  }

  // Filtrar proprietários
  const filteredProprietarios = proprietarios.filter(prop => {
    const matchesSearch = prop.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prop.documento.includes(searchTerm)
    
    // Verificar se tem pagamentos no ano selecionado seria ideal, mas por ora mostrar todos
    return matchesSearch
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#f63c6a'}}></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Notificação */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl border max-w-sm transform transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {notification.type === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
                {notification.type === 'error' && <AlertTriangle className="w-6 h-6 text-red-600" />}
              </div>
              <div className="flex-1">
                {notification.title && (
                  <h4 className="font-semibold mb-1">{notification.title}</h4>
                )}
                <p className="text-sm">{notification.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-8 h-8" style={{color: '#f63c6a'}} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Comprovantes de Rendimentos</h1>
              <p className="text-gray-600">Gere comprovantes anuais para declaração de Imposto de Renda</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Buscar Proprietário
              </label>
              <input
                type="text"
                placeholder="Nome ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Ano do Comprovante
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p><strong>Informação importante:</strong> Os comprovantes são gerados baseados nos pagamentos que foram marcados como "PAGOS" no sistema.</p>
                <p className="mt-1">O valor líquido já desconta automaticamente a taxa de administração (10%).</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Proprietários */}
        <div className="space-y-4">
          {filteredProprietarios.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum proprietário encontrado</p>
            </div>
          ) : (
            filteredProprietarios.map(proprietario => (
              <div key={proprietario.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-6 h-6 text-gray-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{proprietario.nome}</h3>
                      <p className="text-sm text-gray-600">CPF/CNPJ: {proprietario.documento || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {proprietario.contratos.length} contrato(s)
                  </div>
                </div>

                {/* Contratos do proprietário */}
                <div className="space-y-3">
                  {proprietario.contratos.map(contrato => (
                    <div key={contrato.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{contrato.propriedade}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                            <div>
                              <strong>Inquilino:</strong> {contrato.inquilino}
                            </div>
                            <div>
                              <strong>Valor:</strong> R$ {contrato.valorAluguel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div>
                              <strong>Pagamentos:</strong> {contrato.pagamentosPagos} pagos
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => gerarComprovante(proprietario.id, contrato.id, proprietario.nome)}
                            disabled={generating}
                            className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center space-x-2 ${
                              generating 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'hover:opacity-90 shadow-md hover:shadow-lg'
                            }`}
                            style={{backgroundColor: generating ? undefined : '#f63c6a'}}
                          >
                            <Download className="w-4 h-4" />
                            <span>{generating ? 'Gerando...' : 'Gerar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}