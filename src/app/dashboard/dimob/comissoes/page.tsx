'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  Plus, 
  Pencil,
  Trash2,
  DollarSign,
  Calendar,
  User,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface DimobCommission {
  id: string
  cpfCnpj: string
  nome: string
  valorComissao: number
  competencia: Date
  valorPis: number
  valorCofins: number
  valorInss: number
  valorIr: number
  descricao?: string
  contratoId?: string
  ativo: boolean
  createdAt: Date
  updatedAt: Date
}

interface CommissionForm {
  cpfCnpj: string
  nome: string
  valorComissao: string
  competencia: string
  valorPis: string
  valorCofins: string
  valorInss: string
  valorIr: string
  descricao: string
}

export default function DimobComissoesPage() {
  const [commissions, setCommissions] = useState<DimobCommission[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState<CommissionForm>({
    cpfCnpj: '',
    nome: '',
    valorComissao: '',
    competencia: '',
    valorPis: '0',
    valorCofins: '0',
    valorInss: '0',
    valorIr: '0',
    descricao: ''
  })

  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // Carregar comissões
  const loadCommissions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/dimob/comissoes?year=${selectedYear}`)
      const result = await response.json()
      
      if (result.success) {
        setCommissions(result.data)
      } else {
        console.error('Erro ao carregar comissões:', result.error)
      }
    } catch (error) {
      console.error('Erro ao carregar comissões:', error)
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
      const url = editingId ? `/api/dimob/comissoes/${editingId}` : '/api/dimob/comissoes'
      
      const formData = {
        ...form,
        valorComissao: parseFloat(form.valorComissao.replace(',', '.')),
        valorPis: parseFloat(form.valorPis.replace(',', '.') || '0'),
        valorCofins: parseFloat(form.valorCofins.replace(',', '.') || '0'),
        valorInss: parseFloat(form.valorInss.replace(',', '.') || '0'),
        valorIr: parseFloat(form.valorIr.replace(',', '.') || '0'),
        competencia: new Date(form.competencia)
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      
      if (result.success) {
        resetForm()
        loadCommissions()
      } else {
        alert('Erro: ' + result.error)
      }
    } catch (error) {
      alert('Erro ao salvar comissão')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  // Excluir comissão
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta comissão?')) return

    try {
      const response = await fetch(`/api/dimob/comissoes/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        loadCommissions()
      } else {
        alert('Erro ao excluir: ' + result.error)
      }
    } catch (error) {
      alert('Erro ao excluir comissão')
      console.error(error)
    }
  }

  // Editar comissão
  const handleEdit = (commission: DimobCommission) => {
    setForm({
      cpfCnpj: commission.cpfCnpj,
      nome: commission.nome,
      valorComissao: commission.valorComissao.toString(),
      competencia: commission.competencia.toISOString().substring(0, 7), // YYYY-MM
      valorPis: commission.valorPis.toString(),
      valorCofins: commission.valorCofins.toString(),
      valorInss: commission.valorInss.toString(),
      valorIr: commission.valorIr.toString(),
      descricao: commission.descricao || ''
    })
    setEditingId(commission.id)
    setShowForm(true)
  }

  // Reset form
  const resetForm = () => {
    setForm({
      cpfCnpj: '',
      nome: '',
      valorComissao: '',
      competencia: '',
      valorPis: '0',
      valorCofins: '0',
      valorInss: '0',
      valorIr: '0',
      descricao: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  // Filtrar comissões
  const filteredCommissions = commissions.filter(commission =>
    commission.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commission.cpfCnpj.includes(searchTerm) ||
    commission.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Formatação
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDocument = (doc: string) => {
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

  useEffect(() => {
    loadCommissions()
  }, [selectedYear])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comissões (COM)</h1>
            <p className="text-gray-600">Gestão de comissões pagas para DIMOB</p>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Comissão
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Comissões</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(filteredCommissions.reduce((sum, c) => sum + c.valorComissao, 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Comissionados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(filteredCommissions.map(c => c.cpfCnpj)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Registros</p>
                <p className="text-2xl font-bold text-gray-900">{filteredCommissions.length}</p>
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
                placeholder="Buscar por nome, CPF/CNPJ ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
                      Comissionado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CPF/CNPJ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Competência
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tributos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCommissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{commission.nome}</div>
                          {commission.descricao && (
                            <div className="text-sm text-gray-500">{commission.descricao}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDocument(commission.cpfCnpj)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(commission.competencia)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(commission.valorComissao)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          {commission.valorPis > 0 && <div>PIS: {formatCurrency(commission.valorPis)}</div>}
                          {commission.valorCofins > 0 && <div>COFINS: {formatCurrency(commission.valorCofins)}</div>}
                          {commission.valorInss > 0 && <div>INSS: {formatCurrency(commission.valorInss)}</div>}
                          {commission.valorIr > 0 && <div>IR: {formatCurrency(commission.valorIr)}</div>}
                          {(commission.valorPis + commission.valorCofins + commission.valorInss + commission.valorIr) === 0 && (
                            <span className="text-gray-400">Sem tributos</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(commission)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(commission.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredCommissions.length === 0 && !loading && (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma comissão encontrada para {selectedYear}</p>
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
                    {editingId ? 'Editar Comissão' : 'Nova Comissão'}
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
                        Nome/Razão Social *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.nome}
                        onChange={(e) => setForm({ ...form, nome: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nome do comissionado"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CPF/CNPJ *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.cpfCnpj}
                        onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="CPF ou CNPJ (apenas números)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor da Comissão *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.valorComissao}
                        onChange={(e) => setForm({ ...form, valorComissao: e.target.value })}
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

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tributos Retidos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PIS
                        </label>
                        <input
                          type="text"
                          value={form.valorPis}
                          onChange={(e) => setForm({ ...form, valorPis: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0,00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          COFINS
                        </label>
                        <input
                          type="text"
                          value={form.valorCofins}
                          onChange={(e) => setForm({ ...form, valorCofins: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0,00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          INSS
                        </label>
                        <input
                          type="text"
                          value={form.valorInss}
                          onChange={(e) => setForm({ ...form, valorInss: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0,00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          IR
                        </label>
                        <input
                          type="text"
                          value={form.valorIr}
                          onChange={(e) => setForm({ ...form, valorIr: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Descrição da comissão (opcional)"
                    />
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingId ? 'Salvar Alterações' : 'Cadastrar Comissão'}
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