/**
 * Validações críticas para geração de DIMOB
 * Baseado no padrão SuperLógica e especificações da Receita Federal
 */

export interface ValidationError {
  type: 'error' | 'warning'
  message: string
  field?: string
  entity?: string
  entityId?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

/**
 * Valida CPF (formato e dígitos verificadores)
 */
function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/[^\d]/g, '')
  
  if (cleanCPF.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Validar dígitos verificadores
  const digits = cleanCPF.split('').map(Number)
  
  // Primeiro dígito
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i)
  }
  const firstCheck = ((sum * 10) % 11) % 10
  
  if (digits[9] !== firstCheck) return false
  
  // Segundo dígito
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i)
  }
  const secondCheck = ((sum * 10) % 11) % 10
  
  return digits[10] === secondCheck
}

/**
 * Valida CNPJ (formato e dígitos verificadores)
 */
function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '')
  
  if (cleanCNPJ.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false
  
  const digits = cleanCNPJ.split('').map(Number)
  
  // Primeiro dígito
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * weights1[i]
  }
  const firstCheck = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  
  if (digits[12] !== firstCheck) return false
  
  // Segundo dígito
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += digits[i] * weights2[i]
  }
  const secondCheck = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  
  return digits[13] === secondCheck
}

/**
 * Valida se endereço está completo para DIMOB
 */
function validateAddress(address: string, entityName: string, entityId: string): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!address || address.trim().length < 10) {
    errors.push({
      type: 'error',
      message: `Endereço muito curto ou vazio. DIMOB exige endereço completo com rua, número, bairro e cidade.`,
      field: 'address',
      entity: entityName,
      entityId
    })
  }
  
  // Verificar se tem elementos básicos de um endereço
  const hasNumber = /\d/.test(address)
  const hasComma = address.includes(',')
  
  if (!hasNumber || !hasComma) {
    errors.push({
      type: 'warning',
      message: `Endereço pode estar incompleto. Recomenda-se formato: "Rua/Av Nome, Número, Bairro, Cidade"`,
      field: 'address',
      entity: entityName,
      entityId
    })
  }
  
  return errors
}

/**
 * Valida dados de proprietário para DIMOB
 */
function validateOwner(owner: any): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!owner.name || owner.name.trim().length < 3) {
    errors.push({
      type: 'error',
      message: 'Nome do proprietário obrigatório (mínimo 3 caracteres)',
      field: 'name',
      entity: 'Proprietário',
      entityId: owner.id
    })
  }
  
  if (!owner.document) {
    errors.push({
      type: 'error',
      message: 'CPF/CNPJ do proprietário obrigatório para DIMOB',
      field: 'document',
      entity: 'Proprietário',
      entityId: owner.id
    })
  } else {
    const cleanDoc = owner.document.replace(/[^\d]/g, '')
    
    if (cleanDoc.length === 11) {
      if (!isValidCPF(owner.document)) {
        errors.push({
          type: 'error',
          message: 'CPF do proprietário inválido',
          field: 'document',
          entity: 'Proprietário',
          entityId: owner.id
        })
      }
    } else if (cleanDoc.length === 14) {
      if (!isValidCNPJ(owner.document)) {
        errors.push({
          type: 'error',
          message: 'CNPJ do proprietário inválido',
          field: 'document',
          entity: 'Proprietário',
          entityId: owner.id
        })
      }
    } else {
      errors.push({
        type: 'error',
        message: 'Documento do proprietário deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)',
        field: 'document',
        entity: 'Proprietário',
        entityId: owner.id
      })
    }
  }
  
  if (!owner.email) {
    errors.push({
      type: 'warning',
      message: 'Email do proprietário recomendado para controle interno',
      field: 'email',
      entity: 'Proprietário',
      entityId: owner.id
    })
  }
  
  return errors
}

/**
 * Valida dados de inquilino para DIMOB
 */
function validateTenant(tenant: any): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!tenant.name || tenant.name.trim().length < 3) {
    errors.push({
      type: 'error',
      message: 'Nome do inquilino obrigatório (mínimo 3 caracteres)',
      field: 'name',
      entity: 'Inquilino',
      entityId: tenant.id
    })
  }
  
  if (!tenant.document) {
    errors.push({
      type: 'error',
      message: 'CPF/CNPJ do inquilino obrigatório para DIMOB',
      field: 'document',
      entity: 'Inquilino',
      entityId: tenant.id
    })
  } else {
    const cleanDoc = tenant.document.replace(/[^\d]/g, '')
    
    if (cleanDoc.length === 11) {
      if (!isValidCPF(tenant.document)) {
        errors.push({
          type: 'error',
          message: 'CPF do inquilino inválido',
          field: 'document',
          entity: 'Inquilino',
          entityId: tenant.id
        })
      }
    } else if (cleanDoc.length === 14) {
      if (!isValidCNPJ(tenant.document)) {
        errors.push({
          type: 'error',
          message: 'CNPJ do inquilino inválido',
          field: 'document',
          entity: 'Inquilino',
          entityId: tenant.id
        })
      }
    } else {
      errors.push({
        type: 'error',
        message: 'Documento do inquilino deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)',
        field: 'document',
        entity: 'Inquilino',
        entityId: tenant.id
      })
    }
  }
  
  return errors
}

/**
 * Valida dados de propriedade para DIMOB
 */
function validateProperty(property: any): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!property.address) {
    errors.push({
      type: 'error',
      message: 'Endereço da propriedade obrigatório para DIMOB',
      field: 'address',
      entity: 'Propriedade',
      entityId: property.id
    })
  } else {
    errors.push(...validateAddress(property.address, 'Propriedade', property.id))
  }
  
  return errors
}

/**
 * Valida dados de contrato para DIMOB
 */
function validateContract(contract: any): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Verificar se contrato está marcado para inclusão no DIMOB
  if (contract.includeInDimob === false) {
    return [] // Contrato excluído do DIMOB, não validar
  }
  
  if (!contract.rentAmount || contract.rentAmount <= 0) {
    errors.push({
      type: 'error',
      message: 'Valor do aluguel deve ser maior que zero',
      field: 'rentAmount',
      entity: 'Contrato',
      entityId: contract.id
    })
  }
  
  if (contract.administrationFeePercentage && contract.administrationFeePercentage < 0) {
    errors.push({
      type: 'error',
      message: 'Taxa de administração não pode ser negativa',
      field: 'administrationFeePercentage',
      entity: 'Contrato',
      entityId: contract.id
    })
  }
  
  if (!contract.startDate) {
    errors.push({
      type: 'error',
      message: 'Data de início do contrato obrigatória',
      field: 'startDate',
      entity: 'Contrato',
      entityId: contract.id
    })
  }
  
  if (!contract.endDate) {
    errors.push({
      type: 'error',
      message: 'Data de fim do contrato obrigatória',
      field: 'endDate',
      entity: 'Contrato',
      entityId: contract.id
    })
  }
  
  // Validar entidades relacionadas
  if (contract.property) {
    errors.push(...validateProperty(contract.property))
    
    if (contract.property.owner) {
      errors.push(...validateOwner(contract.property.owner))
    } else {
      errors.push({
        type: 'error',
        message: 'Proprietário não encontrado para o contrato',
        field: 'owner',
        entity: 'Contrato',
        entityId: contract.id
      })
    }
  } else {
    errors.push({
      type: 'error',
      message: 'Propriedade não encontrada para o contrato',
      field: 'property',
      entity: 'Contrato',
      entityId: contract.id
    })
  }
  
  if (contract.tenant) {
    errors.push(...validateTenant(contract.tenant))
  } else {
    errors.push({
      type: 'error',
      message: 'Inquilino não encontrado para o contrato',
      field: 'tenant',
      entity: 'Contrato',
      entityId: contract.id
    })
  }
  
  return errors
}

/**
 * Valida pagamentos de um contrato
 */
function validatePayments(payments: any[], contractId: string): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!payments || payments.length === 0) {
    errors.push({
      type: 'warning',
      message: 'Contrato sem pagamentos registrados. Não será incluído no DIMOB.',
      entity: 'Contrato',
      entityId: contractId
    })
    return errors
  }
  
  payments.forEach((payment, index) => {
    if (!payment.amount || payment.amount <= 0) {
      errors.push({
        type: 'error',
        message: `Pagamento #${index + 1} com valor inválido (deve ser maior que zero)`,
        field: 'amount',
        entity: 'Pagamento',
        entityId: payment.id
      })
    }
    
    if (!payment.dueDate) {
      errors.push({
        type: 'error',
        message: `Pagamento #${index + 1} sem data de vencimento`,
        field: 'dueDate',
        entity: 'Pagamento',
        entityId: payment.id
      })
    }
    
    if (!payment.type || !['RENT', 'ADMINISTRATION_FEE', 'OTHER'].includes(payment.type)) {
      errors.push({
        type: 'warning',
        message: `Pagamento #${index + 1} com tipo indefinido ou inválido`,
        field: 'type',
        entity: 'Pagamento',
        entityId: payment.id
      })
    }
  })
  
  return errors
}

/**
 * Valida configurações da empresa para DIMOB
 */
function validateCompanySettings(settings: any): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!settings.responsibleCpf) {
    errors.push({
      type: 'error',
      message: 'CPF do responsável pela DIMOB obrigatório nas configurações da empresa',
      field: 'responsibleCpf',
      entity: 'Empresa'
    })
  } else if (!isValidCPF(settings.responsibleCpf)) {
    errors.push({
      type: 'error',
      message: 'CPF do responsável pela DIMOB inválido',
      field: 'responsibleCpf',
      entity: 'Empresa'
    })
  }
  
  if (!settings.municipalityCode) {
    errors.push({
      type: 'error',
      message: 'Código do município obrigatório nas configurações da empresa',
      field: 'municipalityCode',
      entity: 'Empresa'
    })
  } else if (!/^\d{7}$/.test(settings.municipalityCode)) {
    errors.push({
      type: 'error',
      message: 'Código do município deve ter exatamente 7 dígitos',
      field: 'municipalityCode',
      entity: 'Empresa'
    })
  }
  
  if (!settings.name || settings.name.trim().length < 3) {
    errors.push({
      type: 'error',
      message: 'Nome da empresa obrigatório (mínimo 3 caracteres)',
      field: 'name',
      entity: 'Empresa'
    })
  }
  
  return errors
}

/**
 * Função principal de validação para DIMOB
 */
export function validateDimobData(
  contracts: any[],
  companySettings: any
): ValidationResult {
  const allErrors: ValidationError[] = []
  const allWarnings: ValidationError[] = []
  
  // Validar configurações da empresa
  const companyValidation = validateCompanySettings(companySettings)
  companyValidation.forEach(error => {
    if (error.type === 'error') {
      allErrors.push(error)
    } else {
      allWarnings.push(error)
    }
  })
  
  // Validar cada contrato e seus relacionamentos
  contracts.forEach(contract => {
    const contractValidation = validateContract(contract)
    contractValidation.forEach(error => {
      if (error.type === 'error') {
        allErrors.push(error)
      } else {
        allWarnings.push(error)
      }
    })
    
    // Validar pagamentos do contrato
    if (contract.payments) {
      const paymentValidation = validatePayments(contract.payments, contract.id)
      paymentValidation.forEach(error => {
        if (error.type === 'error') {
          allErrors.push(error)
        } else {
          allWarnings.push(error)
        }
      })
    }
  })
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  }
}

/**
 * Formatar resultado de validação para exibição
 */
export function formatValidationMessage(result: ValidationResult): string {
  let message = ''
  
  if (!result.isValid) {
    message += '❌ ERROS CRÍTICOS encontrados:\n\n'
    result.errors.forEach((error, index) => {
      message += `${index + 1}. ${error.message}`
      if (error.entity && error.field) {
        message += ` (${error.entity}${error.entityId ? ` - ${error.entityId}` : ''})`
      }
      message += '\n'
    })
  }
  
  if (result.warnings.length > 0) {
    if (message) message += '\n'
    message += '⚠️ AVISOS:\n\n'
    result.warnings.forEach((warning, index) => {
      message += `${index + 1}. ${warning.message}`
      if (warning.entity && warning.field) {
        message += ` (${warning.entity}${warning.entityId ? ` - ${warning.entityId}` : ''})`
      }
      message += '\n'
    })
  }
  
  if (result.isValid && result.warnings.length === 0) {
    message = '✅ Todos os dados estão válidos para geração do DIMOB!'
  }
  
  return message
}