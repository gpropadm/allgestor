import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Buscar configurações de gateway de uma empresa
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const companyId = params.companyId
    
    console.log('🔍 Loading gateway settings for company:', companyId)
    
    // TODO: Adicionar verificação de permissão admin
    
    const settings = await prisma.settings.findMany({
      where: {
        companyId: companyId,
        category: 'gateway'
      }
    })
    
    if (settings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No gateway settings found',
        settings: null
      })
    }
    
    // Converter settings em objeto
    const gatewayConfig = settings.reduce((acc, setting) => {
      try {
        const value = JSON.parse(setting.value)
        acc[setting.key] = value
      } catch {
        acc[setting.key] = setting.value
      }
      return acc
    }, {} as any)
    
    console.log('✅ Gateway settings loaded for company:', companyId)
    
    return NextResponse.json({
      success: true,
      settings: gatewayConfig
    })
    
  } catch (error) {
    console.error('❌ Error loading gateway settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to load gateway settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Salvar configurações de gateway de uma empresa
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const companyId = params.companyId
    const data = await request.json()
    
    console.log('💾 Saving gateway settings for company:', companyId)
    
    // TODO: Adicionar verificação de permissão admin
    
    // Verificar se a empresa existe
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })
    
    if (!company) {
      return NextResponse.json({
        success: false,
        error: 'Company not found'
      }, { status: 404 })
    }
    
    // Preparar dados para salvar
    const settingsToSave = [
      {
        key: 'gateway_preference',
        value: JSON.stringify(data.gateway_preference || 'pjbank'),
        category: 'gateway'
      },
      {
        key: 'pjbank_credencial',
        value: JSON.stringify(data.pjbank_credencial || ''),
        category: 'gateway'
      },
      {
        key: 'pjbank_chave',
        value: JSON.stringify(data.pjbank_chave || ''),
        category: 'gateway'
      },
      {
        key: 'asaas_api_key',
        value: JSON.stringify(data.asaas_api_key || ''),
        category: 'gateway'
      },
      {
        key: 'asaas_environment',
        value: JSON.stringify(data.asaas_environment || 'sandbox'),
        category: 'gateway'
      },
      {
        key: 'asaas_wallet_id',
        value: JSON.stringify(data.asaas_wallet_id || ''),
        category: 'gateway'
      }
    ]
    
    // Salvar cada configuração
    for (const setting of settingsToSave) {
      await prisma.settings.upsert({
        where: {
          companyId_key: {
            companyId: companyId,
            key: setting.key
          }
        },
        update: {
          value: setting.value,
          updatedAt: new Date()
        },
        create: {
          companyId: companyId,
          key: setting.key,
          value: setting.value,
          category: setting.category
        }
      })
    }
    
    console.log('✅ Gateway settings saved for company:', companyId)
    
    return NextResponse.json({
      success: true,
      message: 'Gateway settings saved successfully'
    })
    
  } catch (error) {
    console.error('❌ Error saving gateway settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save gateway settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Remover configurações de gateway de uma empresa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const companyId = params.companyId
    
    console.log('🗑️ Removing gateway settings for company:', companyId)
    
    // TODO: Adicionar verificação de permissão admin
    
    await prisma.settings.deleteMany({
      where: {
        companyId: companyId,
        category: 'gateway'
      }
    })
    
    console.log('✅ Gateway settings removed for company:', companyId)
    
    return NextResponse.json({
      success: true,
      message: 'Gateway settings removed successfully'
    })
    
  } catch (error) {
    console.error('❌ Error removing gateway settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to remove gateway settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}