'use client'

import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { 
  Edit, 
  Trash2, 
  User, 
  Phone, 
  FileText, 
  X,
  Save,
  MessageCircle,
  Eye,
  DollarSign,
  Calendar
} from 'lucide-react'

interface SalesStage {
  id: string
  name: string
  color: string
  stageOrder: number
  opportunities: SalesOpportunity[]
}

interface SalesOpportunity {
  id: string
  leadName: string
  propertyTitle?: string
  value?: number
  probability: number
  expectedCloseDate?: string
  notes?: string
  leadId: string
  propertyId?: string
}

interface SalesPipelineProps {
  companyId: string
  userId: string
}

export function SalesPipeline({ companyId, userId }: SalesPipelineProps) {
  const [stages, setStages] = useState<SalesStage[]>([])
  const [loading, setLoading] = useState(true)
  const [totalValue, setTotalValue] = useState(0)
  const [weightedValue, setWeightedValue] = useState(0)

  useEffect(() => {
    loadPipelineData()
  }, [companyId])

  const loadPipelineData = async () => {
    try {
      const response = await fetch('/api/sales-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'load', companyId })
      })
      
      const data = await response.json()
      if (data.success) {
        setStages(data.stages)
        calculateTotals(data.stages)
      }
    } catch (error) {
      console.error('Erro ao carregar pipeline:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = (pipelineStages: SalesStage[]) => {
    let total = 0
    let weighted = 0
    
    pipelineStages.forEach(stage => {
      stage.opportunities.forEach(opp => {
        if (opp.value) {
          total += opp.value
          weighted += opp.value * (opp.probability / 100)
        }
      })
    })
    
    setTotalValue(total)
    setWeightedValue(weighted)
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result
    
    if (source.droppableId === destination.droppableId && 
        source.index === destination.index) {
      return
    }

    // Atualizar localmente primeiro
    const newStages = Array.from(stages)
    const sourceStage = newStages.find(s => s.id === source.droppableId)!
    const destStage = newStages.find(s => s.id === destination.droppableId)!
    
    const [movedOpportunity] = sourceStage.opportunities.splice(source.index, 1)
    destStage.opportunities.splice(destination.index, 0, movedOpportunity)
    
    setStages(newStages)
    calculateTotals(newStages)

    // Atualizar no servidor
    try {
      await fetch('/api/sales-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          opportunityId: draggableId,
          newStageId: destination.droppableId,
          newPosition: destination.index
        })
      })
    } catch (error) {
      console.error('Erro ao mover oportunidade:', error)
      // Reverter mudança em caso de erro
      loadPipelineData()
    }
  }

  const addOpportunity = async (stageId: string) => {
    const opportunity = {
      leadName: 'Novo Lead',
      value: 100000,
      probability: 50,
      notes: 'Clique no ícone de edição para personalizar...'
    }

    try {
      const response = await fetch('/api/sales-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          stageId,
          opportunity,
          companyId,
          userId
        })
      })
      
      if (response.ok) {
        loadPipelineData()
      }
    } catch (error) {
      console.error('Erro ao criar oportunidade:', error)
    }
  }

  const updateOpportunity = async (opportunityId: string, updates: Partial<SalesOpportunity>) => {
    try {
      const response = await fetch('/api/sales-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          opportunityId,
          updates
        })
      })
      
      if (response.ok) {
        loadPipelineData()
      }
    } catch (error) {
      console.error('Erro ao atualizar oportunidade:', error)
    }
  }

  const deleteOpportunity = async (opportunityId: string) => {
    try {
      const response = await fetch('/api/sales-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          opportunityId
        })
      })
      
      if (response.ok) {
        loadPipelineData()
      }
    } catch (error) {
      console.error('Erro ao deletar oportunidade:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header do Pipeline */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Pipeline de Vendas</h2>
            <p className="text-sm text-gray-500 mt-1">
              Arraste e solte para mover oportunidades entre os estágios
            </p>
          </div>
          
          <div className="flex space-x-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                R$ {totalValue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Valor Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                R$ {weightedValue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Valor Ponderado</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {stages.reduce((sum, stage) => sum + stage.opportunities.length, 0)}
              </p>
              <p className="text-xs text-gray-500">Oportunidades</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className="p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-6 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <div key={stage.id} className="flex-shrink-0 w-80">
                <div className="bg-gray-50 rounded-lg">
                  {/* Header do Estágio */}
                  <div 
                    className="p-4 rounded-t-lg text-white font-medium"
                    style={{ backgroundColor: stage.color }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{stage.name}</span>
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
                        {stage.opportunities.length}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Oportunidades */}
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-4 space-y-3 min-h-[400px] ${
                          snapshot.isDraggingOver ? 'bg-blue-50' : ''
                        }`}
                      >
                        {stage.opportunities.map((opportunity, index) => (
                          <Draggable
                            key={opportunity.id}
                            draggableId={opportunity.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white p-4 rounded-lg border shadow-sm cursor-move hover:shadow-md transition-shadow ${
                                  snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                                }`}
                              >
                                <OpportunityCard 
                                  opportunity={opportunity} 
                                  onUpdate={updateOpportunity}
                                  onDelete={deleteOpportunity}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {/* Botão Adicionar */}
                        <button
                          onClick={() => addOpportunity(stage.id)}
                          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                        >
                          + Adicionar Oportunidade
                        </button>
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}

function OpportunityCard({ 
  opportunity, 
  onUpdate, 
  onDelete 
}: { 
  opportunity: SalesOpportunity
  onUpdate?: (id: string, updates: Partial<SalesOpportunity>) => void
  onDelete?: (id: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [editForm, setEditForm] = useState({
    leadName: opportunity.leadName,
    propertyTitle: opportunity.propertyTitle || '',
    value: opportunity.value || 0,
    probability: opportunity.probability,
    expectedCloseDate: opportunity.expectedCloseDate || '',
    notes: opportunity.notes || ''
  })
  
  const probabilityColor = 
    opportunity.probability >= 70 ? 'text-green-600 bg-green-100' :
    opportunity.probability >= 40 ? 'text-yellow-600 bg-yellow-100' :
    'text-red-600 bg-red-100'

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(opportunity.id, editForm)
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja deletar esta oportunidade?')) {
      if (onDelete) {
        onDelete(opportunity.id)
      }
    }
  }

  const handleViewLead = () => {
    window.open(`/leads?search=${opportunity.leadName}`, '_blank')
  }

  const handleContact = () => {
    // Simular abertura do WhatsApp
    const phone = '5511999999999' // Buscar telefone real do lead
    const message = `Olá ${opportunity.leadName}! Como está o interesse no imóvel?`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleProposal = () => {
    // Abrir simulador financeiro com dados pré-preenchidos
    window.open(`/simulador-financeiro?value=${opportunity.value}&leadId=${opportunity.leadId}`, '_blank')
  }

  if (isEditing) {
    return (
      <div className="space-y-3 bg-blue-50 p-3 rounded-lg border-2 border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-blue-900">Editando Oportunidade</h4>
          <div className="flex space-x-1">
            <button 
              onClick={handleSave}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
            >
              <Save className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setIsEditing(false)}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <input
          type="text"
          value={editForm.leadName}
          onChange={(e) => setEditForm({...editForm, leadName: e.target.value})}
          className="w-full p-2 border rounded text-sm"
          placeholder="Nome do Lead"
        />

        <input
          type="text"
          value={editForm.propertyTitle}
          onChange={(e) => setEditForm({...editForm, propertyTitle: e.target.value})}
          className="w-full p-2 border rounded text-sm"
          placeholder="Título da Propriedade"
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={editForm.value}
            onChange={(e) => setEditForm({...editForm, value: Number(e.target.value)})}
            className="p-2 border rounded text-sm"
            placeholder="Valor (R$)"
          />
          <input
            type="number"
            min="0"
            max="100"
            value={editForm.probability}
            onChange={(e) => setEditForm({...editForm, probability: Number(e.target.value)})}
            className="p-2 border rounded text-sm"
            placeholder="Probabilidade (%)"
          />
        </div>

        <input
          type="date"
          value={editForm.expectedCloseDate}
          onChange={(e) => setEditForm({...editForm, expectedCloseDate: e.target.value})}
          className="w-full p-2 border rounded text-sm"
        />

        <textarea
          value={editForm.notes}
          onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
          className="w-full p-2 border rounded text-sm h-16 resize-none"
          placeholder="Notas sobre a oportunidade..."
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 truncate cursor-pointer"
            onClick={() => setShowDetails(!showDetails)}>
          {opportunity.leadName}
        </h4>
        <div className="flex space-x-1">
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            title="Editar"
          >
            <Edit className="h-3 w-3" />
          </button>
          <button 
            onClick={handleDelete}
            className="p-1 text-red-600 hover:bg-red-100 rounded"
            title="Deletar"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Propriedade */}
      {opportunity.propertyTitle && (
        <p className="text-sm text-gray-600 truncate">
          🏠 {opportunity.propertyTitle}
        </p>
      )}

      {/* Valor e Probabilidade */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900 flex items-center">
          <DollarSign className="h-3 w-3 mr-1" />
          {opportunity.value ? `R$ ${opportunity.value.toLocaleString()}` : 'Sem valor'}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${probabilityColor}`}>
          {opportunity.probability}%
        </span>
      </div>

      {/* Data de Fechamento */}
      {opportunity.expectedCloseDate && (
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(opportunity.expectedCloseDate).toLocaleDateString('pt-BR')}
        </div>
      )}

      {/* Notas (apenas se expandido) */}
      {showDetails && opportunity.notes && (
        <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          {opportunity.notes}
        </p>
      )}

      {/* Ações Funcionais */}
      <div className="flex space-x-1 pt-2 border-t border-gray-100">
        <button 
          onClick={handleViewLead}
          className="flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
          title="Ver detalhes do lead"
        >
          <Eye className="h-3 w-3 mr-1" />
          Lead
        </button>
        <button 
          onClick={handleContact}
          className="flex items-center text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
          title="Contatar via WhatsApp"
        >
          <MessageCircle className="h-3 w-3 mr-1" />
          WhatsApp
        </button>
        <button 
          onClick={handleProposal}
          className="flex items-center text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
          title="Gerar proposta/simular financiamento"
        >
          <FileText className="h-3 w-3 mr-1" />
          Proposta
        </button>
      </div>
    </div>
  )
}