// Gerador de arquivo TXT DIMOB para Receita Federal
// Baseado no layout oficial da DIMOB

import { NFSeData } from './xml-processor'

export interface ContractData {
  id: string
  propertyId: string
  tenantId: string
  ownerId: string
  startDate: string
  endDate: string
  rentAmount: number
  // Dados relacionados
  property: {
    address: string
    city: string
    state: string
    zipCode: string
    type: 'RESIDENTIAL' | 'COMMERCIAL'
  }
  tenant: {
    name: string
    document: string // CPF/CNPJ
    email: string
  }
  owner: {
    name: string
    document: string // CPF/CNPJ
    email: string
  }
}

export interface DimobRecord {
  month: string // YYYYMM
  contractId: string
  ownerDocument: string
  ownerName: string
  tenantDocument: string
  tenantName: string
  propertyAddress: string
  propertyCity: string
  propertyState: string
  propertyZipCode: string
  propertyType: '1' | '2' // 1=Residencial, 2=Comercial
  grossValue: number // Valor bruto do aluguel
  adminFee: number // Taxa de administração
  netValue: number // Valor líquido para o proprietário
  nfseNumber?: string
  nfseDate?: string
}

export class DimobGenerator {
  
  /**
   * Gera arquivo TXT DIMOB completo
   */
  static generateDimobTXT(
    companyData: {
      cnpj: string
      name: string
      year: number
    },
    records: DimobRecord[]
  ): string {
    try {
      const lines: string[] = []

      // Linha IMB - Identificação da imobiliária
      const imbLine = this.generateIMBRecord(companyData.cnpj, companyData.year)
      lines.push(imbLine)

      // Agrupa registros por propriedade
      const propertiesByOwner = this.groupRecordsByOwner(records)

      for (const [ownerDocument, ownerRecords] of propertiesByOwner) {
        // Linha IMO - Dados do imóvel/proprietário
        const imoLine = this.generateIMORecord(ownerRecords[0])
        lines.push(imoLine)

        // Linhas VEN - Operações de locação
        for (const record of ownerRecords) {
          const venLine = this.generateVENRecord(record)
          lines.push(venLine)
        }
      }

      return lines.join('\n')

    } catch (error) {
      console.error('Erro ao gerar DIMOB TXT:', error)
      throw new Error(`Erro ao gerar arquivo DIMOB: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Gera registro IMB - Identificação da imobiliária
   */
  private static generateIMBRecord(cnpj: string, year: number): string {
    const cleanCnpj = cnpj.replace(/\D/g, '') // Remove formatação
    return `IMB|${cleanCnpj}|${year}`
  }

  /**
   * Gera registro IMO - Dados do imóvel
   */
  private static generateIMORecord(record: DimobRecord): string {
    const cleanOwnerDoc = record.ownerDocument.replace(/\D/g, '')
    const ownerName = this.sanitizeText(record.ownerName, 60)
    const address = this.sanitizeText(record.propertyAddress, 120)
    const city = this.sanitizeText(record.propertyCity, 50)
    const state = record.propertyState.toUpperCase()
    const zipCode = record.propertyZipCode.replace(/\D/g, '')

    return `IMO|${cleanOwnerDoc}|${ownerName}|${address}||${city}|${state}|${zipCode}`
  }

  /**
   * Gera registro VEN - Operação de locação
   */
  private static generateVENRecord(record: DimobRecord): string {
    const cleanTenantDoc = record.tenantDocument.replace(/\D/g, '')
    const tenantName = this.sanitizeText(record.tenantName, 60)
    const grossValue = this.formatValue(record.grossValue)
    const competencia = record.month
    const adminFee = this.formatValue(record.adminFee)
    const netValue = this.formatValue(record.netValue)

    // Valores de tributos (normalmente zerados para pessoa física)
    const valorPis = '0.00'
    const valorCofins = '0.00'
    const valorInss = '0.00'
    const valorIr = '0.00'

    return `VEN|${cleanTenantDoc}|${tenantName}|${grossValue}|${competencia}|${valorPis}|${valorCofins}|${valorInss}|${valorIr}|${adminFee}|${netValue}`
  }

  /**
   * Agrupa records por proprietário
   */
  private static groupRecordsByOwner(records: DimobRecord[]): Map<string, DimobRecord[]> {
    const grouped = new Map<string, DimobRecord[]>()

    for (const record of records) {
      const key = record.ownerDocument
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(record)
    }

    return grouped
  }

  /**
   * Converte dados de contrato e NFS-e em registros DIMOB
   */
  static convertToRecords(
    contracts: ContractData[],
    nfseData: NFSeData[],
    adminFeePercentage: number = 10
  ): DimobRecord[] {
    const records: DimobRecord[] = []

    // Mapa de NFS-e por mês/contrato para facilitar lookup
    const nfseByMonth = new Map<string, NFSeData>()
    for (const nfse of nfseData) {
      const monthKey = this.extractMonthFromDate(nfse.competencia)
      nfseByMonth.set(monthKey, nfse)
    }

    for (const contract of contracts) {
      // Gera registros mensais para o contrato
      const monthlyRecords = this.generateMonthlyRecords(
        contract,
        adminFeePercentage,
        nfseByMonth
      )
      records.push(...monthlyRecords)
    }

    return records
  }

  /**
   * Gera registros mensais para um contrato
   */
  private static generateMonthlyRecords(
    contract: ContractData,
    adminFeePercentage: number,
    nfseByMonth: Map<string, NFSeData>
  ): DimobRecord[] {
    const records: DimobRecord[] = []
    
    const startDate = new Date(contract.startDate)
    const endDate = new Date(contract.endDate)
    const currentDate = new Date(startDate)

    while (currentDate <= endDate && currentDate <= new Date()) {
      const monthKey = this.formatMonth(currentDate)
      const nfse = nfseByMonth.get(monthKey)

      const grossValue = contract.rentAmount
      const adminFee = (grossValue * adminFeePercentage) / 100
      const netValue = grossValue - adminFee

      const record: DimobRecord = {
        month: monthKey,
        contractId: contract.id,
        ownerDocument: contract.owner.document,
        ownerName: contract.owner.name,
        tenantDocument: contract.tenant.document,
        tenantName: contract.tenant.name,
        propertyAddress: contract.property.address,
        propertyCity: contract.property.city,
        propertyState: contract.property.state,
        propertyZipCode: contract.property.zipCode,
        propertyType: contract.property.type === 'RESIDENTIAL' ? '1' : '2',
        grossValue,
        adminFee,
        netValue,
        nfseNumber: nfse?.numeroNota,
        nfseDate: nfse?.dataEmissao
      }

      records.push(record)

      // Próximo mês
      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    return records
  }

  /**
   * Helpers de formatação
   */
  private static formatValue(value: number): string {
    return value.toFixed(2).replace('.', ',')
  }

  private static formatMonth(date: Date): string {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${year}${month}`
  }

  private static extractMonthFromDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return this.formatMonth(date)
    } catch (error) {
      console.warn('Erro ao extrair mês da data:', dateString)
      return ''
    }
  }

  private static sanitizeText(text: string, maxLength: number): string {
    if (!text) return ''
    
    // Remove caracteres especiais que podem quebrar o formato
    const sanitized = text
      .replace(/[|]/g, ' ') // Remove pipes que são separadores
      .replace(/[\r\n]/g, ' ') // Remove quebras de linha
      .trim()

    return sanitized.substring(0, maxLength)
  }

  /**
   * Gera nome do arquivo DIMOB
   */
  static generateFileName(cnpj: string, year: number): string {
    const cleanCnpj = cnpj.replace(/\D/g, '')
    return `DIMOB_${cleanCnpj}_${year}.txt`
  }

  /**
   * Valida dados antes de gerar DIMOB
   */
  static validateData(
    companyData: { cnpj: string; name: string; year: number },
    records: DimobRecord[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validação da empresa
    if (!companyData.cnpj || companyData.cnpj.replace(/\D/g, '').length !== 14) {
      errors.push('CNPJ da empresa inválido')
    }

    if (!companyData.name || companyData.name.trim().length === 0) {
      errors.push('Nome da empresa é obrigatório')
    }

    if (companyData.year < 2000 || companyData.year > new Date().getFullYear()) {
      errors.push('Ano base inválido')
    }

    // Validação dos registros
    if (records.length === 0) {
      errors.push('Nenhum registro de locação encontrado')
    }

    for (const [index, record] of records.entries()) {
      if (!record.ownerDocument || record.ownerDocument.replace(/\D/g, '').length < 11) {
        errors.push(`Registro ${index + 1}: Documento do proprietário inválido`)
      }

      if (!record.tenantDocument || record.tenantDocument.replace(/\D/g, '').length < 11) {
        errors.push(`Registro ${index + 1}: Documento do inquilino inválido`)
      }

      if (record.grossValue <= 0) {
        errors.push(`Registro ${index + 1}: Valor do aluguel inválido`)
      }

      if (!record.propertyAddress || record.propertyAddress.trim().length === 0) {
        errors.push(`Registro ${index + 1}: Endereço do imóvel é obrigatório`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Gera relatório de resumo dos dados
   */
  static generateSummary(records: DimobRecord[]): {
    totalProperties: number
    totalTenants: number
    totalOwners: number
    totalGrossValue: number
    totalAdminFee: number
    totalNetValue: number
    monthsCount: number
    recordsCount: number
  } {
    const uniqueProperties = new Set(records.map(r => r.propertyAddress))
    const uniqueTenants = new Set(records.map(r => r.tenantDocument))
    const uniqueOwners = new Set(records.map(r => r.ownerDocument))
    const uniqueMonths = new Set(records.map(r => r.month))

    const totals = records.reduce((acc, record) => ({
      grossValue: acc.grossValue + record.grossValue,
      adminFee: acc.adminFee + record.adminFee,
      netValue: acc.netValue + record.netValue
    }), { grossValue: 0, adminFee: 0, netValue: 0 })

    return {
      totalProperties: uniqueProperties.size,
      totalTenants: uniqueTenants.size,
      totalOwners: uniqueOwners.size,
      totalGrossValue: totals.grossValue,
      totalAdminFee: totals.adminFee,
      totalNetValue: totals.netValue,
      monthsCount: uniqueMonths.size,
      recordsCount: records.length
    }
  }
}