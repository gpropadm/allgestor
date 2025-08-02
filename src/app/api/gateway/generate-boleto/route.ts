import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { gateway, credentials, amount, dueDate, customer } = await request.json()
    
    console.log('💳 Generating boleto:', { 
      gateway, 
      amount, 
      dueDate, 
      customer: customer.name 
    })
    
    if (gateway === 'asaas') {
      return await generateAsaasBoleto(credentials, amount, dueDate, customer)
    } else if (gateway === 'pjbank') {
      return await generatePJBankBoleto(credentials, amount, dueDate, customer)
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Gateway não suportado' 
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ Boleto generation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function generateAsaasBoleto(credentials: any, amount: number, dueDate: string, customer: any) {
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
        description: 'Boleto de teste - CRM Imobiliário',
        externalReference: `test-${Date.now()}`
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

async function generatePJBankBoleto(credentials: any, amount: number, dueDate: string, customer: any) {
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
        endereco_cliente: 'Rua Teste, 123',
        numero_cliente: '123',
        complemento_cliente: '',
        bairro_cliente: 'Centro',
        cidade_cliente: 'São Paulo',
        estado_cliente: 'SP',
        cep_cliente: '01000000',
        logo_url: '',
        texto: 'Boleto de teste - CRM Imobiliário',
        grupo: 'CRM_TEST'
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