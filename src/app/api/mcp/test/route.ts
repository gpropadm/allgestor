import { NextRequest, NextResponse } from 'next/server'
import { crmMCP } from '@/lib/mcp-server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
    }

    // Usar um userId fixo para teste (admin user)
    const testUserId = 'cmdusefap0002uc3tnmol495a'

    // Se a mensagem menciona "leads" e "matches", buscar leads e matches
    if (message.toLowerCase().includes('lead') && message.toLowerCase().includes('match')) {
      const leads = await crmMCP.getLeads({ userId: testUserId })
      
      if (leads.success && leads.data.length > 0) {
        const leadMatches = []
        
        for (const lead of leads.data) {
          const matches = await crmMCP.findPropertyMatches(lead.id)
          if (matches.success && matches.data.length > 0) {
            leadMatches.push({
              lead: lead,
              matches: matches.data
            })
          }
        }

        return NextResponse.json({ 
          response: `Encontrei ${leadMatches.length} leads com matches disponíveis`,
          data: leadMatches,
          success: true
        })
      }
    }

    // Resposta genérica para outros casos
    const properties = await crmMCP.getProperties({ userId: testUserId })
    
    return NextResponse.json({ 
      response: `Sistema MCP funcionando! Encontrei ${properties.data?.length || 0} propriedades.`,
      data: properties.data,
      success: true
    })

  } catch (error) {
    console.error('Erro na API MCP Test:', error)
    
    return NextResponse.json({ 
      error: 'Erro ao processar mensagem. Tente novamente.',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Endpoint de teste MCP ativo',
    status: 'OK'
  })
}