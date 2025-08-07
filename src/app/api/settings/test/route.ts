import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTE DE SALVAMENTO SIMPLES ===')
    
    const data = await request.json()
    console.log('Dados recebidos:', data)
    
    // Testar conexão com banco
    const result = await prisma.company.findMany({ take: 1 })
    console.log('Teste de conexão:', result.length > 0 ? 'OK' : 'FALHOU')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Teste OK',
      receivedData: data
    })
  } catch (error) {
    console.error('Erro no teste:', error)
    return NextResponse.json(
      { 
        error: 'Erro no teste',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}