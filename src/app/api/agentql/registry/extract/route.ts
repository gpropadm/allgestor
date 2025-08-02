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

    const { registryNumber, city } = await request.json();

    if (!registryNumber || !city) {
      return NextResponse.json({ 
        error: 'Número da matrícula e cidade são obrigatórios' 
      }, { status: 400 });
    }

    const agentQL = new AgentQLService();
    await agentQL.init();

    const registryData = await agentQL.extractRegistryData(registryNumber, city);
    
    await agentQL.close();

    if (!registryData) {
      return NextResponse.json({ 
        error: 'Não foi possível extrair dados do cartório',
        registryNumber,
        city
      }, { status: 404 });
    }

    // Por enquanto só retorna os dados, sem salvar no banco
    return NextResponse.json({ 
      success: true, 
      data: registryData
    });

  } catch (error) {
    console.error('Erro na extração de dados do cartório:', error);
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

    // Retorna cartórios disponíveis
    const registries = [
      {
        city: 'São Paulo',
        state: 'SP',
        url: 'https://www.registroimoveis.sp.gov.br',
        status: 'available',
        description: 'Cartório de Registro de Imóveis de São Paulo'
      },
      {
        city: 'Rio de Janeiro',
        state: 'RJ',
        url: 'https://www.registroimoveis.rj.gov.br',
        status: 'available',
        description: 'Cartório de Registro de Imóveis do Rio de Janeiro'
      },
      {
        city: 'Belo Horizonte',
        state: 'MG',
        url: 'https://www.registroimoveis.mg.gov.br',
        status: 'available',
        description: 'Cartório de Registro de Imóveis de Belo Horizonte'
      }
    ];

    return NextResponse.json({ registries });

  } catch (error) {
    console.error('Erro ao buscar cartórios:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}