'use client'

import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { 
  Settings, 
  Trash, 
  FileText, 
  X,
  Save,
  MessageCircle,
  Eye,
  DollarSign,
  User,
  Home,
  Clock,
  StickyNote
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
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedStageId, setSelectedStageId] = useState('')
  const [existingLeads, setExistingLeads] = useState<any[]>([])

  // Função para obter probabilidade padrão do estágio - v1.1
  const getStageProbability = (stageName: string) => {
    const stageProbabilities: { [key: string]: number } = {
      'Qualificação': 10,
      'Interesse Confirmado': 35,
      'Visita Agendada': 55,
      'Proposta Enviada': 75,
      'Negociação': 90,
      'Fechamento': 100
    }
    return stageProbabilities[stageName] || 0
  }

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
      const response = await fetch('/api/sales-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          opportunityId: draggableId,
          newStageId: destination.droppableId,
          newPosition: destination.index
        })
      })
      
      const result = await response.json()
      
      if (result.success && result.newProbability) {
        // Mostrar notificação da mudança de probabilidade
        console.log(`Probabilidade atualizada: ${result.message}`)
        
        // Recarregar dados para mostrar a nova probabilidade
        setTimeout(() => {
          loadPipelineData()
        }, 500)
      }
    } catch (error) {
      console.error('Erro ao mover oportunidade:', error)
      // Reverter mudança em caso de erro
      loadPipelineData()
    }
  }

  const loadExistingLeads = async () => {
    try {
      const response = await fetch('/api/leads')
      if (response.ok) {
        const data = await response.json()
        setExistingLeads(data.leads || [])
      }
    } catch (error) {
      console.error('Erro ao carregar leads:', error)
    }
  }

  const addOpportunityFromExisting = async (leadId: string, leadName: string) => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const expectedCloseDate = futureDate.toISOString().split('T')[0]

    const opportunity = {
      leadId,
      leadName,
      value: 100000,
      probability: 10,
      expectedCloseDate,
      notes: 'À vista? Financiamento Aprovado? Urgente?'
    }

    try {
      const response = await fetch('/api/sales-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          stageId: selectedStageId,
          opportunity,
          companyId,
          userId
        })
      })
      
      if (response.ok) {
        setShowAddModal(false)
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
      <div className="p-3 sm:p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <div key={stage.id} className="flex-shrink-0 w-full lg:w-80">
                <div className="bg-gray-50 rounded-lg">
                  {/* Header do Estágio */}
                  <div 
                    className="p-4 rounded-t-lg text-white font-medium"
                    style={{ backgroundColor: stage.color }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{stage.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                          {stage.opportunities.length}
                        </span>
                      </div>
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
                                className={`bg-white p-4 rounded-lg border border-gray-300 shadow-sm cursor-move hover:shadow-md transition-shadow ${
                                  snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                                }`}
                              >
                                <OpportunityCard 
                                  opportunity={opportunity} 
                                  stageColor={stage.color}
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
                          onClick={() => {
                            setSelectedStageId(stage.id)
                            setShowAddModal(true)
                            loadExistingLeads()
                          }}
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

      {/* Modal de Adição */}
      {showAddModal && (
        <AddOpportunityModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          stageId={selectedStageId}
          existingLeads={existingLeads}
          onAddFromExisting={addOpportunityFromExisting}
        />
      )}
    </div>
  )
}

function AddOpportunityModal({
  isOpen,
  onClose,
  stageId,
  existingLeads,
  onAddFromExisting
}: {
  isOpen: boolean
  onClose: () => void
  stageId: string
  existingLeads: any[]
  onAddFromExisting: (leadId: string, leadName: string) => void
}) {
  const [selectedLead, setSelectedLead] = useState('')

  if (!isOpen) return null

  const handleAddExisting = () => {
    if (selectedLead) {
      const lead = existingLeads.find(l => l.id === selectedLead)
      onAddFromExisting(selectedLead, lead?.name || 'Lead')
    }
  }

  const handleGoToLeads = () => {
    window.open('/leads', '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Adicionar Oportunidade</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Opção 1: Lead Existente */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Selecionar Lead Existente
            </h4>
            
            {existingLeads.length > 0 ? (
              <>
                <select
                  value={selectedLead}
                  onChange={(e) => setSelectedLead(e.target.value)}
                  className="w-full p-2 border rounded text-sm mb-3"
                >
                  <option value="">Escolha um lead...</option>
                  {existingLeads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} - {lead.phone || lead.email || 'Sem contato'}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddExisting}
                  disabled={!selectedLead}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Adicionar ao Pipeline
                </button>
              </>
            ) : (
              <p className="text-gray-500 text-sm mb-3">Nenhum lead cadastrado ainda.</p>
            )}
          </div>

          <div className="text-center text-gray-500 text-sm">ou</div>

          {/* Opção 2: Ir para Leads */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Cadastrar Novo Lead Completo
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Cadastre um lead completo com todos os dados para melhor matching
            </p>
            <button
              onClick={handleGoToLeads}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              🔗 Ir para Página de Leads
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OpportunityCard({ 
  opportunity, 
  stageColor,
  onUpdate, 
  onDelete 
}: { 
  opportunity: SalesOpportunity
  stageColor: string
  onUpdate?: (id: string, updates: Partial<SalesOpportunity>) => void
  onDelete?: (id: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [editForm, setEditForm] = useState({
    leadName: opportunity.leadName,
    propertyTitle: opportunity.propertyTitle || '',
    value: opportunity.value || 0,
    notes: opportunity.notes || ''
  })
  

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
          onFocus={(e) => {
            if (e.target.value === 'Nome do Lead') {
              setEditForm({...editForm, leadName: ''})
            }
          }}
          className="w-full p-2 border rounded text-sm"
          placeholder="Nome do Lead"
        />

        <input
          type="text"
          value={editForm.propertyTitle}
          onChange={(e) => setEditForm({...editForm, propertyTitle: e.target.value})}
          className="w-full p-2 border rounded text-sm"
          placeholder="Imóvel de Interesse"
        />

        <input
          type="text"
          value={editForm.value ? `R$ ${editForm.value.toLocaleString('pt-BR')}` : ''}
          onChange={(e) => {
            const value = e.target.value.replace(/[^\d]/g, '')
            setEditForm({...editForm, value: value ? Number(value) : 0})
          }}
          className="w-full p-2 border rounded text-sm"
          placeholder="R$ 0"
        />
        


        <textarea
          value={editForm.notes}
          onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
          onFocus={(e) => {
            if (e.target.value === 'À vista? Financiamento Aprovado? Urgente?') {
              setEditForm({...editForm, notes: ''})
            }
          }}
          className="w-full p-2 border rounded text-sm h-16 resize-none"
          placeholder="À vista? Financiamento Aprovado? Urgente?"
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <h4 className="font-medium text-gray-900 truncate">
            {opportunity.leadName}
          </h4>
        </div>
        <div className="flex space-x-1">
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
            title="Editar"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={handleDelete}
            className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition-colors"
            title="Deletar"
          >
            <Trash className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Informações principais */}
      <div className="space-y-2">
        {/* Propriedade */}
        {opportunity.propertyTitle && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Home className="h-4 w-4 text-gray-400" />
            <span className="truncate">{opportunity.propertyTitle}</span>
          </div>
        )}

        {/* Valor e Probabilidade */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span className="font-semibold text-gray-900">
              {opportunity.value ? `R$ ${opportunity.value.toLocaleString()}` : 'Sem valor'}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span 
              className="text-sm font-bold px-2 py-1 rounded" 
              style={{ color: stageColor, backgroundColor: stageColor + '20' }}
            >
              {opportunity.probability}%
            </span>
          </div>
        </div>

        {/* Data de Fechamento */}
        {opportunity.expectedCloseDate && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-orange-500" />
            <span>
              {new Date(opportunity.expectedCloseDate).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
      </div>

      {/* Notas (apenas se expandido) */}
      {showDetails && opportunity.notes && (
        <div className="flex items-start space-x-2 text-xs text-gray-500">
          <StickyNote className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="bg-gray-50 p-2 rounded text-xs leading-relaxed">
            {opportunity.notes}
          </p>
        </div>
      )}

      {/* Ações Funcionais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 pt-3 border-t border-gray-100">
        <button 
          onClick={handleViewLead}
          className="flex items-center justify-center space-x-1 text-xs bg-blue-50 text-blue-700 py-2 rounded-md hover:bg-blue-100 transition-colors"
          title="Ver detalhes do lead"
        >
          <Eye className="h-3 w-3" />
          <span>Lead</span>
        </button>
        <button 
          onClick={handleContact}
          className="flex items-center justify-center space-x-1 text-xs bg-green-50 text-green-700 py-2 rounded-md hover:bg-green-100 transition-colors"
          title="Contatar via WhatsApp"
        >
          <MessageCircle className="h-3 w-3" />
          <span>Chat</span>
        </button>
        <button 
          onClick={handleProposal}
          className="flex items-center justify-center space-x-1 text-xs bg-purple-50 text-purple-700 py-2 rounded-md hover:bg-purple-100 transition-colors"
          title="Gerar proposta/simular financiamento"
        >
          <FileText className="h-3 w-3" />
          <span>Proposta</span>
        </button>
      </div>
    </div>
  )
}