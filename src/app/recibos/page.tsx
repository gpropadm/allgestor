'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Search, Download, FileText, Calendar, AlertCircle } from 'lucide-react'

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
      const response = await fetch('/api/recibos')
      
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recibos Gerados</h1>
            <p className="text-gray-600 mt-1">
              Recibos gerados automaticamente quando pagamentos são marcados como pagos
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <button 
              onClick={(e) => {
                e.preventDefault()
                fetchRecibos()
              }}
              className="px-4 py-2 text-white rounded-lg transition-colors hover:opacity-80"
              style={{backgroundColor: '#f63c6a'}}
            >
              Atualizar Lista
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg transition-colors hover:bg-gray-700"
            >
              Recarregar Página
            </button>
          </div>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Recibos</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{recibos.length}</p>
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
                  R$ {recibos.reduce((sum, r) => sum + r.valorTotal, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                <p className="text-sm font-medium text-gray-600">Taxa Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  R$ {recibos.reduce((sum, r) => sum + r.taxaAdministracao, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {recibos.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum recibo encontrado</h3>
              <p className="text-gray-600">
                Recibos são gerados automaticamente quando pagamentos são marcados como pagos.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recibo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contrato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valores
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recibos.map((recibo) => (
                    <tr key={recibo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#fef2f2'}}>
                            <FileText className="w-5 h-5" style={{color: '#f63c6a'}} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{recibo.numeroRecibo}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(recibo.dataPagamento).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{recibo.proprietarioNome}</div>
                          <div className="text-gray-500">{recibo.inquilinoNome}</div>
                          <div className="text-gray-500 text-xs">{recibo.imovelEndereco}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-900 font-medium">
                            Total: R$ {recibo.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-gray-500">
                            Taxa: R$ {recibo.taxaAdministracao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => baixarRecibo(recibo.numeroRecibo)}
                          className="inline-flex items-center px-3 py-2 text-white rounded-lg transition-colors hover:opacity-90"
                          style={{backgroundColor: '#f63c6a'}}
                          title="Baixar PDF"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}