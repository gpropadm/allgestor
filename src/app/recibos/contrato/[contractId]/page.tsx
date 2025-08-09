'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Download, FileText, ArrowLeft, Calendar } from 'lucide-react'
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

export default function RecibosContratoPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  
  const contractId = params?.contractId as string
  const proprietario = searchParams?.get('proprietario') || ''
  
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Verificar autenticação
  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    
    if (status === 'authenticated' && contractId) {
      fetchRecibosContrato()
    }
  }, [status, contractId, router])

  const fetchRecibosContrato = async () => {
    try {
      setError('')
      setLoading(true)
      
      const response = await fetch(`/api/recibos?contractId=${contractId}`)
      
      if (response.status === 401) {
        router.push('/login')
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        const recibosArray = Array.isArray(data) ? data : []
        setRecibos(recibosArray)
      } else {
        setError('Erro ao carregar recibos do contrato')
      }
    } catch (error) {
      console.error('Erro ao buscar recibos do contrato:', error)
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-8 rounded-xl shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/recibos')}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="bg-white/20 p-3 rounded-lg">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">📄 Recibos do Contrato</h1>
                <p className="text-green-100 mt-2">
                  {proprietario && `Proprietário: ${proprietario}`}
                </p>
              </div>
            </div>
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

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Recibos</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{recibos.length}</p>
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
              <div className="bg-purple-50 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
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
              Este contrato ainda não possui recibos gerados.
            </p>
            <button 
              onClick={() => router.push('/recibos')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Voltar aos Recibos
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Todos os Recibos ({recibos.length})
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {recibos.map((recibo) => (
                <div key={recibo.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-lg mb-1">
                          {recibo.numeroRecibo}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>Data Pagamento:</strong> {new Date(recibo.dataPagamento).toLocaleDateString('pt-BR')}</div>
                          <div><strong>Competência:</strong> {recibo.competencia}</div>
                          <div className="grid grid-cols-3 gap-4 mt-2">
                            <div><strong>Total:</strong> R$ {recibo.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                            <div><strong>Taxa:</strong> R$ {recibo.taxaAdministracao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                            <div><strong>Repassado:</strong> R$ {recibo.valorRepassado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => baixarRecibo(recibo.numeroRecibo)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Baixar PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}