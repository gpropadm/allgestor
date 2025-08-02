import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const apiKey = process.env.AGENTQL_API_KEY;
    
    // Debug da configuração
    const debugInfo = {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyStart: apiKey?.substring(0, 8) + '...' || 'Não configurada',
      baseUrl: 'https://api.agentql.com/v1',
      timestamp: new Date().toISOString()
    };

    // Teste simples da API AgentQL
    if (apiKey) {
      try {
        const testResponse = await fetch('https://api.agentql.com/v1/health', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        debugInfo.apiTest = {
          status: testResponse.status,
          statusText: testResponse.statusText,
          ok: testResponse.ok
        };

        if (testResponse.ok) {
          const testData = await testResponse.text();
          debugInfo.apiResponse = testData.substring(0, 200); // Primeiros 200 chars
        }
      } catch (apiError) {
        debugInfo.apiError = apiError instanceof Error ? apiError.message : 'Erro desconhecido';
      }
    }

    return NextResponse.json({ 
      success: true,
      debug: debugInfo,
      message: 'Debug do AgentQL - Verificação de configuração'
    });

  } catch (error) {
    console.error('Erro no debug AgentQL:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { testUrl } = await request.json();
    const apiKey = process.env.AGENTQL_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'AGENTQL_API_KEY não configurada' 
      }, { status: 400 });
    }

    if (!testUrl) {
      return NextResponse.json({ 
        error: 'URL de teste é obrigatória' 
      }, { status: 400 });
    }

    // Teste real de scraping
    console.log('Testando AgentQL com URL:', testUrl);
    
    const scrapingResponse = await fetch('https://api.agentql.com/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: testUrl,
        query: {
          listings: 'property listings or real estate ads',
          title: 'listing title',
          price: 'price value',
          location: 'location or address'
        },
        timeout: 30000
      })
    });

    const responseData = {
      status: scrapingResponse.status,
      statusText: scrapingResponse.statusText,
      ok: scrapingResponse.ok,
      headers: Object.fromEntries(scrapingResponse.headers.entries())
    };

    if (scrapingResponse.ok) {
      const data = await scrapingResponse.json();
      responseData.data = data;
      responseData.dataFound = data.data?.length || 0;
    } else {
      const errorText = await scrapingResponse.text();
      responseData.error = errorText;
    }

    return NextResponse.json({ 
      success: true,
      testUrl,
      response: responseData,
      message: 'Teste de scraping AgentQL realizado'
    });

  } catch (error) {
    console.error('Erro no teste AgentQL:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}