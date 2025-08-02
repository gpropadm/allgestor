import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AgentQLService from '@/lib/agentql-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { propertyType, location, priceRange } = await request.json();

    if (!propertyType || !location || !priceRange) {
      return NextResponse.json({ 
        error: 'Tipo de imóvel, localização e faixa de preço são obrigatórios' 
      }, { status: 400 });
    }

    const agentQL = new AgentQLService();
    await agentQL.init();

    const marketData = await agentQL.monitorCompetition(propertyType, location, priceRange);
    
    await agentQL.close();

    if (!marketData) {
      return NextResponse.json({ 
        error: 'Não foi possível coletar dados do mercado',
        propertyType,
        location
      }, { status: 404 });
    }

    // Por enquanto só retorna os dados, sem salvar no banco
    return NextResponse.json({ 
      success: true, 
      data: marketData
    });

  } catch (error) {
    console.error('Erro no monitoramento de mercado:', error);
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

    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const propertyType = searchParams.get('propertyType');

    // Retorna dados de mercado simulados ou cache
    const marketInfo = {
      location: location || 'Geral',
      propertyType: propertyType || 'Geral',
      lastUpdate: new Date(),
      availableAnalyses: [
        {
          id: 'price-trends',
          name: 'Tendências de Preço',
          description: 'Análise de variação de preços nos últimos 6 meses'
        },
        {
          id: 'competition-density',
          name: 'Densidade de Concorrência',
          description: 'Quantidade de imóveis similares disponíveis'
        },
        {
          id: 'market-velocity',
          name: 'Velocidade de Mercado',
          description: 'Tempo médio para locação/venda'
        }
      ],
      supportedPortals: ['OLX', 'ZAP Imóveis', 'Viva Real', 'Imovelweb'],
      recommendations: [
        'Execute monitoramento semanalmente para melhor precisão',
        'Configure alertas para mudanças significativas de preço',
        'Analise propriedades similares em um raio de 2km'
      ]
    };

    return NextResponse.json({ marketInfo });

  } catch (error) {
    console.error('Erro ao buscar informações de mercado:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}