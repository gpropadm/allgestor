'use client'

import React, { useState, useEffect } from 'react'

interface FinancingSimulation {
  propertyValue: number
  downPayment: number
  loanAmount: number
  interestRate: number
  loanTermMonths: number
  monthlyPayment: number
  totalInterest: number
  totalAmount: number
}

interface BankOption {
  name: string
  interestRate: number
  maxLoanTerm: number
  maxFinancing: number // Porcentagem máxima financiada
  fees: number
  logo?: string
}

interface FinancialSimulatorProps {
  propertyValue?: number
  leadId?: string
  propertyId?: string
  onSimulationComplete?: (simulation: FinancingSimulation) => void
}

const BANK_OPTIONS: BankOption[] = [
  {
    name: 'Caixa Econômica Federal',
    interestRate: 10.75,
    maxLoanTerm: 420, // 35 anos
    maxFinancing: 80,
    fees: 25,
    logo: '🏦'
  },
  {
    name: 'Banco do Brasil',
    interestRate: 11.25,
    maxLoanTerm: 420,
    maxFinancing: 80,
    fees: 30,
    logo: '🏛️'
  },
  {
    name: 'Santander',
    interestRate: 11.85,
    maxLoanTerm: 420,
    maxFinancing: 80,
    fees: 35,
    logo: '🔴'
  },
  {
    name: 'Itaú',
    interestRate: 12.15,
    maxLoanTerm: 420,
    maxFinancing: 75,
    fees: 40,
    logo: '🟠'
  },
  {
    name: 'Bradesco',
    interestRate: 12.45,
    maxLoanTerm: 360,
    maxFinancing: 75,
    fees: 35,
    logo: '🔵'
  }
]

export function FinancialSimulator({ 
  propertyValue: initialPropertyValue = 500000,
  leadId,
  propertyId,
  onSimulationComplete 
}: FinancialSimulatorProps) {
  const [propertyValue, setPropertyValue] = useState(initialPropertyValue)
  const [downPaymentPercent, setDownPaymentPercent] = useState(20)
  const [loanTermYears, setLoanTermYears] = useState(30)
  const [selectedBank, setSelectedBank] = useState(BANK_OPTIONS[0])
  
  const [simulations, setSimulations] = useState<FinancingSimulation[]>([])
  const [activeSimulation, setActiveSimulation] = useState<FinancingSimulation | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [savedSimulations, setSavedSimulations] = useState<any[]>([])

  useEffect(() => {
    calculateSimulation()
  }, [propertyValue, downPaymentPercent, loanTermYears, selectedBank])

  useEffect(() => {
    if (leadId) {
      loadSavedSimulations()
    }
  }, [leadId])

  const calculateSimulation = () => {
    setIsCalculating(true)
    
    try {
      const downPayment = (propertyValue * downPaymentPercent) / 100
      const loanAmount = propertyValue - downPayment
      const monthlyRate = selectedBank.interestRate / 100 / 12
      const loanTermMonths = loanTermYears * 12
      
      // Fórmula Price para cálculo de parcela
      const monthlyPayment = loanAmount * (
        (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) /
        (Math.pow(1 + monthlyRate, loanTermMonths) - 1)
      )
      
      const totalAmount = monthlyPayment * loanTermMonths
      const totalInterest = totalAmount - loanAmount
      
      const simulation: FinancingSimulation = {
        propertyValue,
        downPayment,
        loanAmount,
        interestRate: selectedBank.interestRate,
        loanTermMonths,
        monthlyPayment,
        totalInterest,
        totalAmount
      }
      
      setActiveSimulation(simulation)
      
      if (onSimulationComplete) {
        onSimulationComplete(simulation)
      }
    } catch (error) {
      console.error('Erro no cálculo:', error)
    } finally {
      setIsCalculating(false)
    }
  }

  const compareAllBanks = () => {
    const comparisons = BANK_OPTIONS.map(bank => {
      const downPayment = (propertyValue * downPaymentPercent) / 100
      const loanAmount = propertyValue - downPayment
      const monthlyRate = bank.interestRate / 100 / 12
      const loanTermMonths = loanTermYears * 12
      
      const monthlyPayment = loanAmount * (
        (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) /
        (Math.pow(1 + monthlyRate, loanTermMonths) - 1)
      )
      
      const totalAmount = monthlyPayment * loanTermMonths
      const totalInterest = totalAmount - loanAmount
      
      return {
        bank,
        propertyValue,
        downPayment,
        loanAmount,
        interestRate: bank.interestRate,
        loanTermMonths,
        monthlyPayment,
        totalInterest,
        totalAmount
      }
    })
    
    setSimulations(comparisons)
  }

  const saveSimulation = async () => {
    if (!activeSimulation || !leadId) return
    
    try {
      const response = await fetch('/api/financial-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          leadId,
          propertyId,
          simulation: {
            ...activeSimulation,
            bankName: selectedBank.name
          }
        })
      })
      
      if (response.ok) {
        loadSavedSimulations()
        alert('Simulação salva com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao salvar simulação:', error)
    }
  }

  const loadSavedSimulations = async () => {
    if (!leadId) return
    
    try {
      const response = await fetch(`/api/financial-simulator?leadId=${leadId}`)
      const data = await response.json()
      
      if (data.success) {
        setSavedSimulations(data.simulations)
      }
    } catch (error) {
      console.error('Erro ao carregar simulações:', error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getAffordabilityColor = (monthlyPayment: number) => {
    const ratio = (monthlyPayment / propertyValue) * 100
    if (ratio < 0.5) return 'text-green-600'
    if (ratio < 1) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">💰 Simulador Financeiro</h2>
        <p className="text-gray-600 mt-1">
          Simule o financiamento do imóvel com diferentes bancos e condições
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Parâmetros da Simulação */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Valor do Imóvel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor do Imóvel
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">R$</span>
              <input
                type="number"
                value={propertyValue}
                onChange={(e) => setPropertyValue(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="500000"
              />
            </div>
          </div>

          {/* Entrada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entrada (%)
            </label>
            <div className="relative">
              <input
                type="range"
                min="10"
                max="50"
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>10%</span>
                <span className="font-medium text-blue-600">{downPaymentPercent}%</span>
                <span>50%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency((propertyValue * downPaymentPercent) / 100)}
            </p>
          </div>

          {/* Prazo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prazo (anos)
            </label>
            <select
              value={loanTermYears}
              onChange={(e) => setLoanTermYears(Number(e.target.value))}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[15, 20, 25, 30, 35].map(years => (
                <option key={years} value={years}>{years} anos</option>
              ))}
            </select>
          </div>

          {/* Banco */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banco
            </label>
            <select
              value={selectedBank.name}
              onChange={(e) => setSelectedBank(BANK_OPTIONS.find(b => b.name === e.target.value)!)}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {BANK_OPTIONS.map(bank => (
                <option key={bank.name} value={bank.name}>
                  {bank.logo} {bank.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Taxa: {selectedBank.interestRate}% a.a.
            </p>
          </div>
        </div>

        {/* Resultado Principal */}
        {activeSimulation && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Parcela Mensal</p>
                <p className={`text-2xl font-bold ${getAffordabilityColor(activeSimulation.monthlyPayment)}`}>
                  {formatCurrency(activeSimulation.monthlyPayment)}
                </p>
                <p className="text-xs text-gray-500">
                  {(activeSimulation.monthlyPayment / propertyValue * 100).toFixed(2)}% do valor
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">Valor Financiado</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(activeSimulation.loanAmount)}
                </p>
                <p className="text-xs text-gray-500">
                  {((activeSimulation.loanAmount / propertyValue) * 100).toFixed(0)}% do valor
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">Total de Juros</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(activeSimulation.totalInterest)}
                </p>
                <p className="text-xs text-gray-500">
                  Em {loanTermYears} anos
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">Total a Pagar</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(activeSimulation.totalAmount + activeSimulation.downPayment)}
                </p>
                <p className="text-xs text-gray-500">
                  Entrada + Financiamento
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={compareAllBanks}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🏦 Comparar Todos os Bancos
          </button>
          
          {leadId && (
            <button
              onClick={saveSimulation}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              💾 Salvar Simulação
            </button>
          )}
          
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🖨️ Imprimir
          </button>
        </div>

        {/* Comparação de Bancos */}
        {simulations.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Comparação de Bancos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Banco</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Taxa</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Parcela</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Juros</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Geral</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Economia</th>
                  </tr>
                </thead>
                <tbody>
                  {simulations
                    .sort((a, b) => a.monthlyPayment - b.monthlyPayment)
                    .map((sim, index) => {
                      const bestOption = simulations.reduce((prev, current) => 
                        prev.totalAmount < current.totalAmount ? prev : current
                      )
                      const savings = sim.totalAmount - bestOption.totalAmount
                      const isBest = sim.totalAmount === bestOption.totalAmount
                      
                      return (
                        <tr key={sim.bank.name} className={isBest ? 'bg-green-50' : 'bg-white'}>
                          <td className="px-4 py-3 border-t border-gray-200">
                            <div className="flex items-center">
                              <span className="mr-2">{sim.bank.logo}</span>
                              {sim.bank.name}
                              {isBest && <span className="ml-2 text-green-600 font-bold">🏆 MELHOR</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 border-t border-gray-200">
                            {sim.interestRate}% a.a.
                          </td>
                          <td className="px-4 py-3 border-t border-gray-200 font-medium">
                            {formatCurrency(sim.monthlyPayment)}
                          </td>
                          <td className="px-4 py-3 border-t border-gray-200 text-orange-600">
                            {formatCurrency(sim.totalInterest)}
                          </td>
                          <td className="px-4 py-3 border-t border-gray-200 font-medium">
                            {formatCurrency(sim.totalAmount)}
                          </td>
                          <td className="px-4 py-3 border-t border-gray-200">
                            {savings > 0 ? (
                              <span className="text-red-600">+ {formatCurrency(savings)}</span>
                            ) : (
                              <span className="text-green-600 font-bold">MELHOR OPÇÃO</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Simulações Salvas */}
        {savedSimulations.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Simulações Salvas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedSimulations.map((sim, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{sim.bankName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(sim.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Parcela: <span className="font-medium">{formatCurrency(sim.monthlyPayment)}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Valor: <span className="font-medium">{formatCurrency(sim.propertyValue)}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dicas */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Dicas Importantes:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• A parcela ideal não deve ultrapassar 30% da renda familiar</li>
            <li>• Entrada maior reduz o valor total a pagar</li>
            <li>• Compare sempre as condições de diferentes bancos</li>
            <li>• Considere custos adicionais: ITBI, cartório, seguro</li>
          </ul>
        </div>
      </div>
    </div>
  )
}