'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  FileText, 
  Upload, 
  Download,
  Calendar,
  DollarSign,
  Building2,
  Users,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  FileX
} from 'lucide-react'

interface DimobStats {
  totalContracts: number
  totalRevenue: number
  xmlsUploaded: number
  pendingXmls: number
  yearlyRevenue: Record<string, number>
}

export default function DimobPage() {
  const [stats, setStats] = useState<DimobStats>({
    totalContracts: 0,
    totalRevenue: 0,
    xmlsUploaded: 0,
    pendingXmls: 0,
    yearlyRevenue: {}
  })
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchDimobStats()
  }, [])

  const fetchDimobStats = async () => {
    try {
      // TODO: Implementar API call
      // Simulando dados por enquanto
      setStats({
        totalContracts: 45,
        totalRevenue: 180000,
        xmlsUploaded: 120,
        pendingXmls: 8,
        yearlyRevenue: {
          '2023': 165000,
          '2024': 180000,
          '2025': 45000
        }
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas DIMOB:', error)
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">DIMOB - Declaração Imobiliária</h1>
            <p className="text-gray-600">Gerencie suas obrigações fiscais imobiliárias</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/dimob/upload" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors">
              <Upload size={16} />
              Upload XMLs
            </Link>
            <Link href="/dashboard/dimob/generate" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors">
              <Download size={16} />
              Gerar DIMOB
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contratos Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContracts}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+12%</span>
              <span className="text-gray-600 ml-1">vs ano passado</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+8.5%</span>
              <span className="text-gray-600 ml-1">este ano</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">XMLs Processados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.xmlsUploaded}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600">NFS-e importadas</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">XMLs Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingXmls}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-orange-600">Aguardando processamento</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Upload de NFS-e</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Importe os arquivos XML das suas notas fiscais de serviço emitidas.
            </p>
            <Link href="/dashboard/dimob/upload">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                <FileX className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Arraste arquivos XML aqui ou clique para selecionar</p>
                <p className="text-sm text-gray-500">Suporta múltiplos arquivos XML de NFS-e</p>
              </div>
            </Link>
          </div>

          {/* DIMOB Generation */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Gerar DIMOB</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Gere o arquivo TXT para envio da Declaração de Informações sobre Atividades Imobiliárias.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ano Base
                </label>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={2023}>2023</option>
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                </select>
              </div>

              <Link href="/dashboard/dimob/generate" className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors">
                <Download size={16} />
                Gerar Arquivo DIMOB {selectedYear}
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Atividade Recente</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-900">XML processado - NFS-e #1234</span>
              </div>
              <span className="text-sm text-gray-500">Há 2 horas</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-900">DIMOB 2024 gerado com sucesso</span>
              </div>
              <span className="text-sm text-gray-500">Ontem</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-gray-900">3 XMLs aguardando processamento</span>
              </div>
              <span className="text-sm text-gray-500">2 dias atrás</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}