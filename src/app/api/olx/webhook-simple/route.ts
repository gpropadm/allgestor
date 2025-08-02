import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Webhook simples para receber leads da OLX
 * URL: https://app.gprop.com.br/api/olx/webhook-simple
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    console.log('📨 Webhook OLX recebido:', JSON.stringify(data, null, 2))

    // Buscar primeira empresa e usuário disponíveis
    const company = await prisma.company.findFirst()
    const user = await prisma.user.findFirst()

    if (!company || !user) {
      console.log('❌ Empresa ou usuário não encontrados')
      return NextResponse.json(
        { error: 'Sistema não configurado corretamente' },
        { status: 500 }
      )
    }

    // Extrair dados do formato real da OLX
    const leadId = data.originLeadId || 'unknown'
    const listingId = data.clientListingId || data.originListingId || 'unknown'
    const temperature = data.temperature || 'Média'
    const transactionType = data.transactionType === 'SELL' ? 'BUY' : 'RENT'
    
    // Criar lead com dados da OLX
    const newLead = await prisma.lead.create({
      data: {
        name: `Lead OLX #${leadId.slice(-6)}`,
        email: `lead.${leadId.slice(-6)}@olx.temp`,
        phone: '(61)99999-0000',
        interest: transactionType,
        propertyType: 'APARTMENT',
        maxPrice: transactionType === 'BUY' ? 500000 : 2000,
        preferredCities: '["Brasília"]',
        preferredStates: '["DF"]',
        companyId: company.id,
        userId: user.id,
        notes: `🔗 Lead OLX via integração
📊 Temperatura: ${temperature}
🏠 Imóvel: ${listingId}
🆔 Lead ID: ${leadId}
🕒 ${new Date().toLocaleString('pt-BR')}

⚠️ Dados do cliente protegidos por LGPD - consulte na OLX`,
        status: 'ACTIVE'
      }
    })

    console.log('✅ Lead OLX criado:', newLead.id)

    return NextResponse.json({
      success: true,
      leadId: newLead.id,
      message: 'Lead OLX criado com sucesso'
    })

  } catch (error) {
    console.error('💥 Erro no webhook OLX simples:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

/**
 * GET para testar se o endpoint está funcionando
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'OLX Webhook Simple',
    endpoint: '/api/olx/webhook-simple',
    url: 'https://app.gprop.com.br/api/olx/webhook-simple'
  })
}