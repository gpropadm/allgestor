'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Plus, Edit, Trash2, Settings, CheckCircle, XCircle } from 'lucide-react'

interface ServiceCategory {
  id: string
  name: string
  type: 'COMISSAO' | 'RENDIMENTO' | 'IMPOSTO_RETIDO'
  description?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export default function DimobCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'COMISSAO' as const,
    description: '',
    active: true
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/dimob/service-categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        console.error('Erro ao carregar categorias')
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const method = editingCategory ? 'PUT' : 'POST'
      const url = editingCategory 
        ? `/api/dimob/service-categories/${editingCategory.id}`
        : '/api/dimob/service-categories'
        
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await loadCategories()
        resetForm()
        setShowForm(false)
      } else {
        console.error('Erro ao salvar categoria')
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'COMISSAO',
      description: '',
      active: true
    })
    setEditingCategory(null)
  }

  const startEdit = (category: ServiceCategory) => {
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || '',
      active: category.active
    })
    setEditingCategory(category)
    setShowForm(true)
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'COMISSAO': return 'Comissão'
      case 'RENDIMENTO': return 'Rendimento'  
      case 'IMPOSTO_RETIDO': return 'Imposto Retido'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'COMISSAO': return 'bg-blue-100 text-blue-800'
      case 'RENDIMENTO': return 'bg-green-100 text-green-800'  
      case 'IMPOSTO_RETIDO': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Settings className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">⚙️ Configurações DIMOB</h1>
                <p className="text-blue-100 mt-2">
                  Configure as categorias de serviços para classificação correta na DIMOB
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Nova Categoria</span>
            </button>
          </div>
        </div>

        {/* Explicação */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-amber-900 mb-3">
            📋 Como funcionam as categorias DIMOB
          </h3>
          <div className="text-sm text-amber-800 space-y-2">
            <p><strong>Comissão:</strong> Serviços que ficam com a imobiliária (Taxa de Administração, Taxa de Locação)</p>
            <p><strong>Rendimento:</strong> Valores repassados ao proprietário (Aluguel)</p>
            <p><strong>Imposto Retido:</strong> Impostos pagos a terceiros (IRRF, PIS, COFINS, INSS)</p>
          </div>
        </div>

        {/* Lista de Categorias */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Categorias de Serviços</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(category.type)}`}>
                        {getTypeLabel(category.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{category.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.active ? (
                        <span className="inline-flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-600">
                          <XCircle className="w-4 h-4 mr-1" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => startEdit(category)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma categoria configurada</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Taxa de Administração"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="COMISSAO">Comissão</option>
                  <option value="RENDIMENTO">Rendimento</option>
                  <option value="IMPOSTO_RETIDO">Imposto Retido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descrição opcional da categoria"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                  Categoria ativa
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCategory ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}