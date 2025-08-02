import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AgentQLService from '@/lib/agentql-service';
import DirectScraperService from '@/lib/direct-scraper-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchCriteria, portals } = await request.json();

    if (!searchCriteria || !searchCriteria.location) {
      return NextResponse.json({ 
        error: 'Critérios de busca e localização são obrigatórios' 
      }, { status: 400 });
    }

    if (!portals || portals.length === 0) {
      return NextResponse.json({ 
        error: 'Selecione pelo menos um portal' 
      }, { status: 400 });
    }

    // Tentar AgentQL primeiro, fallback para scraper direto se falhar
    const useDirectScraper = process.env.USE_DIRECT_SCRAPER === 'true' || false;
    
    const allLeads = [];
    const results = [];

    if (useDirectScraper) {
      // Scraper direto com Playwright
      const scraper = new DirectScraperService();
      const scraperInitialized = await scraper.init();
      
      if (!scraperInitialized) {
        return NextResponse.json({ 
          error: 'Erro ao inicializar sistema de busca' 
        }, { status: 500 });
      }

      try {
        const agentQL = new AgentQLService(); // Só para construir URLs
        
        for (const portal of portals) {
          try {
            const searchUrl = agentQL.buildSearchUrl(portal, searchCriteria);
            console.log(`Iniciando scraping direto no ${portal}: ${searchUrl}`);
            
            const leads = await scraper.scrapePortal(portal, searchUrl, searchCriteria.location);
            
            allLeads.push(...leads);
            results.push({
              portal,
              count: leads.length,
              leads: leads.slice(0, 10), // Primeiros 10 para exibir
              searchUrl,
              method: 'direct_scraping'
            });
            
            console.log(`${portal}: ${leads.length} leads capturados`);
            
          } catch (error) {
            console.error(`Erro no portal ${portal}:`, error);
            results.push({
              portal,
              error: `Erro ao buscar no ${portal}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
              count: 0,
              leads: [],
              method: 'direct_scraping_error'
            });
          }
        }
        
        await scraper.close();
        
      } catch (error) {
        console.error('Erro geral no scraper:', error);
        return NextResponse.json({ 
          error: 'Erro no sistema de busca',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        }, { status: 500 });
      }
      
    } else {
      // Usar AgentQL como método principal
      const agentQL = new AgentQLService();
      
      try {
        await agentQL.init();

        for (const portal of portals) {
          try {
            const searchUrl = agentQL.buildSearchUrl(portal, searchCriteria);
            const leads = await agentQL.captureLeadsFromPortal(portal, searchUrl, searchCriteria);
            
            allLeads.push(...leads);
            results.push({
              portal,
              count: leads.length,
              leads: leads.slice(0, 10),
              searchUrl,
              method: 'agentql'
            });
          } catch (error) {
            console.error(`Erro no portal ${portal} com AgentQL:`, error);
            
            // Fallback para scraper direto em caso de erro no AgentQL
            try {
              console.log(`Tentando scraper direto para ${portal}...`);
              const scraper = new DirectScraperService();
              await scraper.init();
              
              const searchUrl = agentQL.buildSearchUrl(portal, searchCriteria);
              const leads = await scraper.scrapePortal(portal, searchUrl, searchCriteria.location);
              
              await scraper.close();
              
              allLeads.push(...leads);
              results.push({
                portal,
                count: leads.length,
                leads: leads.slice(0, 10),
                searchUrl,
                method: 'direct_scraping_fallback'
              });
              
            } catch (scraperError) {
              console.error(`Erro também no scraper direto para ${portal}:`, scraperError);
              results.push({
                portal,
                error: `Erro ao buscar no ${portal}`,
                count: 0,
                leads: [],
                method: 'both_failed'
              });
            }
          }
        }
        
        await agentQL.close();
        
      } catch (agentqlInitError) {
        console.error('Erro ao inicializar AgentQL, usando scraper direto:', agentqlInitError);
        
        // Se AgentQL falhar completamente, usar scraper direto
        const scraper = new DirectScraperService();
        await scraper.init();
        
        const tempAgentQL = new AgentQLService(); // Só para construir URLs
        
        for (const portal of portals) {
          try {
            const searchUrl = tempAgentQL.buildSearchUrl(portal, searchCriteria);
            const leads = await scraper.scrapePortal(portal, searchUrl, searchCriteria.location);
            
            allLeads.push(...leads);
            results.push({
              portal,
              count: leads.length,
              leads: leads.slice(0, 10),
              searchUrl,
              method: 'direct_scraping_primary'
            });
            
          } catch (error) {
            console.error(`Erro no scraper direto para ${portal}:`, error);
            results.push({
              portal,
              error: `Erro ao buscar no ${portal}`,
              count: 0,
              leads: [],
              method: 'scraper_error'
            });
          }
        }
        
        await scraper.close();
      }
    }

    // Por enquanto só retorna os dados, sem salvar no banco
    return NextResponse.json({ 
      success: true, 
      searchCriteria,
      results,
      totalLeads: allLeads.length,
      allLeads: allLeads.slice(0, 20), // Primeiros 20 para exibir
      capturedAt: new Date()
    });

  } catch (error) {
    console.error('Erro na captura de leads:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Retorna configurações dos portais disponíveis
    const portals = [
      {
        name: 'OLX',
        id: 'olx',
        baseUrl: 'https://www.olx.com.br/imoveis',
        description: 'Captura leads do OLX Imóveis',
        searchParams: ['location', 'propertyType', 'priceRange']
      },
      {
        name: 'ZAP Imóveis',
        id: 'zapimoveis',
        baseUrl: 'https://www.zapimoveis.com.br',
        description: 'Captura leads do ZAP Imóveis',
        searchParams: ['location', 'propertyType', 'priceRange', 'bedrooms']
      },
      {
        name: 'Viva Real',
        id: 'vivareal',
        baseUrl: 'https://www.vivareal.com.br',
        description: 'Captura leads do Viva Real',
        searchParams: ['location', 'propertyType', 'priceRange', 'area']
      }
    ];

    return NextResponse.json({ portals });

  } catch (error) {
    console.error('Erro ao buscar portais:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}