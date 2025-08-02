import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AgentQLSyncService from '@/lib/agentql-sync-service';

const syncService = new AgentQLSyncService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { propertyData, portals } = await request.json();

    if (!propertyData || !portals || portals.length === 0) {
      return NextResponse.json({ 
        error: 'Dados da propriedade e portais são obrigatórios' 
      }, { status: 400 });
    }

    // Validar dados da propriedade
    const requiredFields = ['title', 'description', 'price', 'type', 'location'];
    const missingFields = requiredFields.filter(field => !propertyData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    const results = await syncService.publishToPortals(propertyData, portals);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({ 
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        successRate: (successCount / results.length) * 100
      },
      message: `Propriedade publicada em ${successCount}/${results.length} portais`
    });

  } catch (error) {
    console.error('Erro na publicação:', error);
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

    // Retorna informações sobre publicação em portais
    const publishInfo = {
      availablePortals: [
        {
          id: 'olx',
          name: 'OLX',
          status: 'available',
          features: ['Fotos múltiplas', 'Descrição rica', 'Localização precisa'],
          requirements: ['Título (max 50 chars)', 'Preço', 'Localização', 'Fotos (min 3)'],
          publishTime: '2-5 minutos',
          reach: 'Nacional'
        },
        {
          id: 'zapimoveis',
          name: 'ZAP Imóveis',
          status: 'available',
          features: ['Tour virtual', 'Planta baixa', 'Filtros avançados'],
          requirements: ['Título', 'Preço', 'Área', 'Quartos/Banheiros', 'Fotos (min 5)'],
          publishTime: '5-10 minutos',
          reach: 'Nacional/Premium'
        },
        {
          id: 'vivareal',
          name: 'Viva Real',
          status: 'available',
          features: ['Mapa interativo', 'Score do bairro', 'Comparação de preços'],
          requirements: ['Título', 'Preço', 'Endereço completo', 'Características'],
          publishTime: '3-7 minutos',
          reach: 'Nacional'
        }
      ],
      publishOptions: {
        autoRenew: 'Renovação automática dos anúncios',
        priceUpdate: 'Atualização automática de preços',
        statusSync: 'Sincronização de status (disponível/alugado)',
        crossPosting: 'Publicação simultânea em múltiplos portais',
        analytics: 'Relatórios de performance por portal'
      },
      bestPractices: [
        'Use títulos descritivos e únicos para cada portal',
        'Inclua pelo menos 5 fotos de alta qualidade',
        'Mantenha descrições atualizadas e detalhadas',
        'Configure preços competitivos baseados na análise de mercado',
        'Responda rapidamente aos contatos recebidos'
      ],
      pricingTiers: [
        {
          name: 'Básico',
          portals: ['olx'],
          features: ['Publicação simples', 'Fotos básicas'],
          price: 'Gratuito'
        },
        {
          name: 'Profissional',
          portals: ['olx', 'zapimoveis'],
          features: ['Destaque nos resultados', 'Mais fotos', 'Analytics'],
          price: 'R$ 49/mês'
        },
        {
          name: 'Premium',
          portals: ['olx', 'zapimoveis', 'vivareal'],
          features: ['Todos os portais', 'Sincronização automática', 'Suporte prioritário'],
          price: 'R$ 99/mês'
        }
      ]
    };

    return NextResponse.json({ publishInfo });

  } catch (error) {
    console.error('Erro ao buscar informações de publicação:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}