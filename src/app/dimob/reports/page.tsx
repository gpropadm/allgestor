'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  FileText, 
  Download,
  DollarSign,
  Building,
  User,
  Search
} from 'lucide-react'

interface ReportData {
  year: number
  totalContracts: number
  totalRevenue: number
  totalProperties: number
  totalTenants: number
  monthlyData: {
    month: string
    revenue: number
    contracts: number
  }[]
  ownerSummary: {
    document: string
    name: string
    properties: number
    revenue: number
  }[]
  tenantSummary: {
    document: string
    name: string
    totalPaid: number
    contractsCount: number
  }[]
}

export default function DimobReportsPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'owners' | 'tenants'>('all')

  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const loadReportData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/dimob?year=${selectedYear}`)
      const result = await response.json()
      
      if (result.success) {
        // Transform data for reports
        const records = result.data.records
        const monthlyRevenue = new Map<string, { revenue: number; contracts: number }>()
        const ownerRevenue = new Map<string, { name: string; revenue: number; properties: Set<string> }>()
        const tenantRevenue = new Map<string, { name: string; totalPaid: number; contracts: Set<string> }>()

        records.forEach((record: any) => {
          const monthKey = `${record.month.substring(4, 6)}/${record.month.substring(0, 4)}`
          
          // Monthly data
          if (!monthlyRevenue.has(monthKey)) {
            monthlyRevenue.set(monthKey, { revenue: 0, contracts: 0 })
          }
          const monthData = monthlyRevenue.get(monthKey)!
          monthData.revenue += record.grossValue
          monthData.contracts += 1

          // Owner data
          if (!ownerRevenue.has(record.ownerDocument)) {
            ownerRevenue.set(record.ownerDocument, {
              name: record.ownerName,
              revenue: 0,
              properties: new Set()
            })
          }
          const ownerData = ownerRevenue.get(record.ownerDocument)!
          ownerData.revenue += record.netValue
          ownerData.properties.add(record.propertyAddress)

          // Tenant data
          if (!tenantRevenue.has(record.tenantDocument)) {
            tenantRevenue.set(record.tenantDocument, {
              name: record.tenantName,
              totalPaid: 0,
              contracts: new Set()
            })
          }
          const tenantData = tenantRevenue.get(record.tenantDocument)!
          tenantData.totalPaid += record.grossValue
          tenantData.contracts.add(record.contractId)
        })

        setReportData({
          year: selectedYear,
          totalContracts: result.data.summary.recordsCount / 12, // Approximate active contracts
          totalRevenue: result.data.summary.totalGrossValue,
          totalProperties: result.data.summary.totalProperties,
          totalTenants: result.data.summary.totalTenants,
          monthlyData: Array.from(monthlyRevenue.entries()).map(([month, data]) => ({
            month,
            revenue: data.revenue,
            contracts: data.contracts
          })),
          ownerSummary: Array.from(ownerRevenue.entries()).map(([document, data]) => ({
            document,
            name: data.name,
            properties: data.properties.size,
            revenue: data.revenue
          })),
          tenantSummary: Array.from(tenantRevenue.entries()).map(([document, data]) => ({
            document,
            name: data.name,
            totalPaid: data.totalPaid,
            contractsCount: data.contracts.size
          }))
        })
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error)
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

  const formatDocument = (doc: string) => {
    const cleanDoc = doc.replace(/\D/g, '')
    if (cleanDoc.length === 11) {
      // CPF
      return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else if (cleanDoc.length === 14) {
      // CNPJ
      return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return doc
  }

  const filteredOwners = reportData?.ownerSummary.filter(owner =>
    owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.document.includes(searchTerm)
  ) || []

  const filteredTenants = reportData?.tenantSummary.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.document.includes(searchTerm)
  ) || []

  useEffect(() => {
    loadReportData()
  }, [selectedYear])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios DIMOB</h1>
            <p className="text-gray-600">Relatórios detalhados para contadores e auditoria</p>
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
            
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-lg text-gray-600">Carregando relatórios...</span>
            </div>
          </div>
        )}

        {reportData && !loading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Imóveis</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.totalProperties}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{reportData.totalTenants}</p>
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
                      {formatCurrency(reportData.totalRevenue)}
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
                    <p className="text-sm font-medium text-gray-500">Contratos</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(reportData.totalContracts)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Revenue Chart */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Receita Mensal {selectedYear}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mês
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receita
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contratos Ativos
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.monthlyData.map((monthData, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {monthData.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(monthData.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {monthData.contracts}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Filter and Search */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalhamento por Pessoa</h3>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou documento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as 'all' | 'owners' | 'tenants')}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos</option>
                    <option value="owners">Proprietários</option>
                    <option value="tenants">Inquilinos</option>
                  </select>
                </div>
              </div>

              {/* Owners Table */}
              {(filterType === 'all' || filterType === 'owners') && (
                <div className="mb-8">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Proprietários</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nome
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            CPF/CNPJ
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Imóveis
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Receita Líquida
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOwners.map((owner, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {owner.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDocument(owner.document)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {owner.properties}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(owner.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tenants Table */}
              {(filterType === 'all' || filterType === 'tenants') && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Inquilinos</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nome
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            CPF/CNPJ
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contratos
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Pago
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTenants.map((tenant, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {tenant.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDocument(tenant.document)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {tenant.contractsCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(tenant.totalPaid)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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