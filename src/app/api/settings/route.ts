import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthWithCompany } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthWithCompany(request)
    
    // Buscar a empresa do usuário logado
    const company = await prisma.company.findUnique({
      where: { id: user.companyId }
    })
    
    if (!company) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    // Buscar configurações salvas no banco
    const savedSettings = await prisma.settings.findMany({
      where: {
        companyId: company.id
      }
    })
    
    // Converter configurações salvas em objeto
    const settingsMap: Record<string, any> = {}
    savedSettings.forEach(setting => {
      try {
        settingsMap[setting.key] = JSON.parse(setting.value)
      } catch (error) {
        console.warn(`Failed to parse setting ${setting.key}:`, error)
      }
    })
    
    // Configurações com valores padrão e valores salvos
    const settings = {
      company: {
        name: company.name,
        tradeName: company.tradeName,
        document: company.document,
        email: company.email,
        phone: company.phone,
        address: company.address,
        city: company.city,
        state: company.state,
        zipCode: company.zipCode,
        logo: company.logo,
        website: company.website
        // Campos DIMOB - completamente removidos até migration
        // responsibleCpf: '',
        // municipalityCode: ''
      },
      system: settingsMap.system || {
        theme: 'light',
        language: 'pt',
        dateFormat: 'DD/MM/YYYY',
        currency: 'BRL',
        timezone: 'America/Sao_Paulo'
      },
      notifications: settingsMap.notifications || {
        emailEnabled: true,
        whatsappEnabled: true,
        contractExpiring: true,
        paymentDue: true,
        paymentOverdue: true,
        daysBefore: 5
      },
      financial: settingsMap.financial || {
        // Configurações de Multa e Juros para Atrasos
        penaltyRate: 2.0,          // 2% de multa
        dailyInterestRate: 0.033,  // 0.033% ao dia (1% ao mês)
        gracePeriodDays: 0,        // sem carência
        maxInterestDays: 365       // máximo 1 ano de juros
      },
      payment: settingsMap.payment || {
        pixKey: '',
        pixInstructions: 'Faça o PIX para a chave acima e envie o comprovante.',
        bankName: '',
        accountHolder: ''
      },
      api: settingsMap.api || {
        infosimplesApiKey: ''
      }
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthWithCompany(request)
    const data = await request.json()
    console.log('=== SETTINGS POST REQUEST ===')
    console.log('User ID:', user.id)
    console.log('Company ID:', user.companyId)
    console.log('Received data:', JSON.stringify(data, null, 2))
    
    // Buscar a empresa do usuário logado
    const company = await prisma.company.findUnique({
      where: { id: user.companyId }
    })
    
    if (!company) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar dados da empresa
    if (data.company) {
      console.log('Updating company data:', data.company)
      const updatedCompany = await prisma.company.update({
        where: { id: company.id },
        data: {
          name: data.company.name,
          tradeName: data.company.tradeName,
          document: data.company.document,
          email: data.company.email,
          phone: data.company.phone,
          address: data.company.address,
          city: data.company.city,
          state: data.company.state,
          zipCode: data.company.zipCode,
          logo: data.company.logo,
          website: data.company.website,
          // Campos DIMOB - desabilitados até migration ser executada
          // ...(data.company.responsibleCpf !== undefined && { responsibleCpf: data.company.responsibleCpf }),
          // ...(data.company.municipalityCode !== undefined && { municipalityCode: data.company.municipalityCode })
        }
      })
      console.log('Company updated successfully:', updatedCompany.name)
    }

    // Salvar outras configurações na tabela settings
    try {
      if (data.system) {
        await prisma.settings.upsert({
          where: {
            companyId_key: {
              companyId: company.id,
              key: 'system'
            }
          },
          update: {
            value: JSON.stringify(data.system),
            updatedAt: new Date()
          },
          create: {
            companyId: company.id,
            key: 'system',
            value: JSON.stringify(data.system),
            category: 'system'
          }
        })
      }
      
      if (data.notifications) {
        await prisma.settings.upsert({
          where: {
            companyId_key: {
              companyId: company.id,
              key: 'notifications'
            }
          },
          update: {
            value: JSON.stringify(data.notifications),
            updatedAt: new Date()
          },
          create: {
            companyId: company.id,
            key: 'notifications',
            value: JSON.stringify(data.notifications),
            category: 'notifications'
          }
        })
      }
      
      if (data.financial) {
        console.log('Processing financial data:', data.financial)
        // Validar e limpar dados financeiros
        const cleanFinancial = {
          // Configurações de Multa e Juros para Atrasos
          penaltyRate: isNaN(data.financial.penaltyRate) ? 2.0 : Number(data.financial.penaltyRate),
          dailyInterestRate: isNaN(data.financial.dailyInterestRate) ? 0.033 : Number(data.financial.dailyInterestRate),
          gracePeriodDays: isNaN(data.financial.gracePeriodDays) ? 0 : Number(data.financial.gracePeriodDays),
          maxInterestDays: isNaN(data.financial.maxInterestDays) ? 365 : Number(data.financial.maxInterestDays)
        }
        
        console.log('Cleaned financial data:', cleanFinancial)
        const financialData = JSON.stringify(cleanFinancial)
        console.log('Financial data JSON string:', financialData)
        
        await prisma.settings.upsert({
          where: {
            companyId_key: {
              companyId: company.id,
              key: 'financial'
            }
          },
          update: {
            value: financialData,
            updatedAt: new Date()
          },
          create: {
            companyId: company.id,
            key: 'financial',
            value: financialData,
            category: 'financial'
          }
        })
        console.log('Financial settings saved to database')
      }
      
      if (data.payment) {
        await prisma.settings.upsert({
          where: {
            companyId_key: {
              companyId: company.id,
              key: 'payment'
            }
          },
          update: {
            value: JSON.stringify(data.payment),
            updatedAt: new Date()
          },
          create: {
            companyId: company.id,
            key: 'payment',
            value: JSON.stringify(data.payment),
            category: 'payment'
          }
        })
        console.log('Payment settings saved to database')
      }
      
      if (data.api) {
        await prisma.settings.upsert({
          where: {
            companyId_key: {
              companyId: company.id,
              key: 'api'
            }
          },
          update: {
            value: JSON.stringify(data.api),
            updatedAt: new Date()
          },
          create: {
            companyId: company.id,
            key: 'api',
            value: JSON.stringify(data.api),
            category: 'api'
          }
        })
        console.log('API settings saved to database')
      }
    } catch (settingsError) {
      console.error('Error saving settings to database:', settingsError)
      // Continue mesmo se houver erro na configuração adicional
    }
    
    console.log('=== SETTINGS SAVE COMPLETE ===')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Configurações salvas com sucesso' 
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error name'
    })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Retornar erro mais detalhado
    return NextResponse.json(
      { 
        error: 'Erro ao salvar configurações',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}