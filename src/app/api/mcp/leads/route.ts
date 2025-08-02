import { NextRequest, NextResponse } from 'next/server'
import { crmMCP } from '@/lib/mcp-server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      status: searchParams.get('status') || undefined,
      budget: {
        min: searchParams.get('budgetMin') ? Number(searchParams.get('budgetMin')) : undefined,
        max: searchParams.get('budgetMax') ? Number(searchParams.get('budgetMax')) : undefined
      },
      location: searchParams.get('location') || undefined,
      userId: session.user.id
    }

    const result = await crmMCP.getLeads(filters)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Erro na API MCP Leads:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { action, leadId } = await request.json()

    switch (action) {
      case 'find-matches':
        if (!leadId) {
          return NextResponse.json({ error: 'Lead ID é obrigatório' }, { status: 400 })
        }
        
        const matches = await crmMCP.findPropertyMatches(leadId)
        return NextResponse.json(matches)

      default:
        return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro na API MCP Leads POST:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}