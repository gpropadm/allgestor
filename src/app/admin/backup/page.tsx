'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Download, Database, Shield, Clock, Users, Building2, Home, CreditCard } from 'lucide-react'

interface BackupStatus {
  timestamp: string
  companyInfo: {
    id: string
    name: string
    totalRecords: number
  }
  counts: {
    users: number
    companies: number
    owners: number
    properties: number
    bankAccounts: number
    leads: number
    contracts: number
    payments: number
    tenants: number
    maintenances: number
  }
  lastActivity: {
    lastUserUpdate: {
      date: string
      user: string
    } | null
    lastOwnerUpdate: {
      date: string
      owner: string
    } | null
  }
  backup: {
    available: boolean
    downloadUrl: string
    recommendedFrequency: string
    estimatedSize: string
  }
}

export default function AdminBackup() {
  const [status, setStatus] = useState<BackupStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBackupStatus()
  }, [])

  const fetchBackupStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/backup/status')
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setStatus(data)
      setError(null)
    } catch (error) {
      console.error('Erro ao buscar status:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const downloadBackup = async () => {
    try {
      setDownloading(true)
      
      const response = await fetch('/api/backup/working')
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      // Obter nome do arquivo do header
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 
                      `backup-ultraphink-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      
      // Fazer download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      console.log('✅ Backup baixado:', filename)
      
    } catch (error) {
      console.error('❌ Erro no download:', error)
      alert(`Erro ao baixar backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#f63c6a'}}></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold mb-2">❌ Erro ao Carregar Backup</h2>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={fetchBackupStatus}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Shield className="w-8 h-8 mr-3" style={{color: '#f63c6a'}} />
              Backup do Sistema
            </h1>
            <p className="text-gray-600 mt-2">
              Proteja todos os dados do seu CRM com backup completo
            </p>
          </div>
          
          <button
            onClick={downloadBackup}
            disabled={downloading}
            className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            style={{backgroundColor: downloading ? '#9ca3af' : '#f63c6a'}}
          >
            <Download className="w-5 h-5 mr-2" />
            {downloading ? 'Gerando Backup...' : 'Baixar Backup Agora'}
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4" style={{borderLeftColor: '#f63c6a'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Registros</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {status?.companyInfo.totalRecords.toLocaleString()}
                </p>
              </div>
              <Database className="w-12 h-12 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tamanho Estimado</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {status?.backup.estimatedSize}
                </p>
              </div>
              <Download className="w-12 h-12 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Empresa</p>
                <p className="text-xl font-bold text-gray-900 mt-2">
                  {status?.companyInfo.name}
                </p>
              </div>
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Detalhes dos Dados */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Database className="w-6 h-6 mr-2" style={{color: '#f63c6a'}} />
            Dados Incluídos no Backup
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-2" style={{color: '#f63c6a'}} />
              <p className="text-2xl font-bold text-gray-900">{status?.counts.users}</p>
              <p className="text-sm text-gray-600">Usuários</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Home className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-gray-900">{status?.counts.owners}</p>
              <p className="text-sm text-gray-600">Proprietários</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-gray-900">{status?.counts.properties}</p>
              <p className="text-sm text-gray-600">Propriedades</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-gray-900">{status?.counts.bankAccounts}</p>
              <p className="text-sm text-gray-600">Contas Bancárias</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold text-gray-900">
                {(status?.counts.leads || 0) + (status?.counts.contracts || 0) + (status?.counts.payments || 0)}
              </p>
              <p className="text-sm text-gray-600">Outros Dados</p>
            </div>
          </div>
        </div>

        {/* Última Atividade */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Clock className="w-6 h-6 mr-2" style={{color: '#f63c6a'}} />
            Última Atividade
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {status?.lastActivity.lastUserUpdate && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-900">Último Usuário Atualizado</p>
                <p className="text-blue-700">{status.lastActivity.lastUserUpdate.user}</p>
                <p className="text-sm text-blue-600">
                  {new Date(status.lastActivity.lastUserUpdate.date).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
            
            {status?.lastActivity.lastOwnerUpdate && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-semibold text-green-900">Último Proprietário Atualizado</p>
                <p className="text-green-700">{status.lastActivity.lastOwnerUpdate.owner}</p>
                <p className="text-sm text-green-600">
                  {new Date(status.lastActivity.lastOwnerUpdate.date).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <h2 className="text-lg font-bold text-gray-900 mb-3">💡 Como Usar o Backup</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>1. Backup Regular:</strong> Recomendamos fazer backup diariamente</p>
            <p><strong>2. Download:</strong> Clique em "Baixar Backup Agora" para obter arquivo JSON</p>
            <p><strong>3. Armazenamento:</strong> Salve o arquivo em local seguro (nuvem, pendrive)</p>
            <p><strong>4. Emergência:</strong> Em caso de problema, use o arquivo para restaurar dados</p>
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-center text-sm text-gray-500">
          <p>Última verificação: {status ? new Date(status.timestamp).toLocaleString('pt-BR') : 'N/A'}</p>
        </div>
      </div>
    </DashboardLayout>
  )
}