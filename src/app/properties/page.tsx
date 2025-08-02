'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { PropertyForm } from '@/components/property-form'
import { ToastContainer, useToast } from '@/components/toast'
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal'
import { Plus, Search, MapPin, Bed, Bath, Square, Edit, Trash2, FileText } from 'lucide-react'
import { IPTUInfo } from '@/components/iptu-info'

interface Property {
  id: string
  title: string
  description: string
  address: string
  city: string
  state: string
  zipCode: string
  propertyRegistration: string | null
  bedrooms: number
  bathrooms: number
  area: number
  rentPrice: number
  salePrice: number | null
  propertyType: string
  status: string
  images: string[]
  amenities: string[]
  owner: {
    id: string
    name: string
    email: string
  }
}

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null)
  const [showIPTUInfo, setShowIPTUInfo] = useState<string | null>(null)
  
  const { toasts, removeToast, showSuccess, showError } = useToast()

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      console.log('🏠 Fetching properties...')
      const response = await fetch('/api/properties')
      console.log('📡 Properties response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Properties data:', data)
        setProperties(Array.isArray(data) ? data : [])
      } else {
        const errorData = await response.json()
        console.error('❌ Properties API error:', errorData)
        showError('Erro ao carregar imóveis', errorData.error || 'Erro desconhecido')
        setProperties([])
      }
    } catch (error) {
      console.error('❌ Network error fetching properties:', error)
      showError('Erro de conexão', 'Não foi possível carregar os imóveis')
      setProperties([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProperty = async (data: any) => {
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          images: JSON.stringify(data.images),
          amenities: JSON.stringify(data.amenities)
        }),
      })

      if (response.ok) {
        await fetchProperties()
        setShowForm(false)
        showSuccess('Imóvel criado!', 'O imóvel foi cadastrado com sucesso.')
        
        // Dispatch custom event to notify other components about property creation
        window.dispatchEvent(new CustomEvent('propertyCreated'))
      } else {
        const errorData = await response.json()
        showError('Erro ao criar imóvel', errorData.error || 'Tente novamente.')
      }
    } catch (error) {
      console.error('Error creating property:', error)
      showError('Erro ao criar imóvel', 'Verifique sua conexão e tente novamente.')
    }
  }

  const handleEditProperty = async (data: any) => {
    if (!editingProperty) return

    try {
      const response = await fetch(`/api/properties/${editingProperty.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          images: JSON.stringify(data.images),
          amenities: JSON.stringify(data.amenities)
        }),
      })

      if (response.ok) {
        await fetchProperties()
        setShowForm(false)
        setEditingProperty(null)
        showSuccess('Imóvel atualizado!', 'As informações foram atualizadas com sucesso.')
        
        // Dispatch custom event to notify other components about property update
        window.dispatchEvent(new CustomEvent('propertyUpdated'))
      } else {
        const errorData = await response.json()
        showError('Erro ao atualizar imóvel', errorData.error || 'Tente novamente.')
      }
    } catch (error) {
      console.error('Error updating property:', error)
      showError('Erro ao atualizar imóvel', 'Verifique sua conexão e tente novamente.')
    }
  }

  const handleDirectDeleteProperty = async (property: Property) => {
    setPropertyToDelete(property)
    setShowDeleteModal(true)
  }

  const confirmDeleteProperty = async () => {
    if (!propertyToDelete) return

    try {
      setDeletingPropertyId(propertyToDelete.id)
      const response = await fetch(`/api/properties/${propertyToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showSuccess('Imóvel excluído!', 'O imóvel foi removido com sucesso.')
        await fetchProperties()
        
        // Dispatch custom event to notify other components about property deletion
        window.dispatchEvent(new CustomEvent('propertyUpdated'))
      } else {
        const errorData = await response.json()
        showError('Erro ao excluir imóvel', errorData.error || 'Tente novamente.')
      }
    } catch (error) {
      console.error('Error deleting property:', error)
      showError('Erro ao excluir imóvel', 'Verifique sua conexão e tente novamente.')
    } finally {
      setDeletingPropertyId(null)
      setPropertyToDelete(null)
    }
  }


  const openEditForm = (property: Property) => {
    setEditingProperty(property)
    setShowForm(true)
  }


  const closeForm = () => {
    setShowForm(false)
    setEditingProperty(null)
  }

  const toggleIPTUInfo = (propertyId: string) => {
    setShowIPTUInfo(showIPTUInfo === propertyId ? null : propertyId)
  }

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || property.status === filterStatus
    const matchesType = filterType === 'all' || property.propertyType === filterType

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800'
      case 'RENTED':
        return 'bg-blue-100 text-blue-800'
      case 'SOLD':
        return 'bg-gray-100 text-gray-800'
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Disponível'
      case 'RENTED':
        return 'Alugado'
      case 'SOLD':
        return 'Vendido'
      case 'MAINTENANCE':
        return 'Manutenção'
      default:
        return status
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'APARTMENT':
        return 'Apartamento'
      case 'HOUSE':
        return 'Casa'
      case 'COMMERCIAL':
        return 'Comercial'
      case 'LAND':
        return 'Terreno'
      case 'STUDIO':
        return 'Studio'
      default:
        return type
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Imóveis</h1>
            <p className="text-gray-600 mt-1">
              Gerencie todos os imóveis do seu portfólio
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
            Novo Imóvel
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar imóveis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="AVAILABLE">Disponível</option>
                <option value="RENTED">Alugado</option>
                <option value="SOLD">Vendido</option>
                <option value="MAINTENANCE">Manutenção</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Tipos</option>
                <option value="APARTMENT">Apartamento</option>
                <option value="HOUSE">Casa</option>
                <option value="COMMERCIAL">Comercial</option>
                <option value="LAND">Terreno</option>
                <option value="STUDIO">Studio</option>
              </select>
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Imóvel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Características
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Proprietário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProperties.map((property) => (
                  <tr key={property.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    deletingPropertyId === property.id ? 'opacity-60 bg-red-50' : ''
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {property.images.length > 0 ? (
                            <img 
                              src={property.images[0]} 
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              Sem imagem
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{property.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{getTypeText(property.propertyType)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div>{property.address}</div>
                            <div className="text-gray-500 dark:text-gray-400">{property.city} - {property.state}</div>
                            <div className="text-gray-500 dark:text-gray-400">CEP: {property.zipCode}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Bed className="w-4 h-4 mr-1 text-gray-400" />
                            <span>{property.bedrooms}</span>
                          </div>
                          <div className="flex items-center">
                            <Bath className="w-4 h-4 mr-1 text-gray-400" />
                            <span>{property.bathrooms}</span>
                          </div>
                          <div className="flex items-center">
                            <Square className="w-4 h-4 mr-1 text-gray-400" />
                            <span>{property.area}m²</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="font-bold">
                          R$ {property.rentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês
                        </div>
                        {property.salePrice && (
                          <div className="text-gray-500 dark:text-gray-400">
                            Venda: R$ {property.salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="font-medium">{property.owner.name}</div>
                        <div className="text-gray-500 dark:text-gray-400">{property.owner.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.status)}`}>
                        {getStatusText(property.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => toggleIPTUInfo(property.id)}
                          className={`p-2 hover:bg-blue-50 rounded-lg transition-colors ${
                            showIPTUInfo === property.id ? 'bg-blue-50 text-blue-700' : 'text-blue-600'
                          }`}
                          title="Consultar IPTU"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openEditForm(property)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          style={{color: '#f63c6a'}}
                          title="Editar imóvel"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDirectDeleteProperty(property)}
                          disabled={deletingPropertyId === property.id}
                          className={`p-2 text-red-600 hover:text-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${
                            deletingPropertyId === property.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Deletar imóvel"
                        >
                          {deletingPropertyId === property.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredProperties.map((property) => (
            <div 
              key={property.id} 
              className={`bg-white rounded-xl shadow-sm p-4 transition-all duration-200 ${
                deletingPropertyId === property.id 
                  ? 'opacity-60 bg-red-50' 
                  : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {property.images.length > 0 ? (
                    <img 
                      src={property.images[0]} 
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      Sem imagem
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {property.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {getTypeText(property.propertyType)}
                      </p>
                    </div>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
                      {getStatusText(property.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-start text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{property.address}, {property.city}</span>
                </div>
                
                <div className="flex items-center space-x-4 text-gray-600">
                  <div className="flex items-center">
                    <Bed className="w-4 h-4 mr-1" />
                    <span className="text-sm">{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="w-4 h-4 mr-1" />
                    <span className="text-sm">{property.bathrooms}</span>
                  </div>
                  <div className="flex items-center">
                    <Square className="w-4 h-4 mr-1" />
                    <span className="text-sm">{property.area}m²</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    R$ {property.rentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês
                  </p>
                  <p className="text-xs text-gray-500">
                    {property.owner.name}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => toggleIPTUInfo(property.id)}
                    className={`p-2 hover:bg-blue-50 rounded-lg transition-colors ${
                      showIPTUInfo === property.id ? 'bg-blue-50 text-blue-700' : 'text-blue-600'
                    }`}
                    title="Consultar IPTU"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openEditForm(property)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    style={{color: '#f63c6a'}}
                    title="Editar imóvel"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDirectDeleteProperty(property)}
                    disabled={deletingPropertyId === property.id}
                    className={`p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
                      deletingPropertyId === property.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Deletar imóvel"
                  >
                    {deletingPropertyId === property.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* IPTU Information Panel */}
        {showIPTUInfo && (() => {
          const selectedProperty = filteredProperties.find(p => p.id === showIPTUInfo)
          return selectedProperty ? (
            <div className="mt-6">
              <IPTUInfo 
                propertyRegistration={selectedProperty.propertyRegistration}
                propertyAddress={`${selectedProperty.address}, ${selectedProperty.city} - ${selectedProperty.state}`}
              />
            </div>
          ) : null
        })()}

        {filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum imóvel encontrado
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece adicionando um novo imóvel ao sistema.'}
            </p>
          </div>
        )}

        {/* Property Form Modal */}
        <PropertyForm
          isOpen={showForm}
          onClose={closeForm}
          onSubmit={editingProperty ? handleEditProperty : handleCreateProperty}
          property={editingProperty}
        />




        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setPropertyToDelete(null)
          }}
          onConfirm={confirmDeleteProperty}
          title="Excluir Imóvel"
          message="Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita."
          itemName={propertyToDelete?.title}
          confirmText="Sim, excluir"
          cancelText="Cancelar"
        />
      </div>
    </DashboardLayout>
  )
}