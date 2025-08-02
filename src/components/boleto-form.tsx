'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Contract {
  id: string
  property: {
    id: string
    title: string
    owner: {
      id: string
      name: string
    }
  }
  tenant: {
    id: string
    name: string
    email: string
    document: string
    phone: string
  }
  rentAmount: number
  administrationFeePercentage: number
}

interface BoletoFormProps {
  onSuccess?: (result: any) => void
  onCancel?: () => void
}

export default function BoletoForm({ onSuccess, onCancel }: BoletoFormProps) {
  const { data: session } = useSession()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(false)
  const [gatewayRecommendation, setGatewayRecommendation] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    contractId: '',
    amount: '',
    dueDate: '',
    description: '',
    forceGateway: '' as '' | 'ASAAS' | 'PJBANK'
  })

  useEffect(() => {
    loadContracts()
  }, [session])

  useEffect(() => {
    if (formData.amount && parseFloat(formData.amount) > 0) {
      getGatewayRecommendation()
    }
  }, [formData.amount])

  useEffect(() => {
    if (formData.contractId) {
      const contract = contracts.find(c => c.id === formData.contractId)
      setSelectedContract(contract || null)
      
      if (contract) {
        setFormData(prev => ({
          ...prev,
          amount: contract.rentAmount.toString(),
          description: `Aluguel - ${contract.property.title}`
        }))
      }
    }
  }, [formData.contractId, contracts])

  const loadContracts = async () => {
    try {
      const response = await fetch('/api/contracts')
      const data = await response.json()
      
      if (data.success) {
        setContracts(data.data.filter((c: Contract) => c.tenant))
      }
    } catch (error) {
      console.error('Error loading contracts:', error)
    }
  }

  const getGatewayRecommendation = async () => {
    try {
      const response = await fetch('/api/payments/gateway-selector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(formData.amount) })
      })
      
      const data = await response.json()
      if (data.success) {
        setGatewayRecommendation(data.data)
      }
    } catch (error) {
      console.error('Error getting gateway recommendation:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedContract) {
      alert('Selecione um contrato')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/payments/boletos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: formData.contractId,
          tenantName: selectedContract.tenant.name,
          tenantEmail: selectedContract.tenant.email,
          tenantDocument: selectedContract.tenant.document,
          tenantPhone: selectedContract.tenant.phone,
          amount: parseFloat(formData.amount),
          dueDate: formData.dueDate,
          description: formData.description,
          administrationFeePercentage: selectedContract.administrationFeePercentage,
          ownerId: selectedContract.property.owner.id,
          forceGateway: formData.forceGateway || undefined
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Boleto gerado com sucesso!')
        onSuccess?.(data.data)
        
        // Reset form
        setFormData({
          contractId: '',
          amount: '',
          dueDate: '',
          description: '',
          forceGateway: ''
        })
        setSelectedContract(null)
      } else {
        alert(`Erro: ${data.error}`)
      }
      
    } catch (error) {
      console.error('Error creating boleto:', error)
      alert('Erro ao gerar boleto')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h2 className="text-xl font-semibold mb-6">Gerar Novo Boleto com Split</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Seleção de Contrato */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contrato
          </label>
          <select
            value={formData.contractId}
            onChange={(e) => setFormData(prev => ({ ...prev, contractId: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          >
            <option value="">Selecione um contrato</option>
            {contracts.map(contract => (
              <option key={contract.id} value={contract.id}>
                {contract.property.title} - {contract.tenant.name}
              </option>
            ))}
          </select>
        </div>

        {selectedContract && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Detalhes do Contrato</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Inquilino:</span> {selectedContract.tenant.name}
              </div>
              <div>
                <span className="text-gray-600">Proprietário:</span> {selectedContract.property.owner.name}
              </div>
              <div>
                <span className="text-gray-600">Valor do Aluguel:</span> {formatCurrency(selectedContract.rentAmount)}
              </div>
              <div>
                <span className="text-gray-600">Taxa Admin:</span> {selectedContract.administrationFeePercentage}%
              </div>
            </div>
          </div>
        )}

        {/* Valor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor do Boleto
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>

        {/* Data de Vencimento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Vencimento
          </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Ex: Aluguel mês de Janeiro"
          />
        </div>

        {/* Recomendação de Gateway */}
        {gatewayRecommendation && (
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium mb-2 text-blue-900">Recomendação de Gateway</h3>
            <div className="text-sm text-blue-800">
              <p className="mb-2">
                <strong>Recomendado:</strong> {gatewayRecommendation.recommendation.gateway}
              </p>
              <p className="mb-2">
                <strong>Taxa estimada:</strong> {formatCurrency(gatewayRecommendation.recommendation.estimatedFee)}
              </p>
              <p>
                <strong>Motivo:</strong> {gatewayRecommendation.recommendation.reason}
              </p>
            </div>
            
            <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-2 rounded">
                <div className="font-medium">PJBank</div>
                <div>Taxa fixa: R$ 8,00</div>
              </div>
              <div className="bg-white p-2 rounded">
                <div className="font-medium">Asaas</div>
                <div>Taxa: {formatCurrency(gatewayRecommendation.comparison.asaas.fee)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Forçar Gateway */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Forçar Gateway (opcional)
          </label>
          <select
            value={formData.forceGateway}
            onChange={(e) => setFormData(prev => ({ ...prev, forceGateway: e.target.value as any }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Usar recomendação automática</option>
            <option value="ASAAS">Forçar Asaas</option>
            <option value="PJBANK">Forçar PJBank</option>
          </select>
        </div>

        {/* Split Preview */}
        {selectedContract && formData.amount && (
          <div className="bg-green-50 p-4 rounded-md">
            <h3 className="font-medium mb-2 text-green-900">Preview do Split</h3>
            <div className="text-sm text-green-800 space-y-1">
              <div className="flex justify-between">
                <span>Valor Total:</span>
                <span className="font-medium">{formatCurrency(parseFloat(formData.amount))}</span>
              </div>
              <div className="flex justify-between">
                <span>Proprietário ({100 - selectedContract.administrationFeePercentage}%):</span>
                <span className="font-medium">
                  {formatCurrency(parseFloat(formData.amount) * (100 - selectedContract.administrationFeePercentage) / 100)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Imobiliária ({selectedContract.administrationFeePercentage}%):</span>
                <span className="font-medium">
                  {formatCurrency(parseFloat(formData.amount) * selectedContract.administrationFeePercentage / 100)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Gerando...' : 'Gerar Boleto'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}