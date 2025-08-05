'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  Plus, 
  Pencil,
  Trash2,
  DollarSign,
  Calendar,
  AlertTriangle,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface DimobDeduction {
  id: string
  tipoDeducao: string
  valorDeducao: number
  competencia: Date
  descricao: string
  contratoId?: string
  proprietarioDoc?: string
  inquilinoDoc?: string
  ativo: boolean
  createdAt: Date
  updatedAt: Date
}

interface DeductionForm {
  tipoDeducao: string
  valorDeducao: string
  competencia: string
  descricao: string
  proprietarioDoc: string
  inquilinoDoc: string
}

const DEDUCTION_TYPES = {
  '01': { label: 'Desconto', icon: '💰', color: 'bg-green-100 text-green-800' },
  '02': { label: 'Reparo', icon: '🔧', color: 'bg-yellow-100 text-yellow-800' },
  '03': { label: 'Inadimplência', icon: '⚠️', color: 'bg-red-100 text-red-800' },
  '04': { label: 'Outros', icon: '📋', color: 'bg-gray-100 text-gray-800' }
}

export default function DimobDeducoesPage() {
  const [deductions, setDeductions] = useState<DimobDeduction[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [filterType, setFilterType] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState<DeductionForm>({
    tipoDeducao: '01',
    valorDeducao: '',
    competencia: '',
    descricao: '',
    proprietarioDoc: '',
    inquilinoDoc: ''
  })

  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // Carregar deduções
  const loadDeductions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/dimob/deducoes?year=${selectedYear}`)
      const result = await response.json()
      
      if (result.success) {
        setDeductions(result.data)
      } else {
        console.error('Erro ao carregar deduções:', result.error)
      }
    } catch (error) {
      console.error('Erro ao carregar deduções:', error)
    } finally {
      setLoading(false)
    }
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/dimob/deducoes/${editingId}` : '/api/dimob/deducoes'
      
      const formData = {
        ...form,
        valorDeducao: parseFloat(form.valorDeducao.replace(',', '.')),
        competencia: new Date(form.competencia),
        proprietarioDoc: form.proprietarioDoc || null,
        inquilinoDoc: form.inquilinoDoc || null
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      
      if (result.success) {
        resetForm()
        loadDeductions()
      } else {
        alert('Erro: ' + result.error)
      }
    } catch (error) {
      alert('Erro ao salvar dedução')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  // Excluir dedução
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta dedução?')) return

    try {
      const response = await fetch(`/api/dimob/deducoes/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        loadDeductions()
      } else {
        alert('Erro ao excluir: ' + result.error)
      }
    } catch (error) {
      alert('Erro ao excluir dedução')
      console.error(error)
    }
  }

  // Editar dedução
  const handleEdit = (deduction: DimobDeduction) => {
    setForm({
      tipoDeducao: deduction.tipoDeducao,
      valorDeducao: deduction.valorDeducao.toString(),
      competencia: deduction.competencia.toISOString().substring(0, 7), // YYYY-MM
      descricao: deduction.descricao,
      proprietarioDoc: deduction.proprietarioDoc || '',
      inquilinoDoc: deduction.inquilinoDoc || ''
    })
    setEditingId(deduction.id)
    setShowForm(true)
  }

  // Reset form
  const resetForm = () => {
    setForm({
      tipoDeducao: '01',
      valorDeducao: '',
      competencia: '',
      descricao: '',
      proprietarioDoc: '',
      inquilinoDoc: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  // Filtrar deduções
  const filteredDeductions = deductions.filter(deduction => {
    const matchesSearch = 
      deduction.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deduction.proprietarioDoc?.includes(searchTerm) ||
      deduction.inquilinoDoc?.includes(searchTerm)
    
    const matchesType = filterType === 'all' || deduction.tipoDeducao === filterType
    
    return matchesSearch && matchesType
  })

  // Formatação
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDocument = (doc: string) => {
    if (!doc) return '-'
    const cleanDoc = doc.replace(/\D/g, '')
    if (cleanDoc.length === 11) {
      return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else if (cleanDoc.length === 14) {
      return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return doc
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  // Estatísticas por tipo
  const statsByType = Object.keys(DEDUCTION_TYPES).map(type => {
    const typeDeductions = filteredDeductions.filter(d => d.tipoDeducao === type)
    return {
      type,
      label: DEDUCTION_TYPES[type as keyof typeof DEDUCTION_TYPES].label,
      count: typeDeductions.length,
      total: typeDeductions.reduce((sum, d) => sum + d.valorDeducao, 0)
    }
  })

  useEffect(() => {
    loadDeductions()
  }, [selectedYear])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deduções (DED)</h1>
            <p className="text-gray-600">Gestão de deduções e descontos para DIMOB</p>
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
            
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Dedução
            </button>
          </div>
        </div>

        {/* Stats by Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsByType.map(({ type, label, count, total }) => (
            <div key={type} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{label}</p>
                  <p className="text-xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(total)}</p>
                </div>
                <div className="p-3 rounded-full bg-gray-100">
                  <span className="text-2xl">
                    {DEDUCTION_TYPES[type as keyof typeof DEDUCTION_TYPES].icon}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Deduções</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(filteredDeductions.reduce((sum, d) => sum + d.valorDeducao, 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Registros</p>
                <p className="text-2xl font-bold text-gray-900">{filteredDeductions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ano Base</p>
                <p className="text-2xl font-bold text-gray-900">{selectedYear}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por descrição ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os tipos</option>
              {Object.entries(DEDUCTION_TYPES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
              <span className="text-lg text-gray-600">Carregando...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Competência
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documentos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDeductions.map((deduction) => {
                    const typeInfo = DEDUCTION_TYPES[deduction.tipoDeducao as keyof typeof DEDUCTION_TYPES]
                    return (
                      <tr key={deduction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{typeInfo.icon}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {deduction.descricao}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(deduction.competencia)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                          {formatCurrency(deduction.valorDeducao)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="space-y-1">
                            {deduction.proprietarioDoc && (
                              <div>Prop: {formatDocument(deduction.proprietarioDoc)}</div>
                            )}
                            {deduction.inquilinoDoc && (
                              <div>Inq: {formatDocument(deduction.inquilinoDoc)}</div>
                            )}
                            {!deduction.proprietarioDoc && !deduction.inquilinoDoc && (
                              <span className="text-gray-400">Sem documentos</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(deduction)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(deduction.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filteredDeductions.length === 0 && !loading && (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma dedução encontrada para {selectedYear}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingId ? 'Editar Dedução' : 'Nova Dedução'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Dedução *
                      </label>
                      <select
                        required
                        value={form.tipoDeducao}
                        onChange={(e) => setForm({ ...form, tipoDeducao: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Object.entries(DEDUCTION_TYPES).map(([key, { label, icon }]) => (
                          <option key={key} value={key}>
                            {icon} {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor da Dedução *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.valorDeducao}
                        onChange={(e) => setForm({ ...form, valorDeducao: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0,00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Competência (Mês/Ano) *
                      </label>
                      <input
                        type="month"
                        required
                        value={form.competencia}
                        onChange={(e) => setForm({ ...form, competencia: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição *
                    </label>
                    <textarea
                      required
                      value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Descreva a dedução..."
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Documentos Relacionados (Opcional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CPF/CNPJ do Proprietário
                        </label>
                        <input
                          type="text"
                          value={form.proprietarioDoc}
                          onChange={(e) => setForm({ ...form, proprietarioDoc: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="CPF ou CNPJ (apenas números)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CPF/CNPJ do Inquilino
                        </label>
                        <input
                          type="text"
                          value={form.inquilinoDoc}
                          onChange={(e) => setForm({ ...form, inquilinoDoc: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="CPF ou CNPJ (apenas números)"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-4 pt-6 border-t">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingId ? 'Salvar Alterações' : 'Cadastrar Dedução'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}