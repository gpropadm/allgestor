import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCompanyGatewayCredentials } from '@/lib/gateway-credentials'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    console.log('🔍 Checking gateway status for company:', session.user.companyId)
    
    const credentials = await getCompanyGatewayCredentials(session.user.companyId)
    
    if (!credentials) {
      return NextResponse.json({
        success: true,
        status: {
          configured: false,
          gateway: null,
          environment: null,
          isActive: false
        }
      })
    }
    
    // Determinar qual gateway está configurado
    let activeGateway = null
    let environment = null
    
    if (credentials.gateway_preference === 'pjbank' && credentials.pjbank_credencial && credentials.pjbank_chave) {
      activeGateway = 'pjbank'
      environment = 'produção'
    } else if (credentials.gateway_preference === 'asaas' && credentials.asaas_api_key) {
      activeGateway = 'asaas'
      environment = credentials.asaas_environment
    }
    
    return NextResponse.json({
      success: true,
      status: {
        configured: activeGateway !== null,
        gateway: activeGateway,
        environment: environment,
        isActive: activeGateway !== null
      }
    })
    
  } catch (error) {
    console.error('❌ Error checking gateway status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check gateway status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}