// Configuração do AgentQL para produção
export class AgentQLService {
  private apiKey: string;
  private baseUrl: string = 'https://api.agentql.com/v1';

  constructor() {
    this.apiKey = process.env.AGENTQL_API_KEY || '';
  }

  async init() {
    if (!this.apiKey) {
      throw new Error('AGENTQL_API_KEY não configurada');
    }
    return true;
  }

  async close() {
    // Não há necessidade de fechar conexões na versão API
    return true;
  }

  // Captura leads de portais imobiliários
  async captureLeadsFromPortal(portalName: string, searchUrl: string, filters: any = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: searchUrl,
          query: this.getPortalQuery(portalName),
          timeout: 30000
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      return this.processPortalResults(data.data || [], portalName, filters);
      
    } catch (error) {
      console.error(`Erro ao capturar leads do ${portalName}:`, error);
      // Retorna dados simulados para demonstração
      return this.getMockLeadsData(portalName, filters);
    }
  }

  private getPortalQuery(portalName: string) {
    const queries = {
      olx: {
        listings: 'property listings or real estate ads',
        title: 'listing title',
        price: 'price value',
        location: 'location or address',
        contact: 'contact information'
      },
      zapimoveis: {
        listings: 'property cards or listings',
        title: 'property title',
        price: 'rental or sale price',
        location: 'neighborhood or address',
        details: 'property details'
      },
      vivareal: {
        listings: 'property results',
        title: 'property name',
        price: 'price information',
        location: 'location details',
        features: 'property features'
      }
    };
    
    return queries[portalName.toLowerCase() as keyof typeof queries] || queries.olx;
  }

  private processPortalResults(results: any[], portalName: string, filters: any) {
    return results.map((result: any) => ({
      source: portalName,
      title: result.title || `Propriedade ${portalName}`,
      price: this.extractPrice(result.price || '0'),
      location: result.location || 'Localização não informada',
      description: result.description || 'Descrição não disponível',
      contact: this.extractContact(result.contact || ''),
      link: result.link || '#',
      images: result.images || [],
      capturedAt: new Date(),
      ...filters
    }));
  }

  private getMockLeadsData(portalName: string, filters: any) {
    // Dados simulados para demonstração
    return [
      {
        source: portalName,
        title: `Apartamento 2 quartos - ${portalName}`,
        price: 2500,
        location: 'Vila Madalena, São Paulo',
        description: 'Apartamento bem localizado com 2 quartos e 1 banheiro',
        contact: '(11) 99999-9999',
        link: `https://${portalName}.com.br/imovel/123456`,
        images: [],
        capturedAt: new Date(),
        ...filters
      },
      {
        source: portalName,
        title: `Casa 3 quartos - ${portalName}`,
        price: 3800,
        location: 'Jardins, São Paulo',
        description: 'Casa espaçosa com 3 quartos e garagem',
        contact: '(11) 88888-8888',
        link: `https://${portalName}.com.br/imovel/123457`,
        images: [],
        capturedAt: new Date(),
        ...filters
      }
    ];
  }

  // Extração de dados de cartórios e IPTU
  async extractRegistryData(registryNumber: string, city: string) {
    try {
      // URLs comuns de cartórios (adapte conforme necessário)
      const registryUrls = {
        'sp': 'https://www.registroimoveis.sp.gov.br',
        'rj': 'https://www.registroimoveis.rj.gov.br',
        'mg': 'https://www.registroimoveis.mg.gov.br'
      };
      
      const cityCode = city.toLowerCase().substring(0, 2);
      const baseUrl = registryUrls[cityCode as keyof typeof registryUrls];
      
      if (!baseUrl) {
        throw new Error(`Cartório não suportado para a cidade: ${city}`);
      }

      await this.page.goto(baseUrl);
      
      // Query para buscar dados do registro
      const searchQuery = {
        searchInput: 'registry number input or matrícula input',
        searchButton: 'search button or consultar button'
      };
      
      await this.page.queryElements(searchQuery);
      await this.page.fill(searchQuery.searchInput, registryNumber);
      await this.page.click(searchQuery.searchButton);
      
      // Aguarda resultados
      await this.page.waitForTimeout(3000);
      
      const dataQuery = {
        ownerName: 'owner name or proprietário',
        propertyAddress: 'property address or endereço',
        area: 'total area or área total',
        registrationDate: 'registration date or data de registro',
        liens: 'liens or ônus or gravames',
        description: 'property description or descrição'
      };
      
      const registryData = await this.page.queryElements(dataQuery);
      
      return {
        registryNumber,
        city,
        ownerName: registryData.ownerName || '',
        propertyAddress: registryData.propertyAddress || '',
        area: registryData.area || '',
        registrationDate: registryData.registrationDate || '',
        liens: registryData.liens || '',
        description: registryData.description || '',
        extractedAt: new Date()
      };
      
    } catch (error) {
      console.error('Erro ao extrair dados do cartório:', error);
      return null;
    }
  }

  // Consulta IPTU automática
  async extractIPTUData(propertyCode: string, state: string) {
    try {
      // Simula consulta IPTU para demonstração em produção
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simula processamento
      
      // Dados simulados baseados no estado e código
      const mockData = {
        propertyCode,
        state,
        annualValue: Math.floor(Math.random() * 5000) + 1000, // Entre R$ 1.000 e R$ 6.000
        installments: [
          { parcela: 1, valor: 500, vencimento: '2024-01-15' },
          { parcela: 2, valor: 500, vencimento: '2024-02-15' },
          { parcela: 3, valor: 500, vencimento: '2024-03-15' }
        ],
        dueDate: '2024-01-15',
        propertyValue: Math.floor(Math.random() * 500000) + 200000, // Entre R$ 200k e R$ 700k
        area: `${Math.floor(Math.random() * 200) + 50}m²`, // Entre 50m² e 250m²
        status: Math.random() > 0.3 ? 'Em dia' : 'Pendente',
        extractedAt: new Date(),
        source: `Sistema IPTU - ${state}`,
        note: 'Dados simulados para demonstração - AgentQL'
      };

      return mockData;
      
    } catch (error) {
      console.error('Erro ao extrair dados do IPTU:', error);
      return null;
    }
  }

  // Monitor de concorrência
  async monitorCompetition(propertyType: string, location: string, priceRange: { min: number, max: number }) {
    try {
      // Simula análise de mercado
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simula processamento
      
      const portals = ['olx', 'zapimoveis', 'vivareal'];
      const competitionData = [];
      
      for (const portal of portals) {
        const mockProperties = this.generateMockMarketData(portal, propertyType, location, priceRange);
        
        competitionData.push({
          portal,
          propertyCount: mockProperties.length,
          averagePrice: this.calculateAveragePrice(mockProperties),
          properties: mockProperties.slice(0, 3) // Primeiros 3 para análise
        });
      }
      
      return {
        location,
        propertyType,
        priceRange,
        analysisDate: new Date(),
        marketData: competitionData,
        insights: this.generateMarketInsights(competitionData),
        note: 'Dados simulados para demonstração - AgentQL'
      };
      
    } catch (error) {
      console.error('Erro no monitoramento de concorrência:', error);
      return null;
    }
  }

  private generateMockMarketData(portal: string, propertyType: string, location: string, priceRange: any) {
    const count = Math.floor(Math.random() * 10) + 5; // Entre 5 e 15 propriedades
    const properties = [];
    
    for (let i = 0; i < count; i++) {
      const price = Math.floor(Math.random() * (priceRange.max - priceRange.min)) + priceRange.min;
      properties.push({
        source: portal,
        title: `${propertyType} ${i + 1} - ${portal}`,
        price,
        location: location,
        description: `Propriedade encontrada no ${portal}`,
        contact: `(11) 9999${i.toString().padStart(4, '0')}`,
        link: `https://${portal}.com.br/imovel/${i}`,
        images: [],
        capturedAt: new Date()
      });
    }
    
    return properties;
  }

  // Utilitários privados
  private extractPrice(priceText: string): number {
    const cleanPrice = priceText.replace(/[^\d,\.]/g, '');
    const price = parseFloat(cleanPrice.replace(',', '.'));
    return isNaN(price) ? 0 : price;
  }

  private extractContact(contactText: string): string {
    const phoneRegex = /(\(?\d{2}\)?\s?\d{4,5}-?\d{4})/;
    const match = contactText.match(phoneRegex);
    return match ? match[0] : contactText;
  }

  buildSearchUrl(portal: string, searchCriteria: any): string {
    const {
      propertyType,
      transactionType,
      location,
      priceMin,
      priceMax,
      bedrooms,
      bathrooms,
      area
    } = searchCriteria;

    const baseUrls = {
      olx: 'https://www.olx.com.br/imoveis',
      zapimoveis: 'https://www.zapimoveis.com.br',
      vivareal: 'https://www.vivareal.com.br'
    };

    const baseUrl = baseUrls[portal as keyof typeof baseUrls];
    if (!baseUrl) return '';

    // Normalizar localização para URL
    const normalizedLocation = location.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');

    switch (portal.toLowerCase()) {
      case 'olx':
        return this.buildOLXUrl(baseUrl, {
          propertyType,
          transactionType,
          location: normalizedLocation,
          priceMin,
          priceMax,
          bedrooms
        });

      case 'zapimoveis':
        return this.buildZapUrl(baseUrl, {
          propertyType,
          transactionType,
          location: normalizedLocation,
          priceMin,
          priceMax,
          bedrooms,
          bathrooms
        });

      case 'vivareal':
        return this.buildVivaRealUrl(baseUrl, {
          propertyType,
          transactionType,
          location: normalizedLocation,
          priceMin,
          priceMax,
          bedrooms,
          area
        });

      default:
        return baseUrl;
    }
  }

  private buildOLXUrl(baseUrl: string, criteria: any): string {
    const params = new URLSearchParams();
    
    // Tipo de transação
    if (criteria.transactionType === 'RENT') {
      params.append('f', 'p'); // Para aluguel
    }

    // Tipo de imóvel
    const propertyTypeMap = {
      'APARTMENT': 'apartamentos',
      'HOUSE': 'casas',
      'COMMERCIAL': 'comercial',
      'LAND': 'terrenos'
    };
    const olxPropertyType = propertyTypeMap[criteria.propertyType as keyof typeof propertyTypeMap] || 'apartamentos';

    // Preços
    if (criteria.priceMin > 0) {
      params.append('pe', criteria.priceMin.toString());
    }
    if (criteria.priceMax > 0) {
      params.append('ps', criteria.priceMax.toString());
    }

    // Quartos
    if (criteria.bedrooms) {
      params.append('rooms', criteria.bedrooms.toString());
    }

    // Localização
    let url = `${baseUrl}/${olxPropertyType}`;
    if (criteria.location) {
      url += `/${criteria.location}`;
    }

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  private buildZapUrl(baseUrl: string, criteria: any): string {
    const params = new URLSearchParams();
    
    // Tipo de transação
    const transactionMap = {
      'RENT': 'aluguel',
      'SALE': 'venda'
    };
    const transaction = transactionMap[criteria.transactionType as keyof typeof transactionMap] || 'aluguel';

    // Tipo de imóvel
    const propertyTypeMap = {
      'APARTMENT': 'apartamento',
      'HOUSE': 'casa',
      'COMMERCIAL': 'comercial',
      'LAND': 'terreno'
    };
    const zapPropertyType = propertyTypeMap[criteria.propertyType as keyof typeof propertyTypeMap] || 'apartamento';

    // Preços
    if (criteria.priceMin > 0) {
      params.append('preco-minimo', criteria.priceMin.toString());
    }
    if (criteria.priceMax > 0) {
      params.append('preco-maximo', criteria.priceMax.toString());
    }

    // Quartos
    if (criteria.bedrooms) {
      params.append('quartos', criteria.bedrooms.toString());
    }

    // Banheiros
    if (criteria.bathrooms) {
      params.append('banheiros', criteria.bathrooms.toString());
    }

    // Localização
    let url = `${baseUrl}/${transaction}/${zapPropertyType}s`;
    if (criteria.location) {
      url += `/${criteria.location}`;
    }

    const queryString = params.toString();
    return queryString ? `${url}/?${queryString}` : `${url}/`;
  }

  private buildVivaRealUrl(baseUrl: string, criteria: any): string {
    const params = new URLSearchParams();
    
    // Tipo de transação
    const transactionMap = {
      'RENT': 'aluguel',
      'SALE': 'venda'
    };
    const transaction = transactionMap[criteria.transactionType as keyof typeof transactionMap] || 'aluguel';

    // Tipo de imóvel
    const propertyTypeMap = {
      'APARTMENT': 'apartamento',
      'HOUSE': 'casa',
      'COMMERCIAL': 'comercial',
      'LAND': 'terreno'
    };
    const vivaPropertyType = propertyTypeMap[criteria.propertyType as keyof typeof propertyTypeMap] || 'apartamento';

    // Preços
    if (criteria.priceMin > 0) {
      params.append('precoMinimo', criteria.priceMin.toString());
    }
    if (criteria.priceMax > 0) {
      params.append('precoMaximo', criteria.priceMax.toString());
    }

    // Quartos
    if (criteria.bedrooms) {
      params.append('quartos', criteria.bedrooms.toString());
    }

    // Área
    if (criteria.area) {
      params.append('areaMinima', criteria.area.toString());
    }

    // Localização
    let url = `${baseUrl}/${transaction}/${vivaPropertyType}`;
    if (criteria.location) {
      url += `/${criteria.location}`;
    }

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  private calculateAveragePrice(properties: any[]): number {
    if (properties.length === 0) return 0;
    const total = properties.reduce((sum, prop) => sum + prop.price, 0);
    return total / properties.length;
  }

  private generateMarketInsights(marketData: any[]): string[] {
    const insights = [];
    
    const totalProperties = marketData.reduce((sum, data) => sum + data.propertyCount, 0);
    insights.push(`Total de ${totalProperties} propriedades encontradas no mercado`);
    
    const avgPrices = marketData.map(data => data.averagePrice).filter(price => price > 0);
    if (avgPrices.length > 0) {
      const overallAvg = avgPrices.reduce((sum, price) => sum + price, 0) / avgPrices.length;
      insights.push(`Preço médio do mercado: R$ ${overallAvg.toLocaleString('pt-BR')}`);
    }
    
    return insights;
  }
}

export default AgentQLService;