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
    
    // Gerar o arquivo TXT
    const txtContent = await gerarArquivoDimobTxt(user.id, year, ownerId)
    
    // Analisar apenas o cabeçalho (primeira linha)
    const lines = txtContent.split('\r\n')
    const headerLine = lines[0]
    
    // Análise byte por byte do header
    const headerBytes = []
    for (let i = 0; i < Math.min(20, headerLine.length); i++) {
      const char = headerLine[i]
      headerBytes.push({
        position: i + 1,
        char: char,
        charCode: char.charCodeAt(0),
        hex: char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'),
        isSpace: char === ' '
      })
    }
    
    // Verificar se começa com DIMOB
    const startsWithDIMOB = headerLine.startsWith('DIMOB')
    const headerLength = headerLine.length
    const expectedLength = 374
    
    // Contar espaços após DIMOB
    let spacesAfterDimob = 0
    for (let i = 5; i < headerLine.length; i++) {
      if (headerLine[i] === ' ') {
        spacesAfterDimob++
      } else {
        break
      }
    }
    
    // Verificar se há caracteres não-espaço após DIMOB
    const nonSpaceCharsAfterDimob = headerLine.substring(5).replace(/ /g, '')
    
    return NextResponse.json({
      debug: {
        year,
        ownerId,
        totalLines: lines.length
      },
      header: {
        startsWithDIMOB,
        length: headerLength,
        expectedLength,
        lengthOK: headerLength === expectedLength,
        spacesAfterDimob,
        expectedSpaces: 369,
        spacesOK: spacesAfterDimob === 369,
        nonSpaceCharsAfterDimob,
        shouldBeEmpty: nonSpaceCharsAfterDimob === ''
      },
      headerBytes: headerBytes,
      firstChars: headerLine.substring(0, 10),
      lastChars: headerLine.substring(headerLine.length - 10),
      fullHeader: headerLine,
      allLines: lines.map((line, idx) => ({
        line: idx + 1,
        type: line.substring(0, 3),
        length: line.length,
        startsCorrectly: 
          idx === 0 ? line.startsWith('DIMOB') :
          idx === 1 ? line.startsWith('R01') :
          line.startsWith('R02') || line.startsWith('T9')
      }))
    })
    
  } catch (error) {
    console.error('Debug header error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}