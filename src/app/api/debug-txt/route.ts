import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithCompany } from '@/lib/auth-middleware'
import { gerarArquivoDimobTxt } from '@/lib/dimob-txt-generator'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthWithCompany(request)
    const { year, ownerId } = await request.json()
    
    if (!year || !ownerId) {
      return NextResponse.json({ error: 'year and ownerId required' }, { status: 400 })
    }
    
    console.log(`🔍 Debug TXT: gerando para proprietário ${ownerId}, ano ${year}`)
    
    // Gerar o arquivo TXT
    const txtContent = await gerarArquivoDimobTxt(user.id, year, ownerId)
    
    // Analisar o conteúdo linha por linha
    const lines = txtContent.split('\r\n')
    console.log(`📄 Total de linhas: ${lines.length}`)
    
    const analysis = lines.map((line, index) => ({
      lineNumber: index + 1,
      type: line.substring(0, 3),
      length: line.length,
      content: line.length > 100 ? line.substring(0, 100) + '...' : line
    }))
    
    console.log('📊 Análise das linhas:')
    analysis.forEach(line => {
      if (line.content.trim()) {
        console.log(`Linha ${line.lineNumber}: ${line.type} (${line.length} chars)`)
      }
    })
    
    // Verificar se o primeiro registro é o Header correto
    const firstLine = lines[0]
    const isValidHeader = firstLine.startsWith('DIMOB') && firstLine.length === 374
    
    // Contar registros por tipo
    const recordCounts = {
      HEADER: lines.filter(l => l.startsWith('DIMOB')).length,
      R01: lines.filter(l => l.startsWith('R01')).length,
      R02: lines.filter(l => l.startsWith('R02')).length,
      T9: lines.filter(l => l.startsWith('T9')).length,
      EMPTY: lines.filter(l => l.trim() === '').length
    }
    
    return NextResponse.json({
      debug: {
        year,
        ownerId,
        totalLines: lines.length,
        firstLineValid: isValidHeader,
        firstLineLength: firstLine.length,
        firstLineType: firstLine.substring(0, 5)
      },
      recordCounts,
      analysis: analysis.filter(l => l.content.trim()),
      sampleLines: {
        header: lines[0],
        r01: lines.find(l => l.startsWith('R01')),
        firstR02: lines.find(l => l.startsWith('R02')),
        trailer: lines.find(l => l.startsWith('T9'))
      },
      fullContent: txtContent.length < 2000 ? txtContent : txtContent.substring(0, 2000) + '...'
    })
    
  } catch (error) {
    console.error('Debug TXT error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}