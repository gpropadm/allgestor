import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { gerarComprovanteRendimentos, gerarHTMLComprovante } from '@/lib/comprovante-rendimentos'
import puppeteer from 'puppeteer'

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
    
    // Gerar PDF usando Puppeteer (alternativa para ambiente serverless)
    let browser
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      
      const page = await browser.newPage()
      await page.setContent(html)
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true
      })
      
      const filename = `comprovante-rendimentos-${comprovanteData.locador.nome.replace(/[^a-zA-Z0-9]/g, '-')}-${ano}.pdf`
      
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString()
        }
      })
      
    } finally {
      if (browser) {
        await browser.close()
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error)
    return NextResponse.json({
      error: 'Erro ao gerar PDF do comprovante',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}