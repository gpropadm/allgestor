import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone, document } = await request.json();

    // Resposta simples para teste
    return NextResponse.json({
      success: true,
      message: `Recebido telefone: ${phone}, documento: ${document}`,
      debug: 'API funcionando corretamente!',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erro na API',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API Client Login funcionando!',
    methods: ['GET', 'POST'],
    timestamp: new Date().toISOString()
  });
}