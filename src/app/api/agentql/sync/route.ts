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

    const { action, config } = await request.json();
    const companyId = session.user.companyId || 'default';

    switch (action) {
      case 'setup':
        const syncConfig = await syncService.setupSync(companyId, {
          ...config,
          userId: session.user.id
        });
        return NextResponse.json({ 
          success: true, 
          config: syncConfig,
          message: 'Sincronização configurada com sucesso'
        });

      case 'start':
        const syncResult = await syncService.performSync(companyId);
        return NextResponse.json({ 
          success: true, 
          result: syncResult,
          message: 'Sincronização executada'
        });

      case 'stop':
        syncService.stopSync(companyId);
        return NextResponse.json({ 
          success: true,
          message: 'Sincronização pausada'
        });

      case 'status':
        const status = syncService.getSyncStatus(companyId);
        return NextResponse.json({ 
          success: true, 
          status,
          message: 'Status da sincronização'
        });

      default:
        return NextResponse.json({ 
          error: 'Ação não reconhecida' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro na sincronização:', error);
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

    const companyId = session.user.companyId || 'default';
    const status = syncService.getSyncStatus(companyId);

    return NextResponse.json({ 
      success: true, 
      status: status || {
        enabled: false,
        portals: [],
        interval: 60,
        lastSync: null,
        companyId,
        userId: session.user.id
      },
      availablePortals: [
        { id: 'olx', name: 'OLX', status: 'available' },
        { id: 'zapimoveis', name: 'ZAP Imóveis', status: 'available' },
        { id: 'vivareal', name: 'Viva Real', status: 'available' },
        { id: 'imovelweb', name: 'ImovelWeb', status: 'coming_soon' }
      ],
      syncOptions: {
        intervals: [
          { value: 30, label: '30 minutos' },
          { value: 60, label: '1 hora' },
          { value: 180, label: '3 horas' },
          { value: 360, label: '6 horas' },
          { value: 720, label: '12 horas' },
          { value: 1440, label: '24 horas' }
        ],
        features: [
          'Captura automática de leads',
          'Sincronização de propriedades',
          'Monitoramento de preços',
          'Alertas de mudanças no mercado',
          'Publicação cruzada entre portais'
        ]
      }
    });

  } catch (error) {
    console.error('Erro ao buscar status da sincronização:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}