import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithCompany } from '@/lib/auth-middleware'
import { gerarArquivoDimobTxt } from '@/lib/dimob-txt-generator'

// POST - Gerar arquivo DIMOB oficial com dados reais dos contratos
export async function POST(request: NextRequest) {
  try {
    console.log('=== DIMOB OFFICIAL GENERATOR API ===')
    const user = await requireAuthWithCompany(request)
    console.log('User ID:', user.id)
    
    const { year, ownerId } = await request.json()
    console.log('Year requested:', year)
    console.log('Owner ID:', ownerId)
    
    if (!year || year < 2020 || year > 2030) {
      return NextResponse.json(
        { error: 'Ano inválido. Deve estar entre 2020 e 2030.' },
        { status: 400 }
      )
    }

    if (!ownerId) {
      return NextResponse.json(
        { error: 'ID do proprietário é obrigatório.' },
        { status: 400 }
      )
    }

    console.log(`🚀 Iniciando geração DIMOB para proprietário ${ownerId}, ano ${year}...`)
    
    // Gerar arquivo TXT usando a função oficial (modificada para aceitar ownerId)
    const txtContent = await gerarArquivoDimobTxt(user.id, year, ownerId)
    
    console.log(`✅ DIMOB gerado com sucesso! Tamanho: ${txtContent.length} caracteres`)
    
    // Retornar como arquivo para download
    const response = new NextResponse(txtContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="DIMOB_${year}.txt"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    return response
  } catch (error) {
    console.error('❌ Erro ao gerar DIMOB:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao gerar DIMOB'
    
    // Se for erro de validação com lista detalhada, manter formatação
    if (errorMessage.includes('DADOS OBRIGATÓRIOS FALTANDO')) {
      return NextResponse.json(
        { 
          error: errorMessage,
          type: 'validation_error'
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        type: 'generation_error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}