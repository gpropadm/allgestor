'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { UserForm } from '@/components/user-form'
import { ConfirmationModal } from '@/components/confirmation-modal'
import { ToastContainer, useToast } from '@/components/toast'
import { Plus, Search, Building2, Edit, Trash2, User, Shield, Lock, Unlock, Calendar } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  isBlocked: boolean
  lastLogin: string | null
  createdAt: string
  company: {
    id: string
    name: string
    tradeName: string | null
  } | null
}

export default function Users() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: User | null; loading: boolean }>({
    isOpen: false,
    user: null,
    loading: false
  })
  const [hasApiError, setHasApiError] = useState(false)
  
  const { toasts, removeToast, showSuccess, showError } = useToast()

  // Verificar se é admin usando a mesma lógica da página de settings
  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/users/profile')
      if (response.ok) {
        const userData = await response.json()
        const isExplicitAdmin = userData.role === 'ADMIN'
        const isFallbackAdmin = userData.id === '1' || userData.email?.toLowerCase().includes('admin')
        setIsAdmin(isExplicitAdmin || isFallbackAdmin)
      } else {
        setIsAdmin(false)
      }
    } catch (error) {
      console.log('Erro ao verificar status de admin:', error)
      setIsAdmin(false)
    }
  }

  // Verificar se o usuário tem permissão para acessar esta página
  useEffect(() => {
    if (status === 'loading') return // Ainda carregando a sessão
    
    if (!session) {
      router.push('/login')
      return
    }
    
    checkAdminStatus()
  }, [session, status, router])

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    } else if (!loading && !isAdmin && session) {
      // Se não é admin e não está carregando, redirecionar
      router.push('/dashboard')
    }
  }, [isAdmin, loading, session, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
        setHasApiError(false)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setHasApiError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (data: any) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchUsers()
        setShowForm(false)
        showSuccess('Usuário criado', 'Usuário criado com sucesso!')
      } else {
        const errorData = await response.json()
        showError('Erro ao criar usuário', errorData.error || 'Erro ao criar usuário')
        throw new Error(errorData.error || 'Erro ao criar usuário')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  const handleEditUser = async (data: any) => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchUsers()
        setShowForm(false)
        setEditingUser(null)
        showSuccess('Usuário atualizado', 'Usuário atualizado com sucesso!')
      } else {
        const errorData = await response.json()
        showError('Erro ao atualizar usuário', errorData.error || 'Erro ao atualizar usuário')
        throw new Error(errorData.error || 'Erro ao atualizar usuário')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/block`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isBlocked: !currentStatus }),
      })

      if (response.ok) {
        await fetchUsers()
        showSuccess(
          !currentStatus ? 'Usuário bloqueado' : 'Usuário desbloqueado',
          `Usuário ${!currentStatus ? 'bloqueado' : 'desbloqueado'} com sucesso!`
        )
      } else {
        showError('Erro', 'Erro ao alterar status do usuário')
      }
    } catch (error) {
      console.error('Error toggling user block status:', error)
    }
  }

  const openDeleteModal = (user: User) => {
    setDeleteModal({ isOpen: true, user, loading: false })
  }

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, user: null, loading: false })
  }

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return

    setDeleteModal(prev => ({ ...prev, loading: true }))

    try {
      const response = await fetch(`/api/users/${deleteModal.user.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        showSuccess('Usuário deletado', data.message || 'Usuário deletado com sucesso!')
        await fetchUsers()
        closeDeleteModal()
      } else {
        const errorData = await response.json()
        showError('Erro ao deletar usuário', errorData.error || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      showError('Erro de conexão', 'Erro de conexão ao deletar usuário. Tente novamente.')
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  const openEditForm = (user: User) => {
    setEditingUser(user)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingUser(null)
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin'
      case 'ADMIN': return 'Administrador'
      case 'USER': return 'Usuário'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-800'
      case 'ADMIN': return 'bg-blue-100 text-blue-800'
      case 'USER': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (isActive: boolean, isBlocked: boolean) => {
    if (isBlocked) return 'bg-red-100 text-red-800'
    if (!isActive) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusLabel = (isActive: boolean, isBlocked: boolean) => {
    if (isBlocked) return 'Bloqueado'
    if (!isActive) return 'Inativo'
    return 'Ativo'
  }

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive && !u.isBlocked).length,
    blocked: users.filter(u => u.isBlocked).length,
    admins: users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length
  }

  // Mostrar loading enquanto verifica permissões ou carrega dados
  if (status === 'loading' || loading || !isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#f63c6a'}}></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
            <p className="text-gray-600 mt-1">
              Gerencie usuários e permissões do sistema
            </p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
            style={{backgroundColor: '#f63c6a'}}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.backgroundColor = '#e03659'
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.backgroundColor = '#f63c6a'
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Usuário
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold text-green-900 mt-2">{stats.active}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Unlock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuários Bloqueados</p>
                <p className="text-2xl font-bold text-red-900 mt-2">{stats.blocked}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Administradores</p>
                <p className="text-2xl font-bold text-blue-900 mt-2">{stats.admins}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar usuários por nome, email ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Função
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {user.company ? user.company.tradeName || user.company.name : 'Sem empresa'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.isActive, user.isBlocked)}`}>
                        {getStatusLabel(user.isActive, user.isBlocked)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString('pt-BR')
                          : 'Nunca'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.isBlocked 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                          title={user.isBlocked ? 'Desbloquear usuário' : 'Bloquear usuário'}
                        >
                          {user.isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => openEditForm(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar usuário"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(user)}
                          disabled={user.email === session?.user?.email}
                          className={`p-2 rounded-lg transition-colors ${
                            user.email === session?.user?.email
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                          title={
                            user.email === session?.user?.email 
                              ? 'Você não pode deletar sua própria conta'
                              : 'Deletar usuário'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum usuário encontrado
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Tente ajustar os termos de busca.' 
                : 'Comece adicionando um novo usuário ao sistema.'}
            </p>
          </div>
        )}

        {/* User Form Modal */}
        <UserForm
          isOpen={showForm}
          onClose={closeForm}
          onSubmit={editingUser ? handleEditUser : handleCreateUser}
          user={editingUser}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteUser}
          title="Deletar Usuário"
          message={`Tem certeza que deseja deletar o usuário "${deleteModal.user?.name}"? Esta ação não pode ser desfeita e todos os dados relacionados serão removidos.`}
          type="delete"
          confirmText="Deletar"
          cancelText="Cancelar"
          loading={deleteModal.loading}
        />

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </DashboardLayout>
  )
}