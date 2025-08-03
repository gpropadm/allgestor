// Serviço de Geolocalização e Análise de Localização
// Enriquece propriedades com dados de localização e pontos de interesse

import { prisma } from './prisma'

interface GeocodeResult {
  latitude: number
  longitude: number
  formattedAddress: string
  neighborhood?: string
  city: string
  state: string
  postalCode?: string
}

interface NearbyPoint {
  name: string
  type: 'school' | 'hospital' | 'market' | 'transport' | 'park' | 'bank' | 'restaurant' | 'pharmacy'
  distance: number
  rating?: number
  address?: string
  coordinates: {
    latitude: number
    longitude: number
  }
}

interface WalkabilityAnalysis {
  score: number // 0-100
  factors: {
    publicTransport: number
    walkingPaths: number
    commercialDensity: number
    safety: number
    accessibility: number
  }
  description: string
}

interface LocationAnalysis {
  property: {
    id: string
    address: string
  }
  coordinates: {
    latitude: number
    longitude: number
  }
  neighborhood: string
  nearbyPoints: NearbyPoint[]
  walkabilityScore: number
  marketValue: {
    averagePrice: number
    priceRange: { min: number; max: number }
    appreciationTrend: 'rising' | 'stable' | 'declining'
  }
  commuteTimes: {
    downtown: number
    airport: number
    businessDistrict: number
  }
  demographics: {
    averageIncome: number
    populationDensity: number
    educationLevel: string
  }
}

export class GeolocationService {
  
  // === GEOCODING ===
  
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    try {
      // Simulação de API de geocoding (Google/Here/Mapbox)
      console.log(`🌍 Geocoding: ${address}`)
      
      // Em produção, seria algo como:
      // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`)
      
      // Simulação de resultado baseado no endereço
      const mockResult: GeocodeResult = {
        latitude: -23.5505 + (Math.random() - 0.5) * 0.1,
        longitude: -46.6333 + (Math.random() - 0.5) * 0.1,
        formattedAddress: address,
        neighborhood: this.extractNeighborhood(address),
        city: this.extractCity(address),
        state: this.extractState(address),
        postalCode: this.extractPostalCode(address)
      }
      
      return mockResult
    } catch (error) {
      console.error('Erro no geocoding:', error)
      return null
    }
  }
  
  private extractNeighborhood(address: string): string {
    const neighborhoods = [
      'Vila Madalena', 'Pinheiros', 'Jardins', 'Moema', 'Brooklin',
      'Vila Olímpia', 'Itaim Bibi', 'Perdizes', 'Higienópolis', 'Liberdade',
      'Copacabana', 'Ipanema', 'Leblon', 'Barra da Tijuca', 'Tijuca'
    ]
    
    const found = neighborhoods.find(n => address.toLowerCase().includes(n.toLowerCase()))
    return found || 'Centro'
  }
  
  private extractCity(address: string): string {
    if (address.toLowerCase().includes('rio de janeiro')) return 'Rio de Janeiro'
    if (address.toLowerCase().includes('são paulo')) return 'São Paulo'
    if (address.toLowerCase().includes('belo horizonte')) return 'Belo Horizonte'
    if (address.toLowerCase().includes('brasília')) return 'Brasília'
    return 'São Paulo'
  }
  
  private extractState(address: string): string {
    if (address.toLowerCase().includes('rio de janeiro')) return 'RJ'
    if (address.toLowerCase().includes('são paulo')) return 'SP'
    if (address.toLowerCase().includes('minas gerais')) return 'MG'
    if (address.toLowerCase().includes('brasília')) return 'DF'
    return 'SP'
  }
  
  private extractPostalCode(address: string): string | undefined {
    const postalCodeMatch = address.match(/\d{5}-?\d{3}/)
    return postalCodeMatch ? postalCodeMatch[0] : undefined
  }
  
  // === PONTOS DE INTERESSE ===
  
  async findNearbyPoints(latitude: number, longitude: number, radiusKm = 2): Promise<NearbyPoint[]> {
    try {
      // Simulação de busca por pontos próximos
      const mockPoints: NearbyPoint[] = [
        {
          name: 'Hospital Sírio-Libanês',
          type: 'hospital',
          distance: 0.8,
          rating: 4.8,
          address: 'Rua Adma Jafet, 91',
          coordinates: { latitude: latitude + 0.005, longitude: longitude + 0.005 }
        },
        {
          name: 'Escola Estadual Prof. João Silva',
          type: 'school',
          distance: 0.3,
          rating: 4.2,
          address: 'Rua das Flores, 123',
          coordinates: { latitude: latitude + 0.002, longitude: longitude - 0.002 }
        },
        {
          name: 'Estação de Metrô',
          type: 'transport',
          distance: 0.5,
          rating: 4.0,
          address: 'Av. Principal, 456',
          coordinates: { latitude: latitude - 0.003, longitude: longitude + 0.004 }
        },
        {
          name: 'Supermercado Pão de Açúcar',
          type: 'market',
          distance: 0.2,
          rating: 4.3,
          address: 'Rua do Comércio, 789',
          coordinates: { latitude: latitude + 0.001, longitude: longitude + 0.001 }
        },
        {
          name: 'Parque Ibirapuera',
          type: 'park',
          distance: 1.2,
          rating: 4.7,
          address: 'Av. Paulista, 1000',
          coordinates: { latitude: latitude + 0.008, longitude: longitude - 0.006 }
        },
        {
          name: 'Banco Itaú',
          type: 'bank',
          distance: 0.4,
          rating: 3.9,
          address: 'Rua Augusta, 200',
          coordinates: { latitude: latitude - 0.002, longitude: longitude - 0.003 }
        }
      ]
      
      // Filtrar por raio e ordenar por distância
      return mockPoints
        .filter(point => point.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
    } catch (error) {
      console.error('Erro ao buscar pontos próximos:', error)
      return []
    }
  }
  
  // === ANÁLISE DE CAMINHABILIDADE ===
  
  async calculateWalkabilityScore(latitude: number, longitude: number, nearbyPoints: NearbyPoint[]): Promise<WalkabilityAnalysis> {
    try {
      const factors = {
        publicTransport: this.calculateTransportScore(nearbyPoints),
        walkingPaths: this.calculateWalkingPathsScore(latitude, longitude),
        commercialDensity: this.calculateCommercialDensityScore(nearbyPoints),
        safety: this.calculateSafetyScore(latitude, longitude),
        accessibility: this.calculateAccessibilityScore(nearbyPoints)
      }
      
      // Score médio ponderado
      const score = Math.round(
        factors.publicTransport * 0.3 +
        factors.walkingPaths * 0.2 +
        factors.commercialDensity * 0.2 +
        factors.safety * 0.15 +
        factors.accessibility * 0.15
      )
      
      const description = this.getWalkabilityDescription(score)
      
      return { score, factors, description }
    } catch (error) {
      console.error('Erro no cálculo de caminhabilidade:', error)
      return {
        score: 50,
        factors: {
          publicTransport: 50,
          walkingPaths: 50,
          commercialDensity: 50,
          safety: 50,
          accessibility: 50
        },
        description: 'Análise indisponível'
      }
    }
  }
  
  private calculateTransportScore(nearbyPoints: NearbyPoint[]): number {
    const transportPoints = nearbyPoints.filter(p => p.type === 'transport')
    if (transportPoints.length === 0) return 20
    
    const closestTransport = Math.min(...transportPoints.map(p => p.distance))
    if (closestTransport <= 0.3) return 100
    if (closestTransport <= 0.5) return 80
    if (closestTransport <= 0.8) return 60
    if (closestTransport <= 1.2) return 40
    return 20
  }
  
  private calculateWalkingPathsScore(latitude: number, longitude: number): number {
    // Simulação baseada na densidade urbana
    const urbanDensity = Math.random() * 100
    return Math.round(urbanDensity)
  }
  
  private calculateCommercialDensityScore(nearbyPoints: NearbyPoint[]): number {
    const commercialPoints = nearbyPoints.filter(p => 
      ['market', 'restaurant', 'pharmacy', 'bank'].includes(p.type)
    )
    
    if (commercialPoints.length >= 10) return 100
    if (commercialPoints.length >= 7) return 80
    if (commercialPoints.length >= 5) return 60
    if (commercialPoints.length >= 3) return 40
    if (commercialPoints.length >= 1) return 20
    return 0
  }
  
  private calculateSafetyScore(latitude: number, longitude: number): number {
    // Simulação de dados de segurança
    return Math.round(60 + Math.random() * 40)
  }
  
  private calculateAccessibilityScore(nearbyPoints: NearbyPoint[]): number {
    const essentialServices = nearbyPoints.filter(p => 
      ['hospital', 'school', 'market', 'pharmacy'].includes(p.type)
    )
    
    return Math.min(100, essentialServices.length * 25)
  }
  
  private getWalkabilityDescription(score: number): string {
    if (score >= 90) return 'Excelente - Praticamente tudo acessível a pé'
    if (score >= 80) return 'Muito bom - Maioria dos serviços próximos'
    if (score >= 70) return 'Bom - Boa infraestrutura para pedestres'
    if (score >= 60) return 'Razoável - Alguns serviços acessíveis a pé'
    if (score >= 40) return 'Regular - Necessário transporte para a maioria'
    return 'Limitado - Altamente dependente de transporte'
  }
  
  // === ANÁLISE COMPLETA DE LOCALIZAÇÃO ===
  
  async analyzePropertyLocation(propertyId: string): Promise<LocationAnalysis | null> {
    try {
      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      })
      
      if (!property) {
        throw new Error('Propriedade não encontrada')
      }
      
      // Geocoding do endereço
      const geocodeResult = await this.geocodeAddress(property.address)
      if (!geocodeResult) {
        throw new Error('Erro no geocoding')
      }
      
      // Buscar pontos próximos
      const nearbyPoints = await this.findNearbyPoints(
        geocodeResult.latitude,
        geocodeResult.longitude
      )
      
      // Calcular caminhabilidade
      const walkabilityAnalysis = await this.calculateWalkabilityScore(
        geocodeResult.latitude,
        geocodeResult.longitude,
        nearbyPoints
      )
      
      // Análise de mercado
      const marketValue = await this.analyzeMarketValue(
        geocodeResult.neighborhood,
        property.propertyType
      )
      
      // Tempos de deslocamento
      const commuteTimes = await this.calculateCommuteTimes(
        geocodeResult.latitude,
        geocodeResult.longitude
      )
      
      // Demografia da região
      const demographics = await this.getDemographics(geocodeResult.neighborhood)
      
      const analysis: LocationAnalysis = {
        property: {
          id: propertyId,
          address: property.address
        },
        coordinates: {
          latitude: geocodeResult.latitude,
          longitude: geocodeResult.longitude
        },
        neighborhood: geocodeResult.neighborhood || 'Não identificado',
        nearbyPoints,
        walkabilityScore: walkabilityAnalysis.score,
        marketValue,
        commuteTimes,
        demographics
      }
      
      // Salvar dados de localização no banco
      await this.saveLocationData(propertyId, analysis)
      
      return analysis
    } catch (error) {
      console.error('Erro na análise de localização:', error)
      return null
    }
  }
  
  private async analyzeMarketValue(neighborhood: string, propertyType: string) {
    // Simulação de análise de mercado
    const basePrice = 500000
    const neighborhoodMultiplier = this.getNeighborhoodMultiplier(neighborhood)
    const typeMultiplier = this.getPropertyTypeMultiplier(propertyType)
    
    const averagePrice = basePrice * neighborhoodMultiplier * typeMultiplier
    
    return {
      averagePrice,
      priceRange: {
        min: averagePrice * 0.7,
        max: averagePrice * 1.4
      },
      appreciationTrend: this.getAppreciationTrend(neighborhood) as 'rising' | 'stable' | 'declining'
    }
  }
  
  private getNeighborhoodMultiplier(neighborhood: string): number {
    const multipliers: Record<string, number> = {
      'Jardins': 2.5,
      'Vila Madalena': 2.2,
      'Pinheiros': 2.0,
      'Moema': 1.8,
      'Vila Olímpia': 1.9,
      'Copacabana': 1.6,
      'Ipanema': 2.3,
      'Leblon': 2.8,
      'Centro': 1.0
    }
    
    return multipliers[neighborhood] || 1.2
  }
  
  private getPropertyTypeMultiplier(propertyType: string): number {
    const multipliers: Record<string, number> = {
      'APARTMENT': 1.0,
      'HOUSE': 1.3,
      'COMMERCIAL': 0.8,
      'LAND': 0.6,
      'STUDIO': 0.7
    }
    
    return multipliers[propertyType] || 1.0
  }
  
  private getAppreciationTrend(neighborhood: string): string {
    const trends = ['rising', 'stable', 'declining']
    // Bairros nobres tendem a ter valorização
    if (['Jardins', 'Vila Madalena', 'Ipanema', 'Leblon'].includes(neighborhood)) {
      return 'rising'
    }
    return trends[Math.floor(Math.random() * trends.length)]
  }
  
  private async calculateCommuteTimes(latitude: number, longitude: number) {
    // Simulação de cálculo de tempo de deslocamento
    return {
      downtown: Math.round(15 + Math.random() * 30), // 15-45 min
      airport: Math.round(30 + Math.random() * 60),  // 30-90 min
      businessDistrict: Math.round(10 + Math.random() * 25) // 10-35 min
    }
  }
  
  private async getDemographics(neighborhood: string) {
    // Simulação de dados demográficos
    const baseIncome = 5000
    const neighborhoodFactor = this.getNeighborhoodMultiplier(neighborhood)
    
    return {
      averageIncome: baseIncome * neighborhoodFactor,
      populationDensity: Math.round(1000 + Math.random() * 5000),
      educationLevel: neighborhoodFactor > 2 ? 'Superior' : 
                      neighborhoodFactor > 1.5 ? 'Médio' : 'Fundamental'
    }
  }
  
  private async saveLocationData(propertyId: string, analysis: LocationAnalysis) {
    try {
      await prisma.locationData.upsert({
        where: { propertyId },
        update: {
          latitude: analysis.coordinates.latitude,
          longitude: analysis.coordinates.longitude,
          addressFormatted: analysis.property.address,
          neighborhood: analysis.neighborhood,
          nearbyPoints: JSON.stringify(analysis.nearbyPoints),
          walkabilityScore: analysis.walkabilityScore,
          lastUpdated: new Date()
        },
        create: {
          propertyId,
          latitude: analysis.coordinates.latitude,
          longitude: analysis.coordinates.longitude,
          addressFormatted: analysis.property.address,
          neighborhood: analysis.neighborhood,
          nearbyPoints: JSON.stringify(analysis.nearbyPoints),
          walkabilityScore: analysis.walkabilityScore
        }
      })
    } catch (error) {
      console.error('Erro ao salvar dados de localização:', error)
    }
  }
  
  // === BATCH PROCESSING ===
  
  async enrichAllProperties(companyId: string, limit = 50) {
    try {
      const properties = await prisma.property.findMany({
        where: { 
          companyId,
          // Propriedades sem dados de localização recentes
        },
        take: limit
      })
      
      const results = []
      for (const property of properties) {
        try {
          const analysis = await this.analyzePropertyLocation(property.id)
          if (analysis) {
            results.push(analysis)
          }
          
          // Delay para evitar rate limiting em APIs
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`Erro na análise da propriedade ${property.id}:`, error)
        }
      }
      
      return { success: true, data: results }
    } catch (error) {
      return { success: false, error: `Erro no batch processing: ${error}` }
    }
  }
  
  // === RELATÓRIOS ===
  
  async getLocationInsights(companyId: string) {
    try {
      const locationData = await prisma.locationData.findMany({
        // Filtrar por propriedades da empresa seria ideal aqui
      })
      
      const insights = {
        totalProperties: locationData.length,
        averageWalkability: locationData.reduce((sum, d) => sum + (d.walkabilityScore || 0), 0) / locationData.length,
        topNeighborhoods: this.getTopNeighborhoods(locationData),
        walkabilityDistribution: this.getWalkabilityDistribution(locationData)
      }
      
      return { success: true, data: insights }
    } catch (error) {
      return { success: false, error: `Erro ao gerar insights: ${error}` }
    }
  }
  
  private getTopNeighborhoods(locationData: any[]) {
    const neighborhoods = locationData.reduce((acc, item) => {
      if (item.neighborhood) {
        acc[item.neighborhood] = (acc[item.neighborhood] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(neighborhoods)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))
  }
  
  private getWalkabilityDistribution(locationData: any[]) {
    const ranges = {
      'Excelente (90-100)': 0,
      'Muito Bom (80-89)': 0,
      'Bom (70-79)': 0,
      'Regular (60-69)': 0,
      'Limitado (0-59)': 0
    }
    
    locationData.forEach(item => {
      const score = item.walkabilityScore || 0
      if (score >= 90) ranges['Excelente (90-100)']++
      else if (score >= 80) ranges['Muito Bom (80-89)']++
      else if (score >= 70) ranges['Bom (70-79)']++
      else if (score >= 60) ranges['Regular (60-69)']++
      else ranges['Limitado (0-59)']++
    })
    
    return ranges
  }
}

export const geolocationService = new GeolocationService()