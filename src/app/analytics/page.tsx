'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  BarChart3,
  PieChart,
  Download,
  Calendar
} from 'lucide-react'

interface AnalyticsData {
  conversion: {
    rate: number
    leadsCount: number
    conversionsCount: number
    trend: number
  }
  funnel: {
    stages: Array<{
      name: string
      count: number
      conversion: number
    }>
  }
  agents: Array<{
    name: string
    leads: number
    conversions: number
    rate: number
  }>
  roi: {
    total: number
    period: string
    breakdown: Array<{
      source: string
      investment: number
      return: number
      roi: number
    }>
  }
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    redirect('/login')
  }

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?type=dashboard&period=${period}`)
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/analytics?type=executive&export=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio-executivo.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics & Relatórios
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Análise completa de performance e conversões
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            >
              <option value="week">Semana</option>
              <option value="month">Mês</option>
              <option value="quarter">Trimestre</option>
              <option value="year">Ano</option>
            </select>
            
            <button
              onClick={() => exportReport('pdf')}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Cards de Métricas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Taxa de Conversão
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.conversion.rate || 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600">
                  +{data?.conversion.trend || 0}% vs período anterior
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total de Leads
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.conversion.leadsCount || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Conversões
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.conversion.conversionsCount || 0}
                  </p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    ROI Total
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    R$ {(data?.roi.total || 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>
        )}

        {/* Gráficos e Análises Detalhadas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Funil de Conversão
            </h3>
            {data?.funnel.stages.map((stage, index) => (
              <div key={index} className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{stage.name}</span>
                  <span className="text-sm text-gray-600">{stage.count} leads</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${stage.conversion}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{stage.conversion}% de conversão</span>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Performance por Agente
            </h3>
            <div className="space-y-4">
              {data?.agents.map((agent, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-gray-600">{agent.leads} leads • {agent.conversions} conversões</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{agent.rate}%</p>
                    <p className="text-xs text-gray-500">taxa conversão</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}