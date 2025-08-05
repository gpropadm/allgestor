'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  Download, 
  FileText, 
  Calendar,
  Building,
  User,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react'

interface DimobSummary {
  totalProperties: number
  totalTenants: number
  totalOwners: number
  totalGrossValue: number
  totalAdminFee: number
  totalNetValue: number
  monthsCount: number
  recordsCount: number
  totalCommissions: number
  totalDeductions: number
  commissionsCount: number
  deductionsCount: number
}

interface DimobRecord {
  month: string
  contractId: string
  ownerDocument: string
  ownerName: string
  tenantDocument: string
  tenantName: string
  propertyAddress: string
  propertyCity: string
  propertyState: string
  grossValue: number
  adminFee: number
  netValue: number
}

interface DimobCommission {
  cpfCnpj: string
  nome: string
  valorComissao: number
  competencia: string
  valorPis?: number
  valorCofins?: number
  valorInss?: number
  valorIr?: number
  descricao?: string
}

interface DimobDeduction {
  tipoDeducao: '01' | '02' | '03' | '04'
  valorDeducao: number
  competencia: string
  descricao: string
  proprietarioDoc?: string
  inquilinoDoc?: string
}

export default function DimobGeneratePage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [dimobData, setDimobData] = useState<{
    summary: DimobSummary
    records: DimobRecord[]
    commissions: DimobCommission[]
    deductions: DimobDeduction[]
    company: { cnpj: string; name: string }
  } | null>(null)
  const [generatedFile, setGeneratedFile] = useState<{
    fileName: string
    content: string
  } | null>(null)

  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const loadDimobData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/dimob?year=${selectedYear}`)
      const result = await response.json()
      
      if (result.success) {
        setDimobData(result.data)
      } else {
        alert('Erro ao carregar dados: ' + result.error)
      }
    } catch (error) {
      alert('Erro ao carregar dados DIMOB')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const generateDimobFile = async () => {
    if (!dimobData) return
    
    setLoading(true)
    try {
      // Usar uma nova rota específica para gerar DIMOB com dados já carregados
      const response = await fetch(`/api/dimob/generate?year=${selectedYear}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()
      
      if (result.success && result.data.dimobFile) {
        setGeneratedFile(result.data.dimobFile)
      } else {
        alert('Erro ao gerar arquivo: ' + (result.error || 'Erro desconhecido'))
      }
    } catch (error) {
      alert('Erro ao gerar arquivo DIMOB')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = () => {
    if (!generatedFile) return
    
    const blob = new Blob([generatedFile.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = generatedFile.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  useEffect(() => {
    loadDimobData()
  }, [selectedYear])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerar DIMOB</h1>
            <p className="text-gray-600">Geração de arquivo TXT para Receita Federal</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
              <span className="text-lg text-gray-600">Carregando dados...</span>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {dimobData && !loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Imóveis</p>
                    <p className="text-2xl font-bold text-gray-900">{dimobData.summary.totalProperties}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Inquilinos</p>
                    <p className="text-2xl font-bold text-gray-900">{dimobData.summary.totalTenants}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Receita Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(dimobData.summary.totalGrossValue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-orange-100">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Registros VEN</p>
                    <p className="text-2xl font-bold text-gray-900">{dimobData.summary.recordsCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Comissões COM</p>
                    <p className="text-2xl font-bold text-gray-900">{dimobData.summary.commissionsCount}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(dimobData.summary.totalCommissions)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Deduções DED</p>
                    <p className="text-2xl font-bold text-gray-900">{dimobData.summary.deductionsCount}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(dimobData.summary.totalDeductions)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados da Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Razão Social</p>
                  <p className="font-medium text-gray-900">{dimobData.company.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">CNPJ</p>
                  <p className="font-medium text-gray-900">{dimobData.company.cnpj}</p>
                </div>
              </div>
            </div>

            {/* Records Preview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Registros para DIMOB ({dimobData.records.length})
                </h3>
              </div>

              {dimobData.records.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum registro encontrado para o ano {selectedYear}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mês
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Proprietário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inquilino
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Bruto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Taxa Admin
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Líquido
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dimobData.records.slice(0, 10).map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.month.substring(4, 6)}/{record.month.substring(0, 4)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.ownerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.tenantName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(record.grossValue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(record.adminFee)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(record.netValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {dimobData.records.length > 10 && (
                    <div className="mt-4 text-center text-sm text-gray-500">
                      Mostrando 10 de {dimobData.records.length} registros
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Generate File Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Gerar Arquivo DIMOB</h3>
                  <p className="text-gray-600">Arquivo TXT no formato oficial da Receita Federal</p>
                </div>
                
                {dimobData.records.length > 0 && (
                  <button
                    onClick={generateDimobFile}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Gerar Arquivo
                  </button>
                )}
              </div>

              {generatedFile && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-green-900">Arquivo gerado com sucesso!</p>
                        <p className="text-sm text-green-700">{generatedFile.fileName}</p>
                      </div>
                    </div>
                    <button
                      onClick={downloadFile}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}