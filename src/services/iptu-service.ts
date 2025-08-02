interface IPTUDebt {
  year: string
  amount: string
  dueDate: string
  installments: IPTUInstallment[]
  totalAmount: string
  paidAmount: string
  remainingAmount: string
}

interface IPTUInstallment {
  installment: string
  dueDate: string
  amount: string
  status: 'paid' | 'pending' | 'overdue'
  paymentDate?: string
}

interface IPTUResponse {
  success: boolean
  data?: {
    propertyAddress: string
    taxNumber: string
    debts: IPTUDebt[]
    totalDebt: string
  }
  error?: string
}

class IPTUService {
  private baseUrl = 'https://api.infosimples.com/v1'
  private apiKey: string | null = null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.INFOSIMPLES_API_KEY || null
  }

  /**
   * Consulta débitos de IPTU pelo cadastro do imóvel
   */
  async consultIPTUDebt(propertyRegistration: string): Promise<IPTUResponse> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'API key da InfoSimples não configurada'
        }
      }

      if (!propertyRegistration || propertyRegistration.trim() === '') {
        return {
          success: false,
          error: 'Cadastro do imóvel não informado'
        }
      }

      // URL da API da InfoSimples para consulta de débitos de IPTU em São Paulo
      const url = `${this.baseUrl}/pref-sp-sao-paulo-debitos-iptu`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          cadastro_imovel: propertyRegistration.trim()
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('InfoSimples API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        
        return {
          success: false,
          error: `Erro na consulta: ${response.status} - ${response.statusText}`
        }
      }

      const data = await response.json()
      
      if (data.success === false) {
        return {
          success: false,
          error: data.message || 'Erro na consulta de débitos'
        }
      }

      // Processar dados retornados pela InfoSimples
      const processedData = this.processIPTUData(data)
      
      return {
        success: true,
        data: processedData
      }

    } catch (error) {
      console.error('Erro ao consultar IPTU:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na consulta'
      }
    }
  }

  /**
   * Processa os dados retornados pela InfoSimples
   */
  private processIPTUData(rawData: any) {
    // Esta função processa os dados conforme o formato retornado pela API
    // O formato exato pode variar, então seria necessário ajustar baseado na documentação real
    
    return {
      propertyAddress: rawData.endereco_imovel || 'Endereço não informado',
      taxNumber: rawData.numero_sql || rawData.cadastro_imovel || '',
      debts: rawData.debitos?.map((debt: any) => ({
        year: debt.ano_exercicio || debt.year || '',
        amount: debt.valor_total || debt.amount || '0,00',
        dueDate: debt.data_vencimento || debt.due_date || '',
        installments: debt.parcelas?.map((installment: any) => ({
          installment: installment.numero_parcela || installment.number || '',
          dueDate: installment.data_vencimento || installment.due_date || '',
          amount: installment.valor || installment.amount || '0,00',
          status: this.determinePaymentStatus(installment),
          paymentDate: installment.data_pagamento || installment.payment_date || undefined
        })) || [],
        totalAmount: debt.valor_total || '0,00',
        paidAmount: debt.valor_pago || '0,00',
        remainingAmount: debt.valor_pendente || debt.valor_total || '0,00'
      })) || [],
      totalDebt: rawData.valor_total_debito || rawData.total_debt || '0,00'
    }
  }

  /**
   * Determina o status do pagamento baseado nos dados da parcela
   */
  private determinePaymentStatus(installment: any): 'paid' | 'pending' | 'overdue' {
    if (installment.data_pagamento || installment.payment_date) {
      return 'paid'
    }
    
    const dueDate = new Date(installment.data_vencimento || installment.due_date)
    const today = new Date()
    
    if (dueDate < today) {
      return 'overdue'
    }
    
    return 'pending'
  }

  /**
   * Verifica se a API está configurada corretamente
   */
  isConfigured(): boolean {
    return this.apiKey !== null && this.apiKey.trim() !== ''
  }

  /**
   * Define a API key
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }
}

export default IPTUService
export type { IPTUResponse, IPTUDebt, IPTUInstallment }