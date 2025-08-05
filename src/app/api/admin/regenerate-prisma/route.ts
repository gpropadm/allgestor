import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 FORÇANDO REGENERAÇÃO DO PRISMA CLIENT...')

    // Tentar regenerar Prisma client dinamicamente
    const { spawn } = await import('child_process')
    
    return new Promise((resolve) => {
      const process = spawn('npx', ['prisma', 'generate'], {
        stdio: 'pipe'
      })

      let output = ''
      let errorOutput = ''

      process.stdout?.on('data', (data) => {
        output += data.toString()
        console.log('STDOUT:', data.toString())
      })

      process.stderr?.on('data', (data) => {
        errorOutput += data.toString()
        console.error('STDERR:', data.toString())
      })

      process.on('close', (code) => {
        console.log('Prisma generate finished with code:', code)
        
        const response = NextResponse.json({
          success: code === 0,
          message: code === 0 
            ? '🎉 Prisma Client regenerado com sucesso!' 
            : '❌ Erro ao regenerar Prisma Client',
          output,
          errorOutput,
          exitCode: code,
          instructions: code === 0 ? [
            '1. O Prisma Client foi regenerado',
            '2. Tente acessar /api/recibos novamente',
            '3. Os recibos devem aparecer agora'
          ] : [
            '1. Verifique os logs de erro',
            '2. Pode ser necessário redeploy manual'
          ],
          timestamp: new Date().toISOString()
        })

        resolve(response)
      })

      // Timeout após 30 segundos
      setTimeout(() => {
        process.kill()
        resolve(NextResponse.json({
          success: false,
          message: '⏰ Timeout: Prisma generate demorou mais que 30s',
          output,
          errorOutput,
          timestamp: new Date().toISOString()
        }))
      }, 30000)
    })

  } catch (error: any) {
    console.error('❌ ERRO:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao tentar regenerar Prisma Client',
      details: error.message,
      suggestion: 'Pode ser necessário fazer redeploy da aplicação',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Também permitir GET para facilitar teste
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST para regenerar o Prisma Client',
    endpoint: '/api/admin/regenerate-prisma',
    method: 'POST'
  })
}