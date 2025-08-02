'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal'
import { ToastContainer, useToast } from '@/components/toast'
import { 
  Plus,
  Search,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Trash2,
  Edit,
  Receipt,
  TrendingDown,
  Filter
} from 'lucide-react'

interface Expense {
  id: number
  description: string
  amount: number
  category: string
  date: string
  year: number
  month: number
  type: string
  receipt?: string
  notes?: string
  createdAt: string
}

const categories = [
  'Manutenção',
  'Marketing',
  'Escritório',
  'Tecnologia',
  'Transporte',
  'Alimentação',
  'Consultoria',
  'Impostos',
  'Seguro',
  'Outros'
]

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())
  
  const { toasts, removeToast, showSuccess, showError } = useToast()

  // Função para formatar valor em moeda brasileira
  const formatCurrency = (value: string) => {
    // Remove tudo que não é dígito
    const numericValue = value.replace(/\D/g, '')
    
    // Se estiver vazio, retorna vazio
    if (!numericValue) return ''
    
    // Converte para centavos e depois para reais
    const realValue = parseInt(numericValue) / 100
    
    // Formata como moeda brasileira
    return realValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Função para converter valor formatado para número
  const parseCurrency = (value: string) => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
  }

  // Função para formatar data sem problemas de fuso horário
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    
    try {
      // Se a data vem no formato YYYY-MM-DD, usar diretamente
      if (dateString.includes('-') && dateString.length === 10) {
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
      }
      
      // Se a data vem no formato ISO, extrair apenas a parte da data
      if (dateString.includes('T')) {
        const datePart = dateString.split('T')[0]
        const [year, month, day] = datePart.split('-')
        return `${day}/${month}/${year}`
      }
      
      // Para outros formatos, tentar parsear
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString // Retorna o original se não conseguir parsear
      }
      
      return date.toLocaleDateString('pt-BR')
    } catch (error) {
      console.error('Error formatting date:', error, dateString)
      return dateString // Retorna o original em caso de erro
    }
  }

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: categories[0],
    date: new Date().toISOString().split('T')[0],
    type: 'operational',
    notes: ''
  })


  useEffect(() => {
    fetchExpenses()
  }, [filterYear, filterMonth])


  const initializeExpensesTable = async () => {
    try {
      console.log('🔧 Initializing expenses table...')
      const response = await fetch('/api/create-expenses-table', {
        method: 'POST'
      })
      if (response.ok) {
        console.log('✅ Expenses table initialized')
        return true
      }
    } catch (error) {
      console.error('Error initializing table:', error)
    }
    return false
  }

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/expenses?year=${filterYear}&month=${filterMonth}`)
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      } else {
        // Se falhar, tentar inicializar a tabela
        console.log('📊 Attempting to initialize expenses table...')
        const initialized = await initializeExpensesTable()
        if (initialized) {
          // Tentar buscar novamente após inicializar
          const retryResponse = await fetch(`/api/expenses?year=${filterYear}&month=${filterMonth}`)
          if (retryResponse.ok) {
            const data = await retryResponse.json()
            setExpenses(data)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const method = editingExpense ? 'PUT' : 'POST'
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses'
      
      // Converter valor formatado para número antes de enviar
      const dataToSend = {
        ...formData,
        amount: parseCurrency(formData.amount)
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const responseData = await response.json()
        await fetchExpenses()
        setShowModal(false)
        setEditingExpense(null)
        setFormData({
          description: '',
          amount: '',
          category: categories[0],
          date: new Date().toISOString().split('T')[0],
          type: 'operational',
          notes: ''
        })
        const message = editingExpense ? 'Despesa atualizada!' : 'Despesa criada!'
        const description = editingExpense ? 'A despesa foi atualizada com sucesso.' : 'A despesa foi criada com sucesso.'
        showSuccess(message, description)
      } else {
        const errorData = await response.json()
        
        // Se for erro de tabela não existir, tentar inicializar
        if (errorData.error?.includes('table') || errorData.error?.includes('relation') || response.status === 500) {
          console.log('🔧 Table may not exist, trying to initialize...')
          const initialized = await initializeExpensesTable()
          if (initialized) {
            // Tentar submeter novamente
            const retryResponse = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dataToSend)
            })
            
            if (retryResponse.ok) {
              await fetchExpenses()
              setShowModal(false)
              setEditingExpense(null)
              setFormData({
                description: '',
                amount: '',
                category: categories[0],
                date: new Date().toISOString().split('T')[0],
                type: 'operational',
                notes: ''
              })
              const message = editingExpense ? 'Despesa atualizada!' : 'Despesa criada!'
              const description = editingExpense ? 'A despesa foi atualizada com sucesso.' : 'A despesa foi criada com sucesso.'
              showSuccess(message, description)
              return
            }
          }
        }
        
        showError('Erro ao salvar despesa', errorData.error || 'Tente novamente.')
      }
    } catch (error) {
      console.error('Error saving expense:', error)
      showError('Erro ao salvar despesa', 'Verifique sua conexão e tente novamente.')
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    
    // Formatar data para o input (YYYY-MM-DD)
    const formattedDate = expense.date ? new Date(expense.date).toISOString().split('T')[0] : ''
    
    // Formatar valor para moeda brasileira
    const formattedAmount = expense.amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    
    setFormData({
      description: expense.description,
      amount: formattedAmount,
      category: expense.category,
      date: formattedDate,
      type: expense.type,
      notes: expense.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (expense: Expense) => {
    setExpenseToDelete(expense)
    setShowDeleteModal(true)
  }

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return

    try {
      const response = await fetch(`/api/expenses/${expenseToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const responseData = await response.json()
        await fetchExpenses()
        showSuccess('Despesa excluída!', 'A despesa foi removida com sucesso.')
      } else {
        showError('Erro ao excluir despesa', 'Tente novamente.')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      showError('Erro ao excluir despesa', 'Verifique sua conexão e tente novamente.')
    } finally {
      setExpenseToDelete(null)
    }
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  const stats = {
    total: expenses.length,
    totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
    byCategory: categories.map(category => ({
      category,
      amount: expenses.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0),
      count: expenses.filter(e => e.category === category).length
    })).filter(c => c.count > 0).sort((a, b) => b.amount - a.amount)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Despesas</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie todas as despesas da empresa
            </p>
          </div>
          <button 
            onClick={() => {
              setEditingExpense(null)
              setFormData({
                description: '',
                amount: '',
                category: categories[0],
                date: new Date().toISOString().split('T')[0],
                type: 'operational',
                notes: ''
              })
              setShowModal(true)
            }}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
            style={{backgroundColor: '#f63c6a'}}
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Despesa
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Despesas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-400 mt-2">
                  R$ {stats.totalAmount.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Maior Categoria</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                  {stats.byCategory[0]?.category || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  R$ {stats.byCategory[0]?.amount.toLocaleString('pt-BR') || '0'}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <Tag className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar despesas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({length: 12}, (_, i) => (
                <option key={i+1} value={i+1}>
                  {new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' })}
                </option>
              ))}
            </select>

            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({length: 5}, (_, i) => (
                <option key={2024-i} value={2024-i}>{2024-i}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expenses List */}
        <div className="space-y-4">
          {filteredExpenses.map((expense) => (
            <div key={expense.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#fee2e2'}}>
                    <TrendingDown className="w-5 h-5" style={{color: '#dc2626'}} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {expense.description}
                      </h3>
                      <div className="flex items-center space-x-2 ml-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          {expense.category}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valor:</div>
                        <div className="flex items-center text-gray-900 dark:text-white">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span className="font-bold text-red-600">R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Data:</div>
                        <div className="flex items-center text-gray-900 dark:text-white">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="font-medium">{formatDate(expense.date)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo:</div>
                        <div className="flex items-center text-gray-900 dark:text-white">
                          <span className="truncate text-sm">{expense.type}</span>
                        </div>
                      </div>
                    </div>
                    {expense.notes && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <strong>Observações:</strong> {expense.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end mt-3">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEdit(expense)}
                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                    title="Editar despesa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(expense)}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                    title="Excluir despesa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <TrendingDown className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma despesa encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filterCategory !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando uma nova despesa.'}
            </p>
          </div>
        )}

        {/* Summary */}
        {filteredExpenses.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Resumo do Período
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-red-800 dark:text-red-200">Total de Despesas:</span>
                <span className="font-bold ml-2">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="text-red-800 dark:text-red-200">Quantidade:</span>
                <span className="font-bold ml-2">{filteredExpenses.length} despesas</span>
              </div>
              <div>
                <span className="text-red-800 dark:text-red-200">Média por Despesa:</span>
                <span className="font-bold ml-2">R$ {(totalExpenses / filteredExpenses.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição *
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valor *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                        R$
                      </span>
                      <input
                        type="text"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: formatCurrency(e.target.value) }))}
                        placeholder="0,00"
                        className="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoria *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="operational">Operacional</option>
                      <option value="administrative">Administrativo</option>
                      <option value="marketing">Marketing</option>
                      <option value="maintenance">Manutenção</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Observações
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        setEditingExpense(null)
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingExpense ? 'Atualizar' : 'Criar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setExpenseToDelete(null)
          }}
          onConfirm={confirmDeleteExpense}
          title="Excluir Despesa"
          message="Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita."
          itemName={expenseToDelete?.description}
          confirmText="Sim, excluir"
          cancelText="Cancelar"
        />

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </DashboardLayout>
  )
}