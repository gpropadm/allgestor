'use client'

import { useState } from 'react'

export default function MigrateDimobPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runMigration = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/migrate-dimob', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: 'Erro na requisição' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold mb-6">🛠️ Migração Campo includeInDimob</h1>
        
        <p className="text-gray-600 mb-6">
          Esta página vai adicionar o campo includeInDimob na tabela contracts se ele não existir.
        </p>
        
        <button
          onClick={runMigration}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Executando migração...</span>
            </>
          ) : (
            <span>🚀 Executar Migração</span>
          )}
        </button>
        
        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`font-medium mb-2 ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? '✅ Sucesso!' : '❌ Erro'}
            </h3>
            
            <p className={`text-sm mb-4 ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.message || result.error}
            </p>
            
            {result.contracts && (
              <div className="mt-4">
                <h4 className="font-medium text-green-800 mb-2">Contratos verificados:</h4>
                <pre className="bg-green-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(result.contracts, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}