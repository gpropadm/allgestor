'use client'

import { useState } from 'react'

export default function SetupAI() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const executeMigration = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const response = await fetch('/api/migrate-ai-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult('✅ Tabelas AI criadas com sucesso! Agora você pode usar os assistentes.')
      } else {
        setResult(`❌ Erro: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Erro de conexão: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const createAssistants = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const response = await fetch('/api/ai-assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(`✅ ${data.message}`)
      } else {
        setResult(`❌ Erro: ${data.error || 'Erro ao criar assistentes'}`)
      }
    } catch (error) {
      setResult(`❌ Erro de conexão: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🛠️ Setup AI Assistentes
        </h1>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-6">
            <p><strong>Passo 1:</strong> Criar tabelas no banco</p>
            <p><strong>Passo 2:</strong> Criar assistentes (SOFIA, CARLOS, etc.)</p>
          </div>

          <button
            onClick={executeMigration}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando tabelas...
              </div>
            ) : (
              '1️⃣ Criar Tabelas AI'
            )}
          </button>

          <button
            onClick={createAssistants}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando assistentes...
              </div>
            ) : (
              '2️⃣ Criar Assistentes'
            )}
          </button>

          {result && (
            <div className={`p-4 rounded-lg text-sm ${
              result.includes('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {result}
            </div>
          )}

          <div className="pt-4 border-t">
            <a 
              href="/ai-assistants"
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors text-center block"
            >
              🤖 Ir para Assistentes
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}