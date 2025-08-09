'use client'

import { useState, useEffect } from 'react'
import { Download, FileText, Calendar, Building, Users, CheckCircle, AlertTriangle } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'

export default function DimobPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedOwnerId, setSelectedOwnerId] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [contracts, setContracts] = useState([])
  const [owners, setOwners] = useState([])
  const [settings, setSettings] = useState(null)
  const [validationResult, setValidationResult] = useState(null)

  // Anos disponíveis (últimos 5 anos + próximo)
  const availableYears = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i)

  useEffect(() => {
    loadSettings()
    loadOwners()
  }, [])

  useEffect(() => {
    if (selectedOwnerId) {
      loadContracts()
      setValidationResult(null) // Reset validation when changing selection
    }
  }, [selectedYear, selectedOwnerId])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.company)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const loadOwners = async () => {
    try {
      console.log('🔍 Carregando proprietários...')
      const response = await fetch('/api/owners')
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Proprietários recebidos:', data)
        // A API retorna array direto, não objeto com owners
        setOwners(Array.isArray(data) ? data : [])
      } else {
        console.error('❌ Erro na resposta:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar proprietários:', error)
    }
  }

  const loadContracts = async () => {
    if (!selectedOwnerId) return
    
    try {
      const response = await fetch(`/api/contracts?year=${selectedYear}&status=ACTIVE&withPayments=true&ownerId=${selectedOwnerId}&includeInDimob=true`)
      if (response.ok) {
        const data = await response.json()
        setContracts(data.contracts || [])
      }
    } catch (error) {
      console.error('Erro ao carregar contratos:', error)
    }
  }

  const validateDimob = async () => {
    if (!selectedOwnerId) {
      alert('❌ Selecione um proprietário para validar!')
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch('/api/dimob/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          year: selectedYear,
          ownerId: selectedOwnerId
        })
      })

      if (response.ok) {
        const result = await response.json()
        setValidationResult(result)
      } else {
        const error = await response.json()
        alert(`❌ Erro ao validar: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao validar DIMOB:', error)
      alert('❌ Erro ao validar dados para DIMOB')
    } finally {
      setIsValidating(false)
    }
  }

  const generateDimob = async () => {
    if (!settings?.responsibleCpf || !settings?.municipalityCode) {
      alert('❌ Configure primeiro o CPF do responsável e código do município nas configurações da empresa!')
      return
    }

    if (!selectedOwnerId) {
      alert('❌ Selecione um proprietário para gerar o DIMOB!')
      return
    }

    const selectedOwner = owners.find(o => o.id === selectedOwnerId)
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/dimob/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          year: selectedYear,
          ownerId: selectedOwnerId
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `DIMOB_${selectedYear}_${selectedOwner?.name?.replace(/\s+/g, '_') || 'Proprietario'}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        const error = await response.json()
        alert(`❌ Erro ao gerar DIMOB: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao gerar DIMOB:', error)
      alert('❌ Erro ao gerar arquivo DIMOB')
    } finally {
      setIsGenerating(false)
    }
  }

  const contractsWithPayments = contracts.filter(c => 
    c.payments?.length > 0 && 
    c.includeInDimob !== false // Garantir que está marcado para inclusão no DIMOB
  )

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">📄 DIMOB - Receita Federal</h1>
            <p className="text-blue-100 mt-2">
              Geração oficial do arquivo TXT para declaração de atividades imobiliárias
            </p>
          </div>
        </div>
      </div>

      {/* Status das configurações */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Building className="w-5 h-5 mr-2 text-blue-600" />
          Status das Configurações
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${settings?.responsibleCpf ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-3 ${settings?.responsibleCpf ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="font-medium">CPF do Responsável</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {settings?.responsibleCpf ? `✅ Configurado: ${settings.responsibleCpf}` : '❌ Não configurado'}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${settings?.municipalityCode ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-3 ${settings?.municipalityCode ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="font-medium">Código Município</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {settings?.municipalityCode ? `✅ Configurado: ${settings.municipalityCode}` : '❌ Não configurado'}
            </p>
          </div>
        </div>
      </div>

      {/* Seleção de ano e geração */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Geração do Arquivo DIMOB
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proprietário *
            </label>
            <select
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
            >
              <option value="">
                {owners.length === 0 ? 'Carregando proprietários...' : 'Selecione o proprietário'}
              </option>
              {owners.map(owner => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} - {owner.document}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {owners.length === 0 
                ? '⚠️ Nenhum proprietário cadastrado. Cadastre proprietários primeiro.' 
                : 'DIMOB é gerado individualmente por proprietário'
              }
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ano-Calendário *
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 flex items-end">
            <button
              onClick={validateDimob}
              disabled={isValidating || !selectedOwnerId}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Validando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Validar Dados</span>
                </>
              )}
            </button>
          </div>

          <div className="md:col-span-1 flex items-end">
            <button
              onClick={generateDimob}
              disabled={isGenerating || !settings?.responsibleCpf || !settings?.municipalityCode || !selectedOwnerId || (validationResult && !validationResult.isValid)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Gerando arquivo...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Gerar DIMOB.txt</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Resultado da Validação */}
      {validationResult && (
        <div className={`rounded-lg border p-6 ${
          validationResult.isValid 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center mb-4">
            {validationResult.isValid ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-medium text-green-900">
                  ✅ Dados válidos para geração DIMOB
                </h3>
              </>
            ) : (
              <>
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-medium text-red-900">
                  ❌ Erros encontrados - Correção necessária
                </h3>
              </>
            )}
          </div>
          
          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{validationResult.summary?.totalContracts || 0}</div>
              <div className="text-sm text-gray-600">Total Contratos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{validationResult.summary?.contractsForDimob || 0}</div>
              <div className="text-sm text-gray-600">Para DIMOB</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{validationResult.summary?.totalErrors || 0}</div>
              <div className="text-sm text-gray-600">Erros Críticos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{validationResult.summary?.totalWarnings || 0}</div>
              <div className="text-sm text-gray-600">Avisos</div>
            </div>
          </div>
          
          {/* Detalhes dos erros */}
          {validationResult.errors && validationResult.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-red-900 mb-2">🚫 Erros que impedem a geração:</h4>
              <div className="space-y-2">
                {validationResult.errors.map((error, index) => (
                  <div key={index} className="bg-red-100 border border-red-300 rounded p-3">
                    <div className="text-sm text-red-800">
                      <strong>{error.entity}:</strong> {error.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Detalhes dos avisos */}
          {validationResult.warnings && validationResult.warnings.length > 0 && (
            <div>
              <h4 className="font-medium text-amber-900 mb-2">⚠️ Avisos (não impedem a geração):</h4>
              <div className="space-y-2">
                {validationResult.warnings.map((warning, index) => (
                  <div key={index} className="bg-amber-100 border border-amber-300 rounded p-3">
                    <div className="text-sm text-amber-800">
                      <strong>{warning.entity}:</strong> {warning.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview dos contratos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600" />
          Contratos que serão incluídos no DIMOB {selectedYear}
        </h2>

        {contractsWithPayments.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              📊 {contractsWithPayments.length} contratos com pagamentos em {selectedYear}
            </div>
            
            <div className="grid gap-4">
              {contractsWithPayments.map((contract, index) => (
                <div key={contract.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        #{index + 1} - {contract.property?.address || 'Endereço não informado'}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="inline-block mr-4">👤 Proprietário: {contract.property?.owner?.name}</span>
                        <span className="inline-block">🏠 Inquilino: {contract.tenant?.name}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium text-green-600">
                        {contract.payments?.length || 0} pagamentos
                      </div>
                      <div className="text-gray-500">
                        R$ {contract.payments?.reduce((sum, p) => sum + p.amount, 0)?.toFixed(2) || '0,00'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum contrato com pagamentos encontrado para {selectedYear}</p>
            <p className="text-sm mt-2">Certifique-se de que há contratos ativos com pagamentos registrados no ano selecionado.</p>
          </div>
        )}
      </div>

      {/* Informações importantes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-yellow-900 mb-3">
          ⚠️ Informações Importantes
        </h3>
        <div className="text-sm text-yellow-800 space-y-2">
          <p>• O arquivo seguirá <strong>exatamente</strong> a especificação oficial da Basesoft</p>
          <p>• Apenas contratos com pagamentos registrados no ano serão incluídos</p>
          <p>• Certifique-se de que todos os dados estão corretos antes de gerar</p>
          <p>• O arquivo gerado deve ser importado no programa oficial DIMOB da Receita Federal</p>
        </div>
      </div>
      </div>
    </DashboardLayout>
  )
}