import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.companyId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { action, ...data } = await request.json()

    switch (action) {
      case 'load':
        return await loadPipeline(session.user.companyId)
      
      case 'move':
        return await moveOpportunity(data, session.user.companyId)
      
      case 'create':
        return await createOpportunity(data, session.user.companyId, session.user.id)
      
      case 'update':
        return await updateOpportunity(data, session.user.companyId)
      
      case 'delete':
        return await deleteOpportunity(data, session.user.companyId)
      
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro na API sales-pipeline:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

async function loadPipeline(companyId: string) {
  try {
    // Primeiro, verificar se existem estágios padrão
    let stages = await prisma.salesStage.findMany({
      where: { companyId, active: true },
      orderBy: { stageOrder: 'asc' },
      include: {
        opportunities: {
          include: {
            // Aqui incluiríamos dados do lead e propriedade se necessário
          }
        }
      }
    })

    // Se não existirem estágios, criar os padrão
    if (stages.length === 0) {
      await createDefaultStages(companyId)
      stages = await prisma.salesStage.findMany({
        where: { companyId, active: true },
        orderBy: { stageOrder: 'asc' },
        include: {
          opportunities: true
        }
      })
    }

    // Buscar dados dos leads para cada oportunidade
    const enrichedStages = await Promise.all(
      stages.map(async (stage) => {
        const enrichedOpportunities = await Promise.all(
          stage.opportunities.map(async (opp) => {
            // Buscar dados do lead
            const lead = await prisma.lead.findUnique({
              where: { id: opp.leadId }
            })

            // Buscar dados da propriedade se existir
            let property = null
            if (opp.propertyId) {
              property = await prisma.property.findUnique({
                where: { id: opp.propertyId }
              })
            }

            return {
              id: opp.id,
              leadName: lead?.name || 'Lead não encontrado',
              leadId: opp.leadId,
              propertyId: opp.propertyId,
              propertyTitle: property?.title,
              value: opp.value,
              probability: opp.probability,
              expectedCloseDate: opp.expectedCloseDate?.toISOString(),
              notes: opp.notes
            }
          })
        )

        return {
          id: stage.id,
          name: stage.name,
          color: stage.color,
          stageOrder: stage.stageOrder,
          opportunities: enrichedOpportunities
        }
      })
    )

    return NextResponse.json({ success: true, stages: enrichedStages })
  } catch (error) {
    console.error('Erro ao carregar pipeline:', error)
    return NextResponse.json({ error: 'Erro ao carregar pipeline' }, { status: 500 })
  }
}

async function createDefaultStages(companyId: string) {
  const defaultStages = [
    { name: 'Qualificação', color: '#EF4444', stageOrder: 1 },
    { name: 'Interesse Confirmado', color: '#F59E0B', stageOrder: 2 },
    { name: 'Visita Agendada', color: '#3B82F6', stageOrder: 3 },
    { name: 'Proposta Enviada', color: '#8B5CF6', stageOrder: 4 },
    { name: 'Negociação', color: '#EC4899', stageOrder: 5 },
    { name: 'Fechamento', color: '#10B981', stageOrder: 6 }
  ]

  await prisma.salesStage.createMany({
    data: defaultStages.map(stage => ({
      ...stage,
      companyId
    }))
  })
}

async function moveOpportunity(data: any, companyId: string) {
  try {
    const { opportunityId, newStageId } = data

    // Verificar se a oportunidade pertence à empresa
    const opportunity = await prisma.salesOpportunity.findFirst({
      where: {
        id: opportunityId,
        companyId
      }
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Oportunidade não encontrada' }, { status: 404 })
    }

    // Verificar se o estágio pertence à empresa
    const stage = await prisma.salesStage.findFirst({
      where: {
        id: newStageId,
        companyId
      }
    })

    if (!stage) {
      return NextResponse.json({ error: 'Estágio não encontrado' }, { status: 404 })
    }

    // Calcular probabilidade baseada no estágio
    const stageProbabilities = {
      'Qualificação': 10,
      'Interesse Confirmado': 35,
      'Visita Agendada': 55,
      'Proposta Enviada': 75,
      'Negociação': 90,
      'Fechamento': 100
    }

    const newProbability = stageProbabilities[stage.name as keyof typeof stageProbabilities] || opportunity.probability

    // Atualizar o estágio da oportunidade com nova probabilidade
    await prisma.salesOpportunity.update({
      where: { id: opportunityId },
      data: {
        stageId: newStageId,
        probability: newProbability,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      newProbability,
      message: `Probabilidade atualizada para ${newProbability}% (${stage.name})`
    })
  } catch (error) {
    console.error('Erro ao mover oportunidade:', error)
    return NextResponse.json({ error: 'Erro ao mover oportunidade' }, { status: 500 })
  }
}

async function createOpportunity(data: any, companyId: string, userId: string) {
  try {
    const { stageId, opportunity } = data

    // Verificar se o estágio pertence à empresa
    const stage = await prisma.salesStage.findFirst({
      where: {
        id: stageId,
        companyId
      }
    })

    if (!stage) {
      return NextResponse.json({ error: 'Estágio não encontrado' }, { status: 404 })
    }

    // Criar um lead temporário se não existir leadId
    let leadId = opportunity.leadId
    if (!leadId) {
      const tempLead = await prisma.lead.create({
        data: {
          name: opportunity.leadName || 'Novo Lead',
          email: 'temp@temp.com',
          phone: '(00) 00000-0000',
          interest: 'BUY',
          propertyType: 'APARTMENT',
          maxPrice: opportunity.value || 0,
          preferredCities: '[]',
          preferredStates: '[]',
          status: 'ACTIVE',
          companyId,
          userId
        }
      })
      leadId = tempLead.id
    }

    // Criar a oportunidade
    const newOpportunity = await prisma.salesOpportunity.create({
      data: {
        leadId,
        propertyId: opportunity.propertyId,
        stageId,
        value: opportunity.value,
        probability: opportunity.probability || 50,
        expectedCloseDate: opportunity.expectedCloseDate ? new Date(opportunity.expectedCloseDate) : null,
        notes: opportunity.notes,
        companyId,
        userId
      }
    })

    return NextResponse.json({ success: true, data: newOpportunity })
  } catch (error) {
    console.error('Erro ao criar oportunidade:', error)
    return NextResponse.json({ error: 'Erro ao criar oportunidade' }, { status: 500 })
  }
}

async function updateOpportunity(data: any, companyId: string) {
  try {
    const { opportunityId, updates } = data

    // Verificar se a oportunidade pertence à empresa
    const opportunity = await prisma.salesOpportunity.findFirst({
      where: {
        id: opportunityId,
        companyId
      }
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Oportunidade não encontrada' }, { status: 404 })
    }

    // Separar updates do lead e da oportunidade
    const { leadName, propertyTitle, ...opportunityUpdates } = updates
    
    // Atualizar o lead se o nome foi modificado
    if (leadName) {
      await prisma.lead.update({
        where: { id: opportunity.leadId },
        data: { name: leadName }
      })
    }

    // Atualizar a oportunidade (removendo campos que não existem na tabela)
    const updatedOpportunity = await prisma.salesOpportunity.update({
      where: { id: opportunityId },
      data: {
        value: opportunityUpdates.value,
        probability: opportunityUpdates.probability,
        notes: opportunityUpdates.notes,
        expectedCloseDate: opportunityUpdates.expectedCloseDate ? new Date(opportunityUpdates.expectedCloseDate) : undefined,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, data: updatedOpportunity })
  } catch (error) {
    console.error('Erro ao atualizar oportunidade:', error)
    return NextResponse.json({ error: 'Erro ao atualizar oportunidade' }, { status: 500 })
  }
}

async function deleteOpportunity(data: any, companyId: string) {
  try {
    const { opportunityId } = data

    // Verificar se a oportunidade pertence à empresa
    const opportunity = await prisma.salesOpportunity.findFirst({
      where: {
        id: opportunityId,
        companyId
      }
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Oportunidade não encontrada' }, { status: 404 })
    }

    // Deletar a oportunidade
    await prisma.salesOpportunity.delete({
      where: { id: opportunityId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar oportunidade:', error)
    return NextResponse.json({ error: 'Erro ao deletar oportunidade' }, { status: 500 })
  }
}