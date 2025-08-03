'use client'

import React, { useState, useEffect } from 'react'

interface PropertyLocation {
  id: string
  title: string
  address: string
  latitude: number
  longitude: number
  price: number
  propertyType: string
  bedrooms: number
  area: number
  status: 'AVAILABLE' | 'RENTED' | 'SOLD'
  nearbyPoints?: NearbyPoint[]
  walkabilityScore?: number
}

interface NearbyPoint {
  name: string
  type: 'school' | 'hospital' | 'market' | 'transport' | 'park' | 'bank'
  distance: number
  rating?: number
}

interface PropertyMapProps {
  properties: PropertyLocation[]
  centerLat?: number
  centerLng?: number
  onPropertySelect?: (property: PropertyLocation) => void
  showFilters?: boolean
  leadCriteria?: {
    maxPrice?: number
    minBedrooms?: number
    preferredTypes?: string[]
  }
}

const NEARBY_POINT_ICONS = {
  school: '🏫',
  hospital: '🏥',
  market: '🛒',
  transport: '🚌',
  park: '🌳',
  bank: '🏦'
}

export function PropertyMap({ 
  properties, 
  centerLat = -23.5505, 
  centerLng = -46.6333,
  onPropertySelect,
  showFilters = true,
  leadCriteria
}: PropertyMapProps) {
  const [selectedProperty, setSelectedProperty] = useState<PropertyLocation | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [filters, setFilters] = useState({
    priceRange: [0, 2000000],
    propertyTypes: [] as string[],
    minBedrooms: 0,
    showNearbyPoints: true,
    radiusKm: 5
  })
  const [searchAddress, setSearchAddress] = useState('')

  useEffect(() => {
    // Simular carregamento do mapa (Google Maps API seria carregada aqui)
    setTimeout(() => setMapLoaded(true), 1000)
  }, [])

  const filteredProperties = properties.filter(property => {
    if (leadCriteria) {
      if (leadCriteria.maxPrice && property.price > leadCriteria.maxPrice) return false
      if (leadCriteria.minBedrooms && property.bedrooms < leadCriteria.minBedrooms) return false
      if (leadCriteria.preferredTypes && !leadCriteria.preferredTypes.includes(property.propertyType)) return false
    }

    if (filters.priceRange[0] > property.price || filters.priceRange[1] < property.price) return false
    if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(property.propertyType)) return false
    if (filters.minBedrooms > property.bedrooms) return false

    return true
  })

  const handlePropertyClick = (property: PropertyLocation) => {
    setSelectedProperty(property)
    if (onPropertySelect) {
      onPropertySelect(property)
    }
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371 // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const getPropertyIcon = (property: PropertyLocation) => {
    const icons = {
      APARTMENT: '🏢',
      HOUSE: '🏠',
      COMMERCIAL: '🏪',
      LAND: '🏞️',
      STUDIO: '🏠'
    }
    return icons[property.propertyType as keyof typeof icons] || '🏠'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      AVAILABLE: 'bg-green-500',
      RENTED: 'bg-yellow-500',
      SOLD: 'bg-red-500'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-500'
  }

  const searchAddressOnMap = async () => {
    // Simulação de geocoding - em produção seria Google Geocoding API
    console.log(`🔍 Buscando: ${searchAddress}`)
    
    // Simulação de resultado
    const mockResult = {
      address: searchAddress,
      lat: centerLat + (Math.random() - 0.5) * 0.1,
      lng: centerLng + (Math.random() - 0.5) * 0.1
    }
    
    console.log('📍 Resultado:', mockResult)
  }

  if (!mapLoaded) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">🗺️ Mapa de Propriedades</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {filteredProperties.length} propriedades encontradas
            </span>
          </div>
        </div>
        
        {/* Busca por Endereço */}
        <div className="mt-4 flex space-x-2">
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            placeholder="Buscar endereço no mapa..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && searchAddressOnMap()}
          />
          <button
            onClick={searchAddressOnMap}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔍 Buscar
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Filtros Laterais */}
        {showFilters && (
          <div className="w-80 p-4 border-r border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-4">🎛️ Filtros</h3>
            
            {/* Faixa de Preço */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Faixa de Preço
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="2000000"
                  step="50000"
                  value={filters.priceRange[1]}
                  onChange={(e) => setFilters({
                    ...filters,
                    priceRange: [filters.priceRange[0], Number(e.target.value)]
                  })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>R$ 0</span>
                  <span className="font-medium text-blue-600">
                    R$ {filters.priceRange[1].toLocaleString()}
                  </span>
                  <span>R$ 2M</span>
                </div>
              </div>
            </div>

            {/* Tipo de Propriedade */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Propriedade
              </label>
              <div className="space-y-2">
                {['APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.propertyTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({
                            ...filters,
                            propertyTypes: [...filters.propertyTypes, type]
                          })
                        } else {
                          setFilters({
                            ...filters,
                            propertyTypes: filters.propertyTypes.filter(t => t !== type)
                          })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      {getPropertyIcon({ propertyType: type } as PropertyLocation)} {type}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quartos Mínimos */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quartos Mínimos
              </label>
              <select
                value={filters.minBedrooms}
                onChange={(e) => setFilters({
                  ...filters,
                  minBedrooms: Number(e.target.value)
                })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Qualquer</option>
                <option value={1}>1+</option>
                <option value={2}>2+</option>
                <option value={3}>3+</option>
                <option value={4}>4+</option>
              </select>
            </div>

            {/* Pontos de Interesse */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showNearbyPoints}
                  onChange={(e) => setFilters({
                    ...filters,
                    showNearbyPoints: e.target.checked
                  })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  Mostrar pontos de interesse
                </span>
              </label>
            </div>

            {/* Compatibilidade com Lead */}
            {leadCriteria && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  🎯 Critérios do Lead
                </h4>
                <div className="space-y-1 text-xs text-blue-700">
                  {leadCriteria.maxPrice && (
                    <p>Orçamento: até R$ {leadCriteria.maxPrice.toLocaleString()}</p>
                  )}
                  {leadCriteria.minBedrooms && (
                    <p>Quartos: {leadCriteria.minBedrooms}+ quartos</p>
                  )}
                  {leadCriteria.preferredTypes && (
                    <p>Tipos: {leadCriteria.preferredTypes.join(', ')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Área do Mapa */}
        <div className="flex-1 relative">
          {/* Mapa Simulado */}
          <div className="h-96 bg-gradient-to-br from-blue-100 to-green-100 relative overflow-hidden">
            {/* Grid do Mapa */}
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className={`absolute ${i % 2 === 0 ? 'h-full border-l' : 'w-full border-t'} border-gray-300`} 
                     style={{ [i % 2 === 0 ? 'left' : 'top']: `${(i / 20) * 100}%` }} />
              ))}
            </div>

            {/* Propriedades no Mapa */}
            {filteredProperties.map((property, index) => {
              const x = 20 + (index % 8) * 80 + Math.random() * 40
              const y = 20 + Math.floor(index / 8) * 80 + Math.random() * 40
              
              return (
                <div
                  key={property.id}
                  className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 ${
                    selectedProperty?.id === property.id ? 'scale-125 z-10' : ''
                  }`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onClick={() => handlePropertyClick(property)}
                >
                  {/* Pin da Propriedade */}
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-full ${getStatusColor(property.status)} 
                                   flex items-center justify-center text-white text-lg shadow-lg
                                   ${selectedProperty?.id === property.id ? 'ring-4 ring-blue-400' : ''}`}>
                      {getPropertyIcon(property)}
                    </div>
                    
                    {/* Tooltip */}
                    <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                                   bg-white p-2 rounded-lg shadow-lg border min-w-48 z-20
                                   ${selectedProperty?.id === property.id ? 'block' : 'hidden'}`}>
                      <h4 className="font-medium text-gray-900 text-sm">{property.title}</h4>
                      <p className="text-xs text-gray-600 mb-1">{property.address}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-green-600">
                          R$ {property.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {property.bedrooms}Q • {property.area}m²
                        </span>
                      </div>
                      
                      {/* Walkability Score */}
                      {property.walkabilityScore && (
                        <div className="mt-2 flex items-center">
                          <span className="text-xs text-gray-600">Caminhabilidade:</span>
                          <div className="ml-2 flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={`text-xs ${
                                i < Math.floor(property.walkabilityScore! / 20) ? 'text-yellow-400' : 'text-gray-300'
                              }`}>⭐</span>
                            ))}
                            <span className="ml-1 text-xs text-gray-600">
                              {property.walkabilityScore}/100
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Pontos de Interesse */}
            {filters.showNearbyPoints && selectedProperty?.nearbyPoints && (
              <>
                {selectedProperty.nearbyPoints.map((point, index) => {
                  const angle = (index / selectedProperty.nearbyPoints!.length) * 2 * Math.PI
                  const radius = 60 + point.distance * 5
                  const x = 50 + Math.cos(angle) * radius / 4
                  const y = 50 + Math.sin(angle) * radius / 4
                  
                  return (
                    <div
                      key={`${selectedProperty.id}-${index}`}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      <div className="bg-white rounded-full p-1 shadow-md border-2 border-gray-200">
                        <span className="text-sm">
                          {NEARBY_POINT_ICONS[point.type]}
                        </span>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 
                                    bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {point.name} ({point.distance.toFixed(1)}km)
                      </div>
                    </div>
                  )
                })}
              </>
            )}

            {/* Controles do Mapa */}
            <div className="absolute top-4 right-4 space-y-2">
              <button className="bg-white p-2 rounded shadow hover:bg-gray-50 transition-colors">
                🔍 +
              </button>
              <button className="bg-white p-2 rounded shadow hover:bg-gray-50 transition-colors">
                🔍 -
              </button>
              <button className="bg-white p-2 rounded shadow hover:bg-gray-50 transition-colors">
                🧭
              </button>
            </div>

            {/* Legenda */}
            <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Legenda</h4>
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-600">Disponível</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-600">Alugado</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-600">Vendido</span>
                </div>
              </div>
            </div>
          </div>

          {/* Informações da Propriedade Selecionada */}
          {selectedProperty && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{selectedProperty.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedProperty.address}</p>
                  
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-lg font-bold text-green-600">
                      R$ {selectedProperty.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-600">
                      {selectedProperty.bedrooms} quartos • {selectedProperty.area}m²
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                      getStatusColor(selectedProperty.status)
                    }`}>
                      {selectedProperty.status}
                    </span>
                  </div>

                  {/* Pontos Próximos */}
                  {selectedProperty.nearbyPoints && selectedProperty.nearbyPoints.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Pontos de Interesse Próximos:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProperty.nearbyPoints.slice(0, 4).map((point, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 bg-white rounded-full text-xs text-gray-700 border">
                            {NEARBY_POINT_ICONS[point.type]} {point.name} ({point.distance.toFixed(1)}km)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => console.log('Ver detalhes', selectedProperty.id)}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Ver Detalhes
                  </button>
                  <button
                    onClick={() => console.log('Agendar visita', selectedProperty.id)}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Agendar Visita
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}