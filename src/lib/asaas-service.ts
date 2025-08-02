interface AsaasCustomer {
  id?: string
  name: string
  email: string
  phone: string
  mobilePhone?: string
  cpfCnpj: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  city?: string
  state?: string
}

interface AsaasPayment {
  id?: string
  customer: string
  billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD'
  value: number
  dueDate: string
  description: string
  externalReference?: string
  installmentCount?: number
  installmentValue?: number
  split?: AsaasSplit[]
}

interface AsaasSplit {
  walletId: string
  fixedValue?: number
  percentualValue?: number
  totalValue?: number
}

interface AsaasWallet {
  id?: string
  name: string
  email: string
  cpfCnpj: string
  companyType?: string
  phone?: string
  mobilePhone?: string
  site?: string
  incomeValue?: number
  bankAccount?: {
    bank: {
      code: string
    }
    accountName: string
    ownerName: string
    ownerBirthDate?: string
    cpfCnpj: string
    agency: string
    account: string
    accountDigit: string
    bankAccountType: 'CONTA_CORRENTE' | 'CONTA_POUPANCA'
  }
}

interface AsaasWebhookEvent {
  event: string
  payment: {
    id: string
    customer: string
    value: number
    netValue: number
    originalValue: number
    status: string
    billingType: string
    dueDate: string
    originalDueDate: string
    paymentDate?: string
    clientPaymentDate?: string
    installmentNumber?: number
    description: string
    externalReference?: string
    invoiceUrl?: string
    bankSlipUrl?: string
    transactionReceiptUrl?: string
  }
}

export class AsaasService {
  private apiKey: string
  private baseUrl: string
  private isSandbox: boolean

  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || ''
    this.isSandbox = process.env.NODE_ENV !== 'production'
    this.baseUrl = this.isSandbox 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://www.asaas.com/api/v3'
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'CRM-Imobiliario/1.0',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Asaas API Error: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    return response.json()
  }

  async createCustomer(customerData: AsaasCustomer): Promise<AsaasCustomer> {
    try {
      const response = await this.makeRequest('/customers', {
        method: 'POST',
        body: JSON.stringify(customerData),
      })

      return response
    } catch (error) {
      console.error('Error creating Asaas customer:', error)
      throw new Error('Erro ao criar cliente no Asaas')
    }
  }

  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    try {
      const response = await this.makeRequest(`/customers/${customerId}`)
      return response
    } catch (error) {
      console.error('Error getting Asaas customer:', error)
      throw new Error('Erro ao buscar cliente no Asaas')
    }
  }

  async updateCustomer(customerId: string, customerData: Partial<AsaasCustomer>): Promise<AsaasCustomer> {
    try {
      const response = await this.makeRequest(`/customers/${customerId}`, {
        method: 'POST',
        body: JSON.stringify(customerData),
      })

      return response
    } catch (error) {
      console.error('Error updating Asaas customer:', error)
      throw new Error('Erro ao atualizar cliente no Asaas')
    }
  }

  async createPayment(paymentData: AsaasPayment): Promise<any> {
    try {
      const response = await this.makeRequest('/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      })

      return response
    } catch (error) {
      console.error('Error creating Asaas payment:', error)
      throw new Error('Erro ao criar cobrança no Asaas')
    }
  }

  async getPayment(paymentId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/payments/${paymentId}`)
      return response
    } catch (error) {
      console.error('Error getting Asaas payment:', error)
      throw new Error('Erro ao buscar cobrança no Asaas')
    }
  }

  async createWallet(walletData: AsaasWallet): Promise<AsaasWallet> {
    try {
      const response = await this.makeRequest('/subAccounts', {
        method: 'POST',
        body: JSON.stringify(walletData),
      })

      return response
    } catch (error) {
      console.error('Error creating Asaas wallet:', error)
      throw new Error('Erro ao criar subconta no Asaas')
    }
  }

  async getWallet(walletId: string): Promise<AsaasWallet> {
    try {
      const response = await this.makeRequest(`/subAccounts/${walletId}`)
      return response
    } catch (error) {
      console.error('Error getting Asaas wallet:', error)
      throw new Error('Erro ao buscar subconta no Asaas')
    }
  }

  async updateWallet(walletId: string, walletData: Partial<AsaasWallet>): Promise<AsaasWallet> {
    try {
      const response = await this.makeRequest(`/subAccounts/${walletId}`, {
        method: 'POST',
        body: JSON.stringify(walletData),
      })

      return response
    } catch (error) {
      console.error('Error updating Asaas wallet:', error)
      throw new Error('Erro ao atualizar subconta no Asaas')
    }
  }

  async createBoletoWithSplit(
    customerData: AsaasCustomer,
    amount: number,
    dueDate: string,
    description: string,
    ownerWalletId: string,
    administrationFeePercentage: number,
    externalReference?: string
  ): Promise<{
    payment: any
    boletoUrl: string
    pixQrCode?: string
    splits: {
      ownerId: string
      ownerAmount: number
      companyAmount: number
      fee: number
    }
  }> {
    try {
      // Criar/atualizar cliente
      let customer: AsaasCustomer
      try {
        customer = await this.createCustomer(customerData)
      } catch (error) {
        // Se cliente já existe, buscar pelo email
        const customers = await this.makeRequest(`/customers?email=${customerData.email}`)
        if (customers.data && customers.data.length > 0) {
          customer = customers.data[0]
        } else {
          throw error
        }
      }

      // Calcular split
      const companyAmount = amount * (administrationFeePercentage / 100)
      const ownerAmount = amount - companyAmount
      const asaasFee = amount * 0.018 // Taxa estimada do Asaas (1,8%)

      // Criar cobrança com split
      const paymentData: AsaasPayment = {
        customer: customer.id!,
        billingType: 'BOLETO',
        value: amount,
        dueDate,
        description,
        externalReference,
        split: [
          {
            walletId: ownerWalletId,
            fixedValue: ownerAmount
          }
        ]
      }

      const payment = await this.createPayment(paymentData)

      return {
        payment,
        boletoUrl: payment.bankSlipUrl || payment.invoiceUrl,
        pixQrCode: payment.pixQrCode,
        splits: {
          ownerId: ownerWalletId,
          ownerAmount,
          companyAmount,
          fee: asaasFee
        }
      }
    } catch (error) {
      console.error('Error creating boleto with split:', error)
      throw new Error('Erro ao gerar boleto com split no Asaas')
    }
  }

  async processWebhook(webhookData: AsaasWebhookEvent): Promise<{
    paymentId: string
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
    paidDate?: string
    paidAmount?: number
  }> {
    try {
      const { event, payment } = webhookData

      let status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' = 'PENDING'

      switch (event) {
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED':
          status = 'PAID'
          break
        case 'PAYMENT_OVERDUE':
          status = 'OVERDUE'
          break
        case 'PAYMENT_DELETED':
          status = 'CANCELLED'
          break
        default:
          status = 'PENDING'
      }

      return {
        paymentId: payment.externalReference || payment.id,
        status,
        paidDate: payment.paymentDate || payment.clientPaymentDate,
        paidAmount: payment.value
      }
    } catch (error) {
      console.error('Error processing Asaas webhook:', error)
      throw new Error('Erro ao processar webhook do Asaas')
    }
  }

  async getAccountBalance(): Promise<{ balance: number }> {
    try {
      const response = await this.makeRequest('/finance/balance')
      return {
        balance: response.balance || 0
      }
    } catch (error) {
      console.error('Error getting Asaas balance:', error)
      throw new Error('Erro ao buscar saldo no Asaas')
    }
  }

  async getPaymentsByPeriod(startDate: string, endDate: string): Promise<any[]> {
    try {
      const response = await this.makeRequest(
        `/payments?dateCreated[ge]=${startDate}&dateCreated[le]=${endDate}&limit=100`
      )
      return response.data || []
    } catch (error) {
      console.error('Error getting Asaas payments by period:', error)
      throw new Error('Erro ao buscar pagamentos por período no Asaas')
    }
  }
}