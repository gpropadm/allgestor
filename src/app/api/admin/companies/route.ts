import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🏢 Loading companies for admin...')
    
    // TODO: Adicionar verificação de permissão admin
    
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        tradeName: true,
        document: true,
        email: true,
        subscription: true,
        active: true,
        createdAt: true,
        settings: {
          where: {
            category: 'gateway'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    // Enriquecer com status de configuração do gateway
    const companiesWithGateway = companies.map(company => ({
      ...company,
      gatewaySettings: company.settings.length > 0 ? company.settings.reduce((acc, setting) => {
        try {
          const value = JSON.parse(setting.value)
          acc[setting.key] = value
          return acc
        } catch {
          acc[setting.key] = setting.value
          return acc
        }
      }, {} as any) : null
    }))
    
    console.log('✅ Companies loaded:', companiesWithGateway.length)
    
    return NextResponse.json({
      success: true,
      companies: companiesWithGateway
    })
    
  } catch (error) {
    console.error('❌ Error loading companies:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to load companies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}