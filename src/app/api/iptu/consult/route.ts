import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import IPTUService from '@/services/iptu-service'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { propertyRegistration } = body

    if (!propertyRegistration) {
      return NextResponse.json(
        { error: 'Cadastro do imóvel é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar configurações da API
    const apiSettings = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/settings`, {
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
      }
    })
    
    let infosimplesApiKey = ''
    if (apiSettings.ok) {
      const settings = await apiSettings.json()
      infosimplesApiKey = settings.api?.infosimplesApiKey || ''
    }

    // Inicializar serviço IPTU
    const iptuService = new IPTUService(infosimplesApiKey)
    
    if (!iptuService.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Serviço de consulta IPTU não está configurado. Verifique a API key da InfoSimples nas configurações.'
      })
    }

    // Realizar consulta
    const result = await iptuService.consultIPTUDebt(propertyRegistration)
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      })
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Erro na API de consulta IPTU:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

// GET para teste da configuração
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const iptuService = new IPTUService()
    
    return NextResponse.json({
      configured: iptuService.isConfigured(),
      message: iptuService.isConfigured() 
        ? 'Serviço de consulta IPTU está configurado'
        : 'API key da InfoSimples não configurada'
    })

  } catch (error) {
    console.error('Erro ao verificar configuração IPTU:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}