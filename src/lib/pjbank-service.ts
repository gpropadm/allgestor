interface PJBankCustomer {
  nome_cliente: string
  email_cliente: string
  cpf_cliente?: string
  cnpj_cliente?: string
  telefone_cliente?: string
  endereco_cliente?: string
  numero_cliente?: string
  complemento_cliente?: string
  bairro_cliente?: string
  cidade_cliente?: string
  estado_cliente?: string
  cep_cliente?: string
}

interface PJBankBoleto {
  vencimento: string
  valor: number
  juros?: number
  multa?: number
  desconto?: number
  texto_instrucao?: string
  texto_instrucao_2?: string
  texto_instrucao_3?: string
  nosso_numero?: string
  pedido_numero: string
  cliente: PJBankCustomer
  split?: PJBankSplit[]
}

interface PJBankSplit {
  conta_favorecida: string
  valor_split: number
  descricao?: string
}

interface PJBankBoletoResponse {
  status: string
  id_unico: string
  nosso_numero: string
  codigo_barras: string
  linha_digitavel: string
  link_boleto: string
  link_segunda_via: string
  link_pix?: string
  qr_code_pix?: string
}

interface PJBankAccount {
  banco: string
  agencia: string
  conta: string
  tipo_conta: 'corrente' | 'poupanca'
  documento: string
  nome_favorecido: string
  email_favorecido?: string
  telefone_favorecido?: string
}

interface PJBankWebhookEvent {
  id_unico: string
  nosso_numero: string
  pedido_numero: string
  status_pjbank: string
  valor: number
  valor_liquido: number
  taxa_boleto: number
  taxa_repasse: number
  repasses?: Array<{
    conta_favorecida: string
    valor_repasse: number
    status_repasse: string
  }>
  data_vencimento: string
  data_pagamento?: string
  data_credito?: string
}

export class PJBankService {
  private credencial: string
  private chave: string
  private baseUrl: string
  private isSandbox: boolean

  constructor() {
    this.credencial = process.env.PJBANK_CREDENCIAL || ''
    this.chave = process.env.PJBANK_CHAVE || ''
    this.isSandbox = process.env.NODE_ENV !== 'production'
    this.baseUrl = this.isSandbox 
      ? 'https://sandbox.pjbank.com.br'
      : 'https://api.pjbank.com.br'
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CRM-Imobiliario/1.0',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`PJBank API Error: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    return response.json()
  }

  async createBoleto(boletoData: PJBankBoleto): Promise<PJBankBoletoResponse> {
    try {
      const payload = {
        credencial: this.credencial,
        chave: this.chave,
        ...boletoData
      }

      const response = await this.makeRequest('/recebimentos', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      return response
    } catch (error) {
      console.error('Error creating PJBank boleto:', error)
      throw new Error('Erro ao criar boleto no PJBank')
    }
  }

  async getBoleto(idUnico: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/recebimentos/${this.credencial}/${idUnico}`, {
        method: 'GET',
        headers: {
          'X-CHAVE': this.chave
        }
      })

      return response
    } catch (error) {
      console.error('Error getting PJBank boleto:', error)
      throw new Error('Erro ao buscar boleto no PJBank')
    }
  }

  async createAccount(accountData: PJBankAccount): Promise<{ conta_favorecida: string }> {
    try {
      const payload = {
        credencial: this.credencial,
        chave: this.chave,
        ...accountData
      }

      const response = await this.makeRequest('/subcontas', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      return response
    } catch (error) {
      console.error('Error creating PJBank account:', error)
      throw new Error('Erro ao criar conta no PJBank')
    }
  }

  async validateAccount(accountData: PJBankAccount): Promise<{ validacao: boolean }> {
    try {
      const payload = {
        credencial: this.credencial,
        chave: this.chave,
        ...accountData
      }

      const response = await this.makeRequest('/subcontas/validar', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      return response
    } catch (error) {
      console.error('Error validating PJBank account:', error)
      throw new Error('Erro ao validar conta no PJBank')
    }
  }

  async createBoletoWithSplit(
    customerData: PJBankCustomer,
    amount: number,
    dueDate: string,
    description: string,
    ownerAccountId: string,
    administrationFeePercentage: number,
    externalReference: string
  ): Promise<{
    boleto: PJBankBoletoResponse
    splits: {
      ownerAccountId: string
      ownerAmount: number
      companyAmount: number
      fees: {
        boletoFee: number
        splitFee: number
        total: number
      }
    }
  }> {
    try {
      // Calcular valores do split
      const companyAmount = amount * (administrationFeePercentage / 100)
      const ownerAmount = amount - companyAmount
      
      // Taxas do PJBank
      const boletoFee = 4.00 // R$ 4,00 por boleto
      const splitFee = 4.00 // R$ 4,00 por split
      const totalFees = boletoFee + splitFee

      // Criar boleto com split
      const boletoData: PJBankBoleto = {
        vencimento: dueDate,
        valor: amount,
        pedido_numero: externalReference,
        cliente: customerData,
        texto_instrucao: description,
        texto_instrucao_2: `Taxa de administração: ${administrationFeePercentage}%`,
        texto_instrucao_3: 'Pagamento via boleto bancário',
        split: [
          {
            conta_favorecida: ownerAccountId,
            valor_split: ownerAmount,
            descricao: `Repasse proprietário - ${administrationFeePercentage}% admin`
          }
        ]
      }

      const boleto = await this.createBoleto(boletoData)

      return {
        boleto,
        splits: {
          ownerAccountId,
          ownerAmount,
          companyAmount,
          fees: {
            boletoFee,
            splitFee,
            total: totalFees
          }
        }
      }
    } catch (error) {
      console.error('Error creating boleto with split:', error)
      throw new Error('Erro ao gerar boleto com split no PJBank')
    }
  }

  async processWebhook(webhookData: PJBankWebhookEvent): Promise<{
    paymentId: string
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
    paidDate?: string
    paidAmount?: number
    netAmount?: number
    splits?: Array<{
      accountId: string
      amount: number
      status: string
    }>
  }> {
    try {
      const { status_pjbank, pedido_numero, valor, valor_liquido, data_pagamento, repasses } = webhookData

      let status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' = 'PENDING'

      switch (status_pjbank) {
        case 'PAGO':
        case 'LIQUIDADO':
          status = 'PAID'
          break
        case 'VENCIDO':
        case 'ATRASADO':
          status = 'OVERDUE'
          break
        case 'CANCELADO':
          status = 'CANCELLED'
          break
        default:
          status = 'PENDING'
      }

      const splits = repasses?.map(repasse => ({
        accountId: repasse.conta_favorecida,
        amount: repasse.valor_repasse,
        status: repasse.status_repasse
      }))

      return {
        paymentId: pedido_numero,
        status,
        paidDate: data_pagamento,
        paidAmount: valor,
        netAmount: valor_liquido,
        splits
      }
    } catch (error) {
      console.error('Error processing PJBank webhook:', error)
      throw new Error('Erro ao processar webhook do PJBank')
    }
  }

  async getPaymentsByPeriod(startDate: string, endDate: string): Promise<any[]> {
    try {
      const response = await this.makeRequest(
        `/recebimentos/${this.credencial}?data_inicio=${startDate}&data_fim=${endDate}`,
        {
          method: 'GET',
          headers: {
            'X-CHAVE': this.chave
          }
        }
      )

      return response.data || []
    } catch (error) {
      console.error('Error getting PJBank payments by period:', error)
      throw new Error('Erro ao buscar pagamentos por período no PJBank')
    }
  }

  async getAccountBalance(): Promise<{ balance: number }> {
    try {
      const response = await this.makeRequest(`/recebimentos/${this.credencial}/saldo`, {
        method: 'GET',
        headers: {
          'X-CHAVE': this.chave
        }
      })

      return {
        balance: response.saldo || 0
      }
    } catch (error) {
      console.error('Error getting PJBank balance:', error)
      throw new Error('Erro ao buscar saldo no PJBank')
    }
  }

  calculateOptimalGateway(amount: number): {
    gateway: 'PJBANK' | 'ASAAS'
    estimatedFee: number
    reason: string
  } {
    // Calcular taxa estimada para cada gateway
    const pjbankFee = 8.00 // R$ 4,00 boleto + R$ 4,00 split
    const asaasFee = amount * 0.035 // 3,5% aproximado (boleto + split)

    if (pjbankFee <= asaasFee) {
      return {
        gateway: 'PJBANK',
        estimatedFee: pjbankFee,
        reason: `Taxa fixa de R$ ${pjbankFee.toFixed(2)} é menor que ${((asaasFee/amount)*100).toFixed(2)}% do Asaas`
      }
    } else {
      return {
        gateway: 'ASAAS',
        estimatedFee: asaasFee,
        reason: `Taxa percentual de ${((asaasFee/amount)*100).toFixed(2)}% é menor que R$ ${pjbankFee.toFixed(2)} do PJBank`
      }
    }
  }
}