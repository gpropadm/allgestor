import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { gerarComprovanteRendimentos, gerarHTMLComprovante } from '@/lib/comprovante-rendimentos'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { ownerId, contractId, ano } = await request.json()
    
    console.log('📄 POST /api/comprovantes/html - Gerando HTML:', { ownerId, contractId, ano })
    
    if (!ownerId || !contractId || !ano) {
      return NextResponse.json({
        error: 'Parâmetros obrigatórios: ownerId, contractId, ano'
      }, { status: 400 })
    }
    
    // Gerar os dados do comprovante
    const comprovanteData = await gerarComprovanteRendimentos(ownerId, contractId, ano, user.id)
    
    if (!comprovanteData) {
      return NextResponse.json({
        error: 'Não foi possível gerar o comprovante. Verifique se existem pagamentos pagos no ano especificado.'
      }, { status: 404 })
    }
    
    // Gerar HTML
    const html = gerarHTMLComprovante(comprovanteData)
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="comprovante-${comprovanteData.locador.nome.replace(/[^a-zA-Z0-9]/g, '-')}-${ano}.html"`
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao gerar HTML:', error)
    return NextResponse.json({
      error: 'Erro ao gerar HTML do comprovante',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}