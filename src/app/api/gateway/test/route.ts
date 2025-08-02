import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { gateway, credentials } = await request.json()
    
    console.log('🧪 Testing gateway connection:', { gateway, credentials: '***' })
    
    if (gateway === 'asaas') {
      return await testAsaasConnection(credentials)
    } else if (gateway === 'pjbank') {
      return await testPJBankConnection(credentials)
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Gateway não suportado' 
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ Gateway test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function testAsaasConnection(credentials: any) {
  try {
    const { asaas_api_key, asaas_environment } = credentials
    
    if (!asaas_api_key) {
      return NextResponse.json({ 
        success: false, 
        error: 'API Key do Asaas é obrigatória' 
      }, { status: 400 })
    }
    
    const baseUrl = asaas_environment === 'production' 
      ? 'https://www.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3'
    
    console.log('🔗 Testing Asaas connection to:', baseUrl)
    
    const response = await fetch(`${baseUrl}/myAccount`, {
      method: 'GET',
      headers: {
        'access_token': asaas_api_key,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        gateway: 'asaas',
        environment: asaas_environment,
        message: 'Conexão com Asaas realizada com sucesso!',
        account_info: {
          name: data.name || 'N/A',
          email: data.email || 'N/A',
          document: data.cpfCnpj || 'N/A'
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        gateway: 'asaas',
        error: 'Falha na autenticação com Asaas',
        details: data
      }, { status: 401 })
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      gateway: 'asaas', 
      error: 'Erro ao conectar com Asaas',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function testPJBankConnection(credentials: any) {
  try {
    const { pjbank_credencial, pjbank_chave } = credentials
    
    if (!pjbank_credencial || !pjbank_chave) {
      return NextResponse.json({ 
        success: false, 
        error: 'Credencial e Chave do PJBank são obrigatórias' 
      }, { status: 400 })
    }
    
    console.log('🔗 Testing PJBank connection...')
    
    const response = await fetch('https://api.pjbank.com.br/recebimentos', {
      method: 'GET',
      headers: {
        'X-CNPJ-TOKEN': pjbank_credencial,
        'X-CHAVE-TOKEN': pjbank_chave,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        gateway: 'pjbank',
        message: 'Conexão com PJBank realizada com sucesso!',
        account_info: data
      })
    } else {
      return NextResponse.json({
        success: false,
        gateway: 'pjbank',
        error: 'Falha na autenticação com PJBank',
        details: data
      }, { status: 401 })
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      gateway: 'pjbank',
      error: 'Erro ao conectar com PJBank', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}