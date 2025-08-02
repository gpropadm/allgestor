import { NextRequest, NextResponse } from 'next/server'
import { crmMCP } from '@/lib/mcp-server'

export async function GET() {
  try {
    // Usar um userId fixo para teste (admin user)
    const testUserId = 'cmdusefap0002uc3tnmol495a'

    // Buscar todos os leads
    const leadsResult = await crmMCP.getLeads({ userId: testUserId })
    
    if (!leadsResult.success) {
      return NextResponse.json({ 
        error: 'Erro ao buscar leads',
        details: leadsResult.error
      }, { status: 500 })
    }

    const leads = leadsResult.data
    const leadMatches = []
    
    // Para cada lead, buscar matches
    for (const lead of leads) {
      try {
        const matchesResult = await crmMCP.findPropertyMatches(lead.id)
        
        if (matchesResult.success && matchesResult.data.length > 0) {
          leadMatches.push({
            lead: {
              id: lead.id,
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              propertyType: lead.propertyType,
              maxPrice: lead.maxPrice,
              minBedrooms: lead.minBedrooms,
              maxBedrooms: lead.maxBedrooms,
              preferredCities: lead.preferredCities,
              status: lead.status
            },
            matches: matchesResult.data.map(match => ({
              id: match.id,
              title: match.title,
              rentPrice: match.rentPrice,
              bedrooms: match.bedrooms,
              bathrooms: match.bathrooms,
              area: match.area,
              city: match.city,
              propertyType: match.propertyType,
              status: match.status
            }))
          })
        }
      } catch (matchError) {
        console.error(`Erro ao buscar matches para lead ${lead.id}:`, matchError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Encontrados ${leadMatches.length} leads com matches de ${leads.length} leads totais`,
      data: {
        totalLeads: leads.length,
        leadsWithMatches: leadMatches.length,
        matches: leadMatches
      }
    })

  } catch (error) {
    console.error('Erro na API de Lead Matches:', error)
    
    return NextResponse.json({ 
      error: 'Erro ao processar lead matches',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}