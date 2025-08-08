'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Search, Download, FileText, Calendar, AlertCircle, Filter, ChevronDown, Eye } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'

interface Recibo {
  id: string
  numeroRecibo: string
  competencia: string
  dataPagamento: string
  valorTotal: number
  taxaAdministracao: number
  valorRepassado: number
  proprietarioNome: string
  inquilinoNome: string
  imovelEndereco: string
}

export default function RecibosPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    busca: '',
    ano: new Date().getFullYear().toString(),
    mes: '',
    proprietario: ''
  })
  const [showFiltros, setShowFiltros] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Verificar autenticação
  useEffect(() => {
    if (status === 'loading') return // Ainda carregando
    
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    
    if (status === 'authenticated') {
      fetchRecibos()
    }
  }, [status, router])

  const fetchRecibos = async () => {
    try {
      setError('')
      setLoading(true)
      
      // Construir URL com filtros
      const params = new URLSearchParams()
      if (filtros.ano && filtros.mes) {
        params.append('ano', filtros.ano)
        params.append('mes', filtros.mes)
      }
      
      const url = `/api/recibos${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url)
      
      if (response.status === 401) {
        router.push('/login')
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setRecibos(Array.isArray(data) ? data : [])
      } else if (response.status === 500) {
        setError('Erro ao carregar recibos')
      } else {
        setError('Erro ao carregar recibos')
      }
    } catch (error) {
      console.error('Erro ao buscar recibos:', error)
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }
  
  // Filtrar recibos no frontend
  const recibosFiltrados = recibos.filter(recibo => {
    // Helper para verificar se campo existe e fazer busca case-insensitive
    const safeIncludes = (field: string | null | undefined, searchTerm: string) => {
      if (!field || !searchTerm) return false
      const fieldStr = field.toString().toLowerCase()
      const searchStr = searchTerm.toLowerCase()
      return fieldStr.includes(searchStr)
    }
    
    const buscaLower = filtros.busca.trim()
    
    // Se não há busca, aceitar todos
    const matchBusca = !buscaLower || 
      safeIncludes(recibo.numeroRecibo, buscaLower) ||
      safeIncludes(recibo.proprietarioNome, buscaLower) ||
      safeIncludes(recibo.inquilinoNome, buscaLower) ||
      safeIncludes(recibo.imovelEndereco, buscaLower)
      
    const proprietarioFilter = filtros.proprietario.trim()
    const matchProprietario = !proprietarioFilter ||
      safeIncludes(recibo.proprietarioNome, proprietarioFilter)
      
    // Debug apenas quando há filtros ativos
    if (buscaLower && recibo === recibos[0]) {
      console.log('🔍 Debug filtro busca:', {
        busca: buscaLower,
        numeroRecibo: recibo.numeroRecibo,
        proprietario: recibo.proprietarioNome,
        inquilino: recibo.inquilinoNome,
        endereco: recibo.imovelEndereco,
        matchBusca
      })
    }
      
    return matchBusca && matchProprietario
  })
  
  // Paginação
  const totalPages = Math.ceil(recibosFiltrados.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const recibosExibidos = recibosFiltrados.slice(startIndex, startIndex + itemsPerPage)
  
  // Proprietários únicos para o filtro
  const proprietariosUnicos = [...new Set(recibos.map(r => r.proprietarioNome))].sort()
  
  // Reset página ao filtrar
  useEffect(() => {
    setCurrentPage(1)
  }, [filtros])
  
  // Fetch quando filtros de período mudarem
  useEffect(() => {
    if (status === 'authenticated') {
      fetchRecibos()
    }
  }, [filtros.ano, filtros.mes])

  const baixarRecibo = async (numeroRecibo: string) => {
    try {
      const response = await fetch(`/api/recibos/${numeroRecibo}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Recibo_${numeroRecibo}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Erro ao baixar recibo')
      }
    } catch (error) {
      console.error('Erro ao baixar recibo:', error)
      alert('Erro ao baixar recibo')
    }
  }

  // Mostrar loading enquanto verifica autenticação
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#f63c6a'}}></div>
      </div>
    )
  }

  // Se não autenticado, não renderizar nada (será redirecionado)
  if (status === 'unauthenticated') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-xl shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">📄 Gestão de Recibos</h1>
                <p className="text-blue-100 mt-2">
                  Recibos gerados automaticamente quando pagamentos são marcados como pagos
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowFiltros(!showFiltros)}
                className={`text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  (filtros.busca || filtros.mes || filtros.proprietario) 
                    ? 'bg-yellow-500/80 hover:bg-yellow-500' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filtros</span>
                {(filtros.busca || filtros.mes || filtros.proprietario) && (
                  <span className="bg-white/30 text-xs px-2 py-1 rounded-full">
                    Ativos
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${showFiltros ? 'rotate-180' : ''}`} />
              </button>
              <button 
                onClick={fetchRecibos}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        {showFiltros && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={filtros.busca}
                    onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                    placeholder="Número, proprietário, inquilino..."
                    className={`pl-10 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      filtros.busca ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ano
                </label>
                <select
                  value={filtros.ano}
                  onChange={(e) => setFiltros(prev => ({ ...prev, ano: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os anos</option>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mês
                </label>
                <select
                  value={filtros.mes}
                  onChange={(e) => setFiltros(prev => ({ ...prev, mes: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os meses</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month.toString()}>
                      {new Date(2000, month - 1).toLocaleString('pt-BR', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proprietário
                </label>
                <select
                  value={filtros.proprietario}
                  onChange={(e) => setFiltros(prev => ({ ...prev, proprietario: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os proprietários</option>
                  {proprietariosUnicos.map(nome => (
                    <option key={nome} value={nome}>{nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">Problema detectado</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Recibos</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{recibosFiltrados.length}</p>
                <p className="text-xs text-gray-500 mt-1">de {recibos.length} no total</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  R$ {recibosFiltrados.reduce((sum, r) => sum + r.valorTotal, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa Admin</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  R$ {recibosFiltrados.reduce((sum, r) => sum + r.taxaAdministracao, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Repassado</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  R$ {recibosFiltrados.reduce((sum, r) => sum + r.valorRepassado, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <Download className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Recibos */}
        {recibos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum recibo encontrado</h3>
            <p className="text-gray-600 mb-6">
              Recibos são gerados automaticamente quando pagamentos são marcados como pagos.
            </p>
            <button 
              onClick={fetchRecibos}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Verificar novamente
            </button>
          </div>
        ) : recibosFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum resultado encontrado</h3>
            <p className="text-gray-600 mb-6">
              Tente ajustar os filtros para encontrar o que procura.
            </p>
            <button 
              onClick={() => setFiltros({ busca: '', ano: '', mes: '', proprietario: '' })}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <>
            {/* Header da Lista */}
            <div className="bg-white rounded-t-xl shadow-sm border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recibos ({recibosFiltrados.length})
                </h2>
                <p className="text-sm text-gray-500">
                  Página {currentPage} de {totalPages}
                </p>
              </div>
            </div>

            {/* Cards dos Recibos */}
            <div className="bg-white rounded-b-xl shadow-sm">
              <div className="divide-y divide-gray-200">
                {recibosExibidos.map((recibo) => (
                  <div key={recibo.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      {/* Informações do Recibo */}
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-lg">
                            {recibo.numeroRecibo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(recibo.dataPagamento).toLocaleDateString('pt-BR')} • 
                            Competência: {recibo.competencia}
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => baixarRecibo(recibo.numeroRecibo)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Baixar PDF</span>
                        </button>
                      </div>
                    </div>

                    {/* Detalhes do Contrato */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Contrato</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div><strong>Proprietário:</strong> {recibo.proprietarioNome}</div>
                          <div><strong>Inquilino:</strong> {recibo.inquilinoNome}</div>
                          <div><strong>Imóvel:</strong> {recibo.imovelEndereco}</div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Valores</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium text-gray-900">
                              R$ {recibo.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Taxa Admin:</span>
                            <span className="font-medium text-purple-600">
                              R$ {recibo.taxaAdministracao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span className="text-gray-600">Repassado:</span>
                            <span className="font-medium text-green-600">
                              R$ {recibo.valorRepassado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-sm mt-4 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {startIndex + 1} até {Math.min(startIndex + itemsPerPage, recibosFiltrados.length)} de {recibosFiltrados.length} resultados
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = i + 1
                        if (totalPages > 5 && currentPage > 3) {
                          pageNum = currentPage - 2 + i
                          if (pageNum > totalPages) pageNum = totalPages - 4 + i
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}