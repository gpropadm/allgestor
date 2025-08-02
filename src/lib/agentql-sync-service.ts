import AgentQLService from './agentql-service';

interface SyncConfig {
  enabled: boolean;
  portals: string[];
  interval: number; // em minutos
  lastSync?: Date;
  companyId: string;
  userId: string;
}

interface PropertyData {
  id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  location: string;
  images: string[];
  features: string[];
}

export class AgentQLSyncService {
  private agentQL: AgentQLService;
  private syncConfigs: Map<string, SyncConfig> = new Map();

  constructor() {
    this.agentQL = new AgentQLService();
  }

  // Configurar sincronização para uma empresa
  async setupSync(companyId: string, config: Partial<SyncConfig>) {
    const defaultConfig: SyncConfig = {
      enabled: true,
      portals: ['olx', 'zapimoveis', 'vivareal'],
      interval: 60, // 1 hora
      companyId,
      userId: config.userId || '',
      ...config
    };

    this.syncConfigs.set(companyId, defaultConfig);
    
    if (defaultConfig.enabled) {
      this.startSyncInterval(companyId);
    }

    return defaultConfig;
  }

  // Iniciar sincronização automática
  private startSyncInterval(companyId: string) {
    const config = this.syncConfigs.get(companyId);
    if (!config) return;

    setInterval(async () => {
      await this.performSync(companyId);
    }, config.interval * 60 * 1000);
  }

  // Executar sincronização completa
  async performSync(companyId: string) {
    const config = this.syncConfigs.get(companyId);
    if (!config || !config.enabled) return;

    try {
      console.log(`Iniciando sincronização para empresa ${companyId}`);
      
      await this.agentQL.init();

      // 1. Capturar novos leads de todos os portais
      const allLeads = await this.captureAllPortalLeads(config);
      
      // 2. Sincronizar propriedades existentes
      const propertyUpdates = await this.syncExistingProperties(config);
      
      // 3. Monitorar mudanças de preços
      const priceChanges = await this.monitorPriceChanges(config);

      await this.agentQL.close();

      // Atualizar última sincronização
      config.lastSync = new Date();
      this.syncConfigs.set(companyId, config);

      console.log(`Sincronização concluída: ${allLeads.length} leads, ${propertyUpdates.length} atualizações, ${priceChanges.length} mudanças de preço`);

      return {
        success: true,
        leads: allLeads,
        updates: propertyUpdates,
        priceChanges,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Erro na sincronização:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Capturar leads de todos os portais
  private async captureAllPortalLeads(config: SyncConfig) {
    const allLeads = [];

    for (const portal of config.portals) {
      try {
        // URLs base para busca geral
        const searchUrls = this.getPortalSearchUrls(portal);
        
        for (const searchUrl of searchUrls) {
          const leads = await this.agentQL.captureLeadsFromPortal(portal, searchUrl);
          allLeads.push(...leads);
        }
      } catch (error) {
        console.error(`Erro ao capturar leads do ${portal}:`, error);
      }
    }

    return allLeads;
  }

  // Sincronizar propriedades existentes
  private async syncExistingProperties(config: SyncConfig) {
    // Aqui você buscaria as propriedades da empresa no banco
    // Por enquanto, simulando algumas propriedades
    const properties = await this.getCompanyProperties(config.companyId);
    const updates = [];

    for (const property of properties) {
      try {
        // Buscar a propriedade em cada portal para verificar status
        const portalData = await this.findPropertyInPortals(property);
        
        if (portalData.length > 0) {
          updates.push({
            propertyId: property.id,
            portalData,
            needsUpdate: this.checkIfNeedsUpdate(property, portalData)
          });
        }
      } catch (error) {
        console.error(`Erro ao sincronizar propriedade ${property.id}:`, error);
      }
    }

    return updates;
  }

  // Monitorar mudanças de preços
  private async monitorPriceChanges(config: SyncConfig) {
    const priceChanges = [];

    // Buscar propriedades similares no mercado
    const marketData = await this.agentQL.monitorCompetition(
      'APARTMENT', 
      'São Paulo', 
      { min: 1000, max: 5000 }
    );

    if (marketData) {
      for (const portalData of marketData.marketData) {
        const changes = this.detectPriceChanges(portalData);
        priceChanges.push(...changes);
      }
    }

    return priceChanges;
  }

  // Publicar propriedade em múltiplos portais
  async publishToPortals(propertyData: PropertyData, portals: string[]) {
    await this.agentQL.init();
    const results = [];

    for (const portal of portals) {
      try {
        const result = await this.publishToPortal(propertyData, portal);
        results.push({ portal, success: true, result });
      } catch (error) {
        console.error(`Erro ao publicar no ${portal}:`, error);
        results.push({ 
          portal, 
          success: false, 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        });
      }
    }

    await this.agentQL.close();
    return results;
  }

  // Publicar em portal específico
  private async publishToPortal(propertyData: PropertyData, portal: string) {
    // Configurações específicas de cada portal
    const portalConfigs = {
      olx: {
        loginUrl: 'https://www.olx.com.br/login',
        publishUrl: 'https://www.olx.com.br/inserir-anuncio',
        fields: {
          title: 'property title input',
          description: 'property description textarea',
          price: 'price input',
          location: 'location input',
          images: 'image upload button'
        }
      },
      zapimoveis: {
        loginUrl: 'https://www.zapimoveis.com.br/login',
        publishUrl: 'https://www.zapimoveis.com.br/anunciar',
        fields: {
          title: 'title field',
          description: 'description field',
          price: 'price field',
          bedrooms: 'bedroom count',
          bathrooms: 'bathroom count'
        }
      },
      vivareal: {
        loginUrl: 'https://www.vivareal.com.br/login',
        publishUrl: 'https://www.vivareal.com.br/anunciar',
        fields: {
          title: 'listing title',
          description: 'property description',
          price: 'rental price or sale price',
          area: 'property area'
        }
      }
    };

    const config = portalConfigs[portal as keyof typeof portalConfigs];
    if (!config) {
      throw new Error(`Portal ${portal} não suportado`);
    }

    // Navegar para página de publicação
    await this.agentQL.page.goto(config.publishUrl);

    // Preencher formulário usando AgentQL
    const formQuery = {
      titleField: config.fields.title,
      descriptionField: config.fields.description,
      priceField: config.fields.price,
      submitButton: 'publish button or submit button'
    };

    await this.agentQL.page.queryElements(formQuery);
    
    // Preencher campos
    await this.agentQL.page.fill(formQuery.titleField, propertyData.title);
    await this.agentQL.page.fill(formQuery.descriptionField, propertyData.description);
    await this.agentQL.page.fill(formQuery.priceField, propertyData.price.toString());

    // Submeter
    await this.agentQL.page.click(formQuery.submitButton);
    
    // Aguardar confirmação
    await this.agentQL.page.waitForTimeout(3000);

    return {
      portal,
      propertyId: propertyData.id,
      published: true,
      publishedAt: new Date()
    };
  }

  // Atualizar preços automaticamente
  async updatePricesBasedOnMarket(companyId: string, adjustment: number = 0.05) {
    const properties = await this.getCompanyProperties(companyId);
    const updates = [];

    for (const property of properties) {
      try {
        // Analisar mercado para propriedade similar
        const marketData = await this.agentQL.monitorCompetition(
          property.type,
          property.location,
          { min: property.price * 0.8, max: property.price * 1.2 }
        );

        if (marketData && marketData.averagePrice) {
          const suggestedPrice = marketData.averagePrice * (1 + adjustment);
          const priceChange = Math.abs(property.price - suggestedPrice) / property.price;

          // Só sugere mudança se a diferença for significativa (>5%)
          if (priceChange > 0.05) {
            updates.push({
              propertyId: property.id,
              currentPrice: property.price,
              suggestedPrice,
              marketAverage: marketData.averagePrice,
              recommendation: suggestedPrice > property.price ? 'increase' : 'decrease',
              confidence: this.calculatePriceConfidence(marketData)
            });
          }
        }
      } catch (error) {
        console.error(`Erro ao analisar preço da propriedade ${property.id}:`, error);
      }
    }

    return updates;
  }

  // Métodos auxiliares
  private getPortalSearchUrls(portal: string): string[] {
    const baseUrls = {
      olx: [
        'https://www.olx.com.br/imoveis/aluguel',
        'https://www.olx.com.br/imoveis/venda'
      ],
      zapimoveis: [
        'https://www.zapimoveis.com.br/aluguel/imoveis',
        'https://www.zapimoveis.com.br/venda/imoveis'
      ],
      vivareal: [
        'https://www.vivareal.com.br/aluguel',
        'https://www.vivareal.com.br/venda'
      ]
    };

    return baseUrls[portal as keyof typeof baseUrls] || [];
  }

  private async getCompanyProperties(companyId: string): Promise<PropertyData[]> {
    // Simulação - na implementação real, consultar banco de dados
    return [
      {
        id: '1',
        title: 'Apartamento 2 quartos Vila Madalena',
        description: 'Lindo apartamento com 2 quartos...',
        price: 3500,
        type: 'APARTMENT',
        location: 'Vila Madalena, São Paulo',
        images: [],
        features: ['2 quartos', '1 banheiro', 'sacada']
      }
    ];
  }

  private async findPropertyInPortals(property: PropertyData) {
    const results = [];
    
    // Buscar a propriedade em cada portal usando título ou características únicas
    for (const portal of ['olx', 'zapimoveis', 'vivareal']) {
      try {
        const searchUrl = this.buildPropertySearchUrl(portal, property);
        const found = await this.agentQL.captureLeadsFromPortal(portal, searchUrl);
        
        // Filtrar resultados que podem ser a mesma propriedade
        const matches = found.filter(lead => 
          this.isSameProperty(property, lead)
        );

        if (matches.length > 0) {
          results.push({ portal, matches });
        }
      } catch (error) {
        console.error(`Erro ao buscar propriedade no ${portal}:`, error);
      }
    }

    return results;
  }

  private buildPropertySearchUrl(portal: string, property: PropertyData): string {
    // Implementar lógica específica para construir URL de busca
    const baseUrls = {
      olx: 'https://www.olx.com.br/imoveis',
      zapimoveis: 'https://www.zapimoveis.com.br',
      vivareal: 'https://www.vivareal.com.br'
    };

    return baseUrls[portal as keyof typeof baseUrls] || '';
  }

  private isSameProperty(property: PropertyData, lead: any): boolean {
    // Comparar características para identificar se é a mesma propriedade
    const titleSimilarity = this.calculateStringSimilarity(property.title, lead.title);
    const priceSimilarity = Math.abs(property.price - lead.price) / property.price;
    
    return titleSimilarity > 0.8 && priceSimilarity < 0.1;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Implementação simples de similaridade de strings
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private checkIfNeedsUpdate(property: PropertyData, portalData: any[]): boolean {
    // Verificar se dados da propriedade precisam ser atualizados
    for (const data of portalData) {
      for (const match of data.matches) {
        if (Math.abs(property.price - match.price) > 0) {
          return true;
        }
      }
    }
    return false;
  }

  private detectPriceChanges(portalData: any): any[] {
    // Detectar mudanças de preço significativas
    const changes = [];
    
    for (const property of portalData.properties) {
      // Comparar com preços históricos (implementar cache/histórico)
      const historicalPrice = this.getHistoricalPrice(property.link);
      
      if (historicalPrice && Math.abs(property.price - historicalPrice) / historicalPrice > 0.05) {
        changes.push({
          propertyLink: property.link,
          oldPrice: historicalPrice,
          newPrice: property.price,
          change: ((property.price - historicalPrice) / historicalPrice) * 100,
          portal: portalData.portal
        });
      }
    }
    
    return changes;
  }

  private getHistoricalPrice(propertyLink: string): number | null {
    // Implementar cache de preços históricos
    // Por enquanto, retorna null
    return null;
  }

  private calculatePriceConfidence(marketData: any): number {
    // Calcular confiança na sugestão de preço baseado nos dados de mercado
    const propertyCount = marketData.propertyCount || 0;
    const dataQuality = marketData.insights?.length || 0;
    
    let confidence = 0.5; // Base
    
    if (propertyCount > 10) confidence += 0.2;
    if (propertyCount > 20) confidence += 0.1;
    if (dataQuality > 2) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  // Parar sincronização
  stopSync(companyId: string) {
    const config = this.syncConfigs.get(companyId);
    if (config) {
      config.enabled = false;
      this.syncConfigs.set(companyId, config);
    }
  }

  // Obter status da sincronização
  getSyncStatus(companyId: string) {
    return this.syncConfigs.get(companyId) || null;
  }
}

export default AgentQLSyncService;