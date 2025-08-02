'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Database, CheckCircle, AlertTriangle, Loader } from 'lucide-react'

export default function MigrateGateway() {
  const [migrating, setMigrating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const runMigration = async () => {
    setMigrating(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/admin/migrate-payment-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: 'Erro de conexão',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setMigrating(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Migração: Campos Gateway de Pagamento
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Adicionar campos necessários para integração com PJBank e Asaas
          </p>
        </div>

        {/* Migration Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Database className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Migração do Schema de Pagamentos
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Campos que serão adicionados:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <code>gateway</code> - Enum: ASAAS, PJBANK, MANUAL</li>
                <li>• <code>gatewayPaymentId</code> - ID do pagamento no gateway</li>
                <li>• <code>boletoUrl</code> - URL do boleto gerado</li>
                <li>• <code>boletoCode</code> - Código de barras do boleto</li>
                <li>• <code>pixQrCode</code> - QR Code do PIX</li>
                <li>• <code>webhookReceived</code> - Flag de webhook processado</li>
                <li>• <code>lastWebhookAt</code> - Data do último webhook</li>
              </ul>
            </div>

            <button
              onClick={runMigration}
              disabled={migrating}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
            >
              {migrating ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Executando Migração...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5 mr-2" />
                  Executar Migração
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className={`rounded-xl p-6 border ${
            result.success 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
          }`}>
            <div className="flex items-center mb-3">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              )}
              <h3 className={`text-lg font-semibold ${
                result.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
              }`}>
                {result.success ? 'Migração Concluída' : 'Erro na Migração'}
              </h3>
            </div>
            
            <p className={`mb-4 ${
              result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {result.message}
            </p>
            
            {result.fieldsAdded && (
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  Campos adicionados:
                </h4>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  {result.fieldsAdded.map((field: string, index: number) => (
                    <li key={index}>• {field}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.error && (
              <div className="mt-4">
                <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                  Detalhes do erro:
                </h4>
                <code className="text-sm text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/30 p-2 rounded block">
                  {result.details || result.error}
                </code>
              </div>
            )}
            
            {result.alreadyExists && (
              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ✅ Os campos de gateway já existem no banco de dados. Agora você pode usar as integrações do PJBank!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}