import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { gerarComprovanteRendimentos, gerarHTMLComprovante } from '@/lib/comprovante-rendimentos'
import htmlToPdf from 'html-pdf-node'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { ownerId, contractId, ano } = await request.json()
    
    console.log('📄 POST /api/comprovantes/pdf - Gerando PDF:', { ownerId, contractId, ano })
    
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
    
    // Configurações para PDF
    const options = {
      format: 'A4',
      border: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true,
      displayHeaderFooter: false
    }
    
    const file = { content: html }
    
    // Gerar PDF usando html-pdf-node
    const pdfBuffer = await htmlToPdf.generatePdf(file, options)
    
    const filename = `comprovante-rendimentos-${comprovanteData.locador.nome.replace(/[^a-zA-Z0-9]/g, '-')}-${ano}.pdf`
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error)
    return NextResponse.json({
      error: 'Erro ao gerar PDF do comprovante',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}