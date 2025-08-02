import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCompanyGatewayCredentials, getPreferredGateway } from '@/lib/gateway-credentials'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const { amount, dueDate, customer, description } = await request.json()
    const companyId = session.user.companyId
    
    console.log('💳 User generating boleto for company:', { 
      companyId, 
      amount, 
      dueDate, 
      customer: customer.name 
    })
    
    // Buscar credenciais da empresa
    const credentials = await getCompanyGatewayCredentials(companyId)
    
    if (!credentials) {
      return NextResponse.json({ 
        success: false, 
        error: 'Gateway não configurado',
        message: 'Entre em contato com o administrador para configurar o gateway de pagamento'
      }, { status: 400 })
    }
    
    // Determinar qual gateway usar
    const preferredGateway = await getPreferredGateway(companyId)
    
    if (!preferredGateway) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nenhum gateway válido configurado',
        message: 'Entre em contato com o administrador para configurar as credenciais do gateway'
      }, { status: 400 })
    }
    
    console.log('🎯 Using gateway:', preferredGateway)
    
    if (preferredGateway === 'asaas') {
      return await generateAsaasBoleto(credentials, amount, dueDate, customer, description)
    } else if (preferredGateway === 'pjbank') {
      return await generatePJBankBoleto(credentials, amount, dueDate, customer, description)
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Gateway não suportado' 
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ User boleto generation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function generateAsaasBoleto(credentials: any, amount: number, dueDate: string, customer: any, description?: string) {
  try {
    const { asaas_api_key, asaas_environment } = credentials
    
    const baseUrl = asaas_environment === 'production' 
      ? 'https://www.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3'
    
    // Primeiro criar o cliente
    const customerResponse = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'access_token': asaas_api_key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: customer.name,
        email: customer.email,
        cpfCnpj: customer.document,
        mobilePhone: customer.phone || '11999999999'
      })
    })
    
    const customerData = await customerResponse.json()
    
    if (!customerResponse.ok) {
      return NextResponse.json({
        success: false,
        gateway: 'asaas',
        error: 'Erro ao criar cliente no Asaas',
        details: customerData
      }, { status: 400 })
    }
    
    // Criar a cobrança
    const paymentResponse = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'access_token': asaas_api_key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: customerData.id,
        billingType: 'BOLETO',
        value: amount,
        dueDate: dueDate,
        description: description || 'Pagamento via CRM Imobiliário',
        externalReference: `user-${Date.now()}`
      })
    })
    
    const paymentData = await paymentResponse.json()
    
    if (paymentResponse.ok) {
      return NextResponse.json({
        success: true,
        gateway: 'asaas',
        environment: asaas_environment,
        message: 'Boleto gerado com sucesso!',
        boleto: {
          id: paymentData.id,
          value: paymentData.value,
          dueDate: paymentData.dueDate,
          status: paymentData.status,
          boletoUrl: paymentData.bankSlipUrl,
          barCode: paymentData.nossoNumero,
          customer: {
            name: customerData.name,
            email: customerData.email
          }
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        gateway: 'asaas',
        error: 'Erro ao gerar boleto no Asaas',
        details: paymentData
      }, { status: 400 })
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      gateway: 'asaas',
      error: 'Erro ao gerar boleto Asaas',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function generatePJBankBoleto(credentials: any, amount: number, dueDate: string, customer: any, description?: string) {
  try {
    const { pjbank_credencial, pjbank_chave } = credentials
    
    const response = await fetch('https://api.pjbank.com.br/recebimentos', {
      method: 'POST',
      headers: {
        'X-CNPJ-TOKEN': pjbank_credencial,
        'X-CHAVE-TOKEN': pjbank_chave,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vencimento: dueDate,
        valor: amount,
        juros: 0.00,
        multa: 0.00,
        desconto: 0.00,
        nome_cliente: customer.name,
        email_cliente: customer.email,
        cpf_cliente: customer.document,
        endereco_cliente: customer.address || 'Rua Teste, 123',
        numero_cliente: customer.number || '123',
        complemento_cliente: customer.complement || '',
        bairro_cliente: customer.neighborhood || 'Centro',
        cidade_cliente: customer.city || 'São Paulo',
        estado_cliente: customer.state || 'SP',
        cep_cliente: customer.zipCode || '01000000',
        logo_url: '',
        texto: description || 'Pagamento via CRM Imobiliário',
        grupo: 'CRM_USER'
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        gateway: 'pjbank',
        message: 'Boleto gerado com sucesso!',
        boleto: {
          id: data.id_unico,
          value: amount,
          dueDate: dueDate,
          boletoUrl: data.linkBoleto,
          barCode: data.linha_digitavel,
          customer: {
            name: customer.name,
            email: customer.email
          }
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        gateway: 'pjbank',
        error: 'Erro ao gerar boleto no PJBank',
        details: data
      }, { status: 400 })
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      gateway: 'pjbank',
      error: 'Erro ao gerar boleto PJBank',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}