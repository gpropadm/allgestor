import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { gerarArquivoDimobTxt } from '@/lib/dimob-txt-generator'

export async function GET(request: NextRequest) {
  try {
    console.log('📄 [DIMOB] API Generate TXT called')
    
    // Verificar autenticação
    const user = await requireAuth(request)
    console.log('👤 Usuário autenticado:', user.email)
    
    // Obter parâmetros
    const { searchParams } = new URL(request.url)
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString())
    
    console.log('📅 Gerando DIMOB para ano:', ano)
    
    // Gerar conteúdo do arquivo
    const conteudoTxt = await gerarArquivoDimobTxt(user.id, ano)
    
    // Nome do arquivo
    const nomeArquivo = `DIMOB_${ano}.txt`
    
    console.log('✅ Arquivo DIMOB gerado com sucesso')
    
    // Retornar arquivo para download
    return new NextResponse(conteudoTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
        'Cache-Control': 'no-cache'
      }
    })
    
  } catch (error) {
    console.error('❌ [DIMOB] Erro ao gerar arquivo:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao gerar arquivo DIMOB',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📄 [DIMOB] API Generate TXT (POST) called')
    
    // Verificar autenticação  
    const user = await requireAuth(request)
    const { ano } = await request.json()
    
    console.log('📅 Gerando DIMOB para ano:', ano)
    
    // Gerar conteúdo do arquivo
    const conteudoTxt = await gerarArquivoDimobTxt(user.id, ano || new Date().getFullYear())
    
    // Retornar conteúdo como JSON (para visualização)
    return NextResponse.json({
      success: true,
      ano,
      conteudo: conteudoTxt,
      linhas: conteudoTxt.split('\n').length - 1,
      tamanho: conteudoTxt.length
    })
    
  } catch (error) {
    console.error('❌ [DIMOB] Erro ao gerar arquivo:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao gerar arquivo DIMOB',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}