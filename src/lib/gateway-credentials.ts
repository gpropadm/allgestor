import { prisma } from '@/lib/db'

export interface GatewayCredentials {
  gateway_preference: string
  pjbank_credencial: string
  pjbank_chave: string
  asaas_api_key: string
  asaas_environment: string
}

export async function getCompanyGatewayCredentials(companyId: string): Promise<GatewayCredentials | null> {
  try {
    console.log('🔐 Loading gateway credentials for company:', companyId)
    
    const settings = await prisma.settings.findMany({
      where: {
        companyId: companyId,
        category: 'gateway'
      }
    })
    
    if (settings.length === 0) {
      console.warn('⚠️ No gateway settings found for company:', companyId)
      return null
    }
    
    // Converter settings em objeto
    const credentials = settings.reduce((acc, setting) => {
      try {
        const value = JSON.parse(setting.value)
        acc[setting.key] = value
      } catch {
        acc[setting.key] = setting.value
      }
      return acc
    }, {} as any)
    
    // Validar se tem credenciais mínimas
    const hasValidCredentials = (
      (credentials.pjbank_credencial && credentials.pjbank_chave) ||
      credentials.asaas_api_key
    )
    
    if (!hasValidCredentials) {
      console.warn('⚠️ Invalid gateway credentials for company:', companyId)
      return null
    }
    
    console.log('✅ Gateway credentials loaded for company:', companyId)
    
    return {
      gateway_preference: credentials.gateway_preference || 'pjbank',
      pjbank_credencial: credentials.pjbank_credencial || '',
      pjbank_chave: credentials.pjbank_chave || '',
      asaas_api_key: credentials.asaas_api_key || '',
      asaas_environment: credentials.asaas_environment || 'sandbox'
    }
    
  } catch (error) {
    console.error('❌ Error loading gateway credentials:', error)
    return null
  }
}

export async function getPreferredGateway(companyId: string): Promise<'pjbank' | 'asaas' | null> {
  const credentials = await getCompanyGatewayCredentials(companyId)
  
  if (!credentials) {
    return null
  }
  
  // Se tem preferência configurada, usar ela
  if (credentials.gateway_preference) {
    return credentials.gateway_preference as 'pjbank' | 'asaas'
  }
  
  // Caso contrário, verificar qual tem credenciais válidas
  if (credentials.pjbank_credencial && credentials.pjbank_chave) {
    return 'pjbank'
  }
  
  if (credentials.asaas_api_key) {
    return 'asaas'
  }
  
  return null
}