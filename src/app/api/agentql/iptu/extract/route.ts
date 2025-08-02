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

    const { propertyCode, city } = await request.json();

    if (!propertyCode || !city) {
      return NextResponse.json({ 
        error: 'Código do imóvel e estado são obrigatórios' 
      }, { status: 400 });
    }

    const agentQL = new AgentQLService();
    await agentQL.init();

    const iptuData = await agentQL.extractIPTUData(propertyCode, city);
    
    await agentQL.close();

    if (!iptuData) {
      return NextResponse.json({ 
        error: 'Não foi possível extrair dados do IPTU',
        propertyCode,
        state: city
      }, { status: 404 });
    }

    // Por enquanto só retorna os dados, sem salvar no banco
    return NextResponse.json({ 
      success: true, 
      data: iptuData
    });

  } catch (error) {
    console.error('Erro na extração de dados do IPTU:', error);
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

    // Retorna sistemas de IPTU disponíveis por estado
    const iptuSystems = [
      // Região Norte
      { state: 'Acre', code: 'AC', url: 'https://www.ac.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado do Acre' },
      { state: 'Amapá', code: 'AP', url: 'https://www.ap.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado do Amapá' },
      { state: 'Amazonas', code: 'AM', url: 'https://www.amazonas.am.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado do Amazonas' },
      { state: 'Pará', code: 'PA', url: 'https://www.pa.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado do Pará' },
      { state: 'Rondônia', code: 'RO', url: 'https://www.rondonia.ro.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado de Rondônia' },
      { state: 'Roraima', code: 'RR', url: 'https://www.roraima.rr.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado de Roraima' },
      { state: 'Tocantins', code: 'TO', url: 'https://www.to.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado do Tocantins' },
      
      // Região Nordeste
      { state: 'Alagoas', code: 'AL', url: 'https://www.alagoas.al.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado de Alagoas' },
      { state: 'Bahia', code: 'BA', url: 'https://www.bahia.ba.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado da Bahia' },
      { state: 'Ceará', code: 'CE', url: 'https://www.ceara.ce.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado do Ceará' },
      { state: 'Maranhão', code: 'MA', url: 'https://www.ma.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado do Maranhão' },
      { state: 'Paraíba', code: 'PB', url: 'https://www.paraiba.pb.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado da Paraíba' },
      { state: 'Pernambuco', code: 'PE', url: 'https://www.pe.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado de Pernambuco' },
      { state: 'Piauí', code: 'PI', url: 'https://www.pi.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado do Piauí' },
      { state: 'Rio Grande do Norte', code: 'RN', url: 'https://www.rn.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado do Rio Grande do Norte' },
      { state: 'Sergipe', code: 'SE', url: 'https://www.sergipe.se.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado de Sergipe' },
      
      // Região Centro-Oeste
      { state: 'Distrito Federal', code: 'DF', url: 'https://www.fazenda.df.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Distrito Federal' },
      { state: 'Goiás', code: 'GO', url: 'https://www.goias.go.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado de Goiás' },
      { state: 'Mato Grosso', code: 'MT', url: 'https://www.mt.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado de Mato Grosso' },
      { state: 'Mato Grosso do Sul', code: 'MS', url: 'https://www.ms.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado de Mato Grosso do Sul' },
      
      // Região Sudeste
      { state: 'Espírito Santo', code: 'ES', url: 'https://www.es.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado do Espírito Santo' },
      { state: 'Minas Gerais', code: 'MG', url: 'https://www.mg.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado de Minas Gerais' },
      { state: 'Rio de Janeiro', code: 'RJ', url: 'https://www.rj.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado do Rio de Janeiro' },
      { state: 'São Paulo', code: 'SP', url: 'https://www.fazenda.sp.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado de São Paulo' },
      
      // Região Sul
      { state: 'Paraná', code: 'PR', url: 'https://www.pr.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado do Paraná' },
      { state: 'Rio Grande do Sul', code: 'RS', url: 'https://www.rs.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado do Rio Grande do Sul' },
      { state: 'Santa Catarina', code: 'SC', url: 'https://www.sc.gov.br/iptu', status: 'available', description: 'Sistema IPTU do Estado de Santa Catarina' }
    ];

    return NextResponse.json({ iptuSystems });

  } catch (error) {
    console.error('Erro ao buscar sistemas de IPTU:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}