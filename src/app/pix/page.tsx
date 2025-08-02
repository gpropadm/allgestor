'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Copy, CreditCard, Building2, User, CheckCircle } from 'lucide-react'

export default function PixPage() {
  const [copiedField, setCopiedField] = useState<string>('')
  const [pixInfo, setPixInfo] = useState({
    pixKey: '',
    accountHolder: '',
    bankName: '',
    instructions: ''
  })

  useEffect(() => {
    loadPixInfo()
  }, [])

  const loadPixInfo = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.payment) {
          // Usar dados das configurações
          setPixInfo({
            pixKey: data.payment.pixKey || '',
            accountHolder: data.payment.accountHolder || '',
            bankName: data.payment.bankName || '',
            instructions: data.payment.pixInstructions || ''
          })
        }
      } else if (response.status === 400) {
        // Tentar corrigir associação usuário-empresa automaticamente
        try {
          console.log('Tentando corrigir associação usuário-empresa...')
          const fixResponse = await fetch('/api/fix-user-company', { method: 'POST' })
          if (fixResponse.ok) {
            // Aguardar um momento e tentar novamente
            setTimeout(async () => {
              const retryResponse = await fetch('/api/settings')
              if (retryResponse.ok) {
                const retryData = await retryResponse.json()
                if (retryData.payment) {
                  setPixInfo({
                    pixKey: retryData.payment.pixKey || '',
                    accountHolder: retryData.payment.accountHolder || '',
                    bankName: retryData.payment.bankName || '',
                    instructions: retryData.payment.pixInstructions || ''
                  })
                }
              }
            }, 2000) // Aguardar 2 segundos
          }
        } catch (fixError) {
          console.log('Erro ao corrigir associação, usando dados padrão')
        }
      }
    } catch (error) {
      console.log('Usando dados padrão do PIX')
      // Manter dados padrão se não conseguir carregar
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(''), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Se não tem PIX configurado, mostrar mensagem
  if (!pixInfo.pixKey) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                PIX não configurado
              </h2>
              <p className="text-gray-600 mb-6">
                As informações de PIX ainda não foram configuradas.
              </p>
              <p className="text-sm text-gray-500">
                Entre em contato com o administrador para mais informações.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Informações de Pagamento PIX
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Dados para pagamentos via PIX
          </p>
        </div>

        {/* PIX Card */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl shadow-sm border border-green-200 dark:border-green-800 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-600 p-3 rounded-lg">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  PIX - Pagamento Instantâneo
                </h2>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Informações para transferência
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chave PIX */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-100 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Chave PIX
                  </label>
                  <button
                    onClick={() => copyToClipboard(pixInfo.pixKey, 'pixKey')}
                    className="flex items-center gap-1 text-green-600 hover:text-green-700 text-xs"
                  >
                    {copiedField === 'pixKey' ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
                <p className="text-lg font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded border text-gray-900 dark:text-white break-all">
                  {pixInfo.pixKey}
                </p>
              </div>

              {/* Titular */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-100 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Titular da Conta
                  </label>
                  <button
                    onClick={() => copyToClipboard(pixInfo.accountHolder, 'accountHolder')}
                    className="flex items-center gap-1 text-green-600 hover:text-green-700 text-xs"
                  >
                    {copiedField === 'accountHolder' ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
                <p className="text-lg bg-gray-50 dark:bg-gray-700 p-2 rounded border text-gray-900 dark:text-white">
                  {pixInfo.accountHolder}
                </p>
              </div>

              {/* Banco */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-100 dark:border-green-800">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-2">
                  <Building2 className="w-4 h-4" />
                  Banco
                </label>
                <p className="text-lg bg-gray-50 dark:bg-gray-700 p-2 rounded border text-gray-900 dark:text-white">
                  {pixInfo.bankName}
                </p>
              </div>
            </div>

            {/* Instruções */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                📋 Instruções de Pagamento
              </h3>
              <p className="text-blue-800 dark:text-blue-200">
                {pixInfo.instructions}
              </p>
            </div>

            {/* Botão de Ação */}
            <div className="mt-6 text-center">
              <button
                onClick={() => copyToClipboard(pixInfo.pixKey, 'action')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                {copiedField === 'action' ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    PIX Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copiar Chave PIX
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            💡 Como fazer o pagamento
          </h3>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>• Abra o aplicativo do seu banco</p>
            <p>• Vá na opção PIX</p>
            <p>• Cole ou digite a chave PIX acima</p>
            <p>• Confirme os dados do destinatário</p>
            <p>• Digite o valor e confirme o pagamento</p>
            <p>• Envie o comprovante para finalizar</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}