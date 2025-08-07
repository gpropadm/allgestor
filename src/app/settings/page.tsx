'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { useTheme } from '@/lib/theme-context'
import { useCompanyLogo } from '@/lib/company-logo-context'
// import { ToastContainer, useToast } from '@/components/toast'
import { 
  Building2, 
  Bell, 
  Palette, 
  DollarSign, 
  Link, 
  Shield,
  Save,
  Upload,
  Moon,
  Sun,
  User,
  Settings as SettingsIcon
} from 'lucide-react'

interface CompanySettings {
  name: string
  tradeName: string
  document: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  logo: string
  website: string
  // Campos DIMOB obrigatórios
  responsibleCpf: string
  municipalityCode: string
}

interface SystemSettings {
  theme: 'light' | 'dark'
  language: 'pt' | 'en' | 'es'
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  currency: 'BRL' | 'USD' | 'EUR'
  timezone: string
}

interface NotificationSettings {
  emailEnabled: boolean
  whatsappEnabled: boolean
  contractExpiring: boolean
  paymentDue: boolean
  paymentOverdue: boolean
  daysBefore: number
}

interface FinancialSettings {
  // Configurações de Multa e Juros para Atrasos
  penaltyRate: number        // % de multa por atraso
  dailyInterestRate: number  // % de juros ao dia
  gracePeriodDays: number    // dias de carência antes de aplicar multa
  maxInterestDays: number    // máximo de dias para calcular juros
}

interface PaymentSettings {
  pixKey: string             // Chave PIX da empresa
  pixInstructions: string    // Instruções de pagamento
  bankName: string          // Nome do banco
  accountHolder: string     // Titular da conta
}

interface UserProfile {
  name: string
  email: string
  phone: string
}

interface APISettings {
  infosimplesApiKey: string
}

interface AsaasSettings {
  apiKey: string
  enabled: boolean
  walletId: string
}

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const { setCompanyLogo } = useCompanyLogo()
  // const { toasts, removeToast, showSuccess, showError } = useToast()
  
  // Simple toast replacement
  const showSuccess = (title: string, message?: string) => {
    alert(`✅ ${title}${message ? ': ' + message : ''}`)
  }
  const showError = (title: string, message?: string) => {
    alert(`❌ ${title}${message ? ': ' + message : ''}`)
  }
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [dataLoaded, setDataLoaded] = useState({
    company: false,
    user: false,
    asaas: false
  })

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: '',
    tradeName: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'SP',
    zipCode: '',
    logo: '',
    website: '',
    // Campos DIMOB obrigatórios
    responsibleCpf: '',
    municipalityCode: ''
  })

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    theme: 'light',
    language: 'pt',
    dateFormat: 'DD/MM/YYYY',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo'
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    whatsappEnabled: true,
    contractExpiring: true,
    paymentDue: true,
    paymentOverdue: true,
    daysBefore: 5
  })

  const [financialSettings, setFinancialSettings] = useState<FinancialSettings>({
    // Configurações padrão para multa e juros
    penaltyRate: 2.0,          // 2% de multa
    dailyInterestRate: 0.033,  // 0.033% ao dia (1% ao mês)
    gracePeriodDays: 0,        // sem carência
    maxInterestDays: 365       // máximo 1 ano de juros
  })

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    pixKey: '',
    pixInstructions: 'Faça o PIX para a chave acima e envie o comprovante.',
    bankName: '',
    accountHolder: ''
  })

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: ''
  })

  const [apiSettings, setApiSettings] = useState<APISettings>({
    infosimplesApiKey: ''
  })

  const [asaasSettings, setAsaasSettings] = useState<AsaasSettings>({
    apiKey: '',
    enabled: false,
    walletId: ''
  })

  useEffect(() => {
    // Lazy load com cache - só carrega dados quando necessário e não carregados
    if ((activeTab === 'company' || activeTab === 'user') && !dataLoaded.company) {
      loadSettings()
      loadUserProfile()
    } else if (activeTab === 'asaas' && !dataLoaded.asaas) {
      // Carrega dados ASAAS apenas quando a aba é acessada e não carregados
      loadAsaasSettings()
    }
  }, [activeTab, dataLoaded])

  // Carregamento inicial mínimo
  useEffect(() => {
    if (session?.user) {
      // Carrega apenas dados essenciais inicialmente
      loadMinimalUserData()
    }
  }, [session])

  const loadMinimalUserData = async () => {
    try {
      // Apenas carrega nome e configurações básicas para renderização inicial
      setUserProfile(prev => ({
        ...prev,
        name: session?.user?.name || '',
        email: session?.user?.email || ''
      }))
    } catch (error) {
      console.error('Erro ao carregar dados mínimos:', error)
    }
  }

  const loadAsaasSettings = async () => {
    try {
      // Carrega apenas configurações ASAAS específicas
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.company) {
          setAsaasSettings({
            apiKey: data.company.asaasApiKey || '',
            enabled: data.company.asaasEnabled || false,
            walletId: data.company.asaasWalletId || ''
          })
        }
        setDataLoaded(prev => ({ ...prev, asaas: true }))
      }
    } catch (error) {
      console.error('Erro ao carregar configurações ASAAS:', error)
    }
  }

  const loadSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings')
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.company) {
          console.log('Loading company data:', data.company)
          setCompanySettings(prev => ({
            ...prev,
            ...data.company
          }))
        }
        if (data.system) {
          setSystemSettings(prev => ({
            ...prev,
            ...data.system
          }))
        }
        if (data.notifications) {
          setNotificationSettings(prev => ({
            ...prev,
            ...data.notifications
          }))
        }
        if (data.financial) {
          console.log('Loading financial data:', data.financial)
          setFinancialSettings(prev => ({
            ...prev,
            ...data.financial
          }))
        }
        if (data.payment) {
          setPaymentSettings(prev => ({
            ...prev,
            ...data.payment
          }))
        }
        if (data.api) {
          setApiSettings(prev => ({
            ...prev,
            ...data.api
          }))
        }
      } else {
        const errorText = await response.text()
        console.error('Load failed:', response.status, errorText)
      }
      setDataLoaded(prev => ({ ...prev, company: true }))
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserProfile = async () => {
    try {
      if (session?.user) {
        setUserProfile({
          name: session.user.name || '',
          email: session.user.email || '',
          phone: '' // Will be loaded from API
        })
        
        // Load phone from database
        const response = await fetch('/api/users/profile')
        if (response.ok) {
          const data = await response.json()
          if (data.phone) {
            setUserProfile(prev => ({ ...prev, phone: data.phone }))
          }
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  // Funções de salvamento individuais
  const saveCompanySettings = async () => {
    try {
      setSaveStatus('saving')
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: companySettings })
      })
      
      if (response.ok) {
        showSuccess('Dados da empresa salvos!')
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        const errorData = await response.json()
        showError('Erro ao salvar empresa', errorData.error)
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Erro:', error)
      showError('Erro ao salvar empresa')
      setSaveStatus('error')
    }
  }

  const saveSystemSettings = async () => {
    try {
      setSaveStatus('saving')
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: systemSettings })
      })
      
      if (response.ok) {
        showSuccess('Configurações do sistema salvas!')
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        showError('Erro ao salvar sistema')
        setSaveStatus('error')
      }
    } catch (error) {
      showError('Erro ao salvar sistema')
      setSaveStatus('error')
    }
  }

  const saveNotificationSettings = async () => {
    try {
      setSaveStatus('saving')
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: notificationSettings })
      })
      
      if (response.ok) {
        showSuccess('Configurações de notificação salvas!')
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        showError('Erro ao salvar notificações')
        setSaveStatus('error')
      }
    } catch (error) {
      showError('Erro ao salvar notificações')
      setSaveStatus('error')
    }
  }

  const saveFinancialSettings = async () => {
    try {
      setSaveStatus('saving')
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financial: financialSettings })
      })
      
      if (response.ok) {
        showSuccess('Configurações financeiras salvas!')
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        showError('Erro ao salvar configurações financeiras')
        setSaveStatus('error')
      }
    } catch (error) {
      showError('Erro ao salvar configurações financeiras')
      setSaveStatus('error')
    }
  }

  const savePaymentSettings = async () => {
    try {
      setSaveStatus('saving')
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment: paymentSettings })
      })
      
      if (response.ok) {
        showSuccess('Configurações PIX salvas!')
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        showError('Erro ao salvar PIX')
        setSaveStatus('error')
      }
    } catch (error) {
      showError('Erro ao salvar PIX')
      setSaveStatus('error')
    }
  }

  const saveApiSettings = async () => {
    try {
      setSaveStatus('saving')
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api: apiSettings })
      })
      
      if (response.ok) {
        showSuccess('Configurações de API salvas!')
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        showError('Erro ao salvar APIs')
        setSaveStatus('error')
      }
    } catch (error) {
      showError('Erro ao salvar APIs')
      setSaveStatus('error')
    }
  }

  const saveUserProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userProfile.name,
          phone: userProfile.phone
        }),
      })
      
      if (response.ok) {
        showSuccess('Perfil atualizado!', 'Suas informações foram salvas com sucesso.')
      } else {
        const errorData = await response.json()
        showError('Erro ao salvar perfil', errorData.error || 'Tente novamente.')
      }
    } catch (error) {
      console.error('Error saving user profile:', error)
      showError('Erro ao salvar perfil', 'Verifique sua conexão e tente novamente.')
    }
  }

  const saveSettings = async () => {
    setSaveStatus('saving')
    try {
      console.log('=== FRONTEND SAVING ===')
      console.log('Company settings:', companySettings)
      console.log('Financial settings:', financialSettings)
      
      const payload = {
        company: companySettings,
        system: systemSettings,
        notifications: notificationSettings,
        financial: financialSettings,
        payment: paymentSettings,
        api: apiSettings
      }
      
      console.log('Sending payload:', payload)
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Save successful:', result)
        setSaveStatus('saved')
        // Recarregar configurações após salvar
        console.log('Reloading settings...')
        await loadSettings()
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        const errorText = await response.text()
        console.error('Save failed:', response.status, errorText)
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    
    if (numbers.length === 0) return ''
    if (numbers.length === 1) return `(${numbers}`
    if (numbers.length === 2) return `(${numbers}) `
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    
    if (numbers.length === 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    } else if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    } else if (numbers.length > 6) {
      if (numbers.length > 7) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
      } else {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
      }
    }
    
    return numbers
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 5) return numbers.replace(/(\d{2})(\d{0,3})/, '$1.$2')
    if (numbers.length <= 8) return numbers.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3')
    if (numbers.length <= 12) return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4')
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5')
  }

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8)
    if (numbers.length <= 5) return numbers
    return numbers.replace(/(\d{5})(\d{0,3})/, '$1-$2')
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return numbers.replace(/(\d{3})(\d{0,3})/, '$1.$2')
    if (numbers.length <= 9) return numbers.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4')
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // File validation
    if (!file.type.startsWith('image/')) {
      showError('Por favor, selecione apenas arquivos de imagem')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Arquivo muito grande (máximo 5MB)')
      return
    }

    try {
      setSaveStatus('saving')
      
      // Convert to base64
      const logoData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result)
          } else {
            reject(new Error('Erro ao converter arquivo'))
          }
        }
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
        reader.readAsDataURL(file)
      })

      // Update logo state
      setCompanySettings(prev => ({ ...prev, logo: logoData }))
      // Update global logo context
      setCompanyLogo(logoData)
      showSuccess('Logo carregado com sucesso!')
      
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error)
      showError('Erro ao processar imagem')
    } finally {
      setSaveStatus('idle')
      event.target.value = '' // Clear input
    }
  }

  // Verificar se é admin (assumindo que o primeiro usuário da empresa é admin)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/users/profile')
      if (response.ok) {
        const userData = await response.json()
        // Verificar se o usuário tem role de ADMIN
        // Fallback: se não há role definida, considerar admin se for o primeiro usuário (id === '1')
        // ou se o email contém 'admin'
        const isExplicitAdmin = userData.role === 'ADMIN'
        const isFallbackAdmin = userData.id === '1' || userData.email?.toLowerCase().includes('admin')
        setIsAdmin(isExplicitAdmin || isFallbackAdmin)
      } else {
        // Se a API não responder, por segurança, negar acesso
        setIsAdmin(false)
      }
    } catch (error) {
      console.log('Erro ao verificar status de admin:', error)
      setIsAdmin(false) // Por segurança, negar acesso se não conseguir verificar
    }
  }

  const tabs = [
    { id: 'profile', name: 'Meu Perfil', icon: User },
    { id: 'company', name: 'Empresa', icon: Building2 },
    { id: 'system', name: 'Sistema', icon: Palette },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'financial', name: 'Financeiro', icon: DollarSign },
    { id: 'asaas', name: 'ASAAS Split', icon: DollarSign },
    ...(isAdmin ? [{ id: 'payment', name: 'Pagamento PIX', icon: DollarSign }] : []),
    { id: 'apis', name: 'APIs Externas', icon: SettingsIcon },
    { id: 'integrations', name: 'Integrações', icon: Link },
    { id: 'security', name: 'Segurança', icon: Shield },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie as configurações do sistema e da empresa
            </p>
          </div>
          {activeTab === 'profile' && (
            <button 
              onClick={saveUserProfile}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 text-white rounded-lg transition-colors"
              style={{backgroundColor: '#f63c6a'}}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement
                target.style.backgroundColor = '#e03659'
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement
                target.style.backgroundColor = '#f63c6a'
              }}
            >
              <Save className="w-5 h-5 mr-2" />
              Salvar Perfil
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {/* Desktop Tabs */}
          <div className="hidden lg:block border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Mobile Tab Selector */}
          <div className="lg:hidden border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:border-transparent"
              style={{
                '--focus-ring-color': '#f63c6a',
                '--focus-border-color': 'transparent'
              } as React.CSSProperties}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 0 0 2px rgba(255, 67, 82, 0.2)'
                e.target.style.borderColor = '#f63c6a'
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = ''
                e.target.style.borderColor = '#d1d5db'
              }}
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tab Content */}
          <div className="p-4 lg:p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Meu Perfil</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Atualize suas informações pessoais. O telefone é importante para receber notificações de parceria.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:border-transparent"
                      style={{
                        '--focus-ring-color': '#f63c6a',
                        '--focus-border-color': 'transparent'
                      } as React.CSSProperties}
                      onFocus={(e) => {
                        e.target.style.boxShadow = '0 0 0 2px rgba(255, 67, 82, 0.2)'
                        e.target.style.borderColor = '#f63c6a'
                      }}
                      onBlur={(e) => {
                        e.target.style.boxShadow = ''
                        e.target.style.borderColor = '#d1d5db'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userProfile.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Telefone/WhatsApp *
                    </label>
                    <input
                      type="text"
                      value={userProfile.phone}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:border-transparent"
                      style={{
                        '--focus-ring-color': '#f63c6a',
                        '--focus-border-color': 'transparent'
                      } as React.CSSProperties}
                      onFocus={(e) => {
                        e.target.style.boxShadow = '0 0 0 2px rgba(255, 67, 82, 0.2)'
                        e.target.style.borderColor = '#f63c6a'
                      }}
                      onBlur={(e) => {
                        e.target.style.boxShadow = ''
                        e.target.style.borderColor = '#d1d5db'
                      }}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Seu telefone será usado para receber notificações de oportunidades de parceria
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 rounded-lg" style={{backgroundColor: '#fef2f2'}}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <User className="w-5 h-5" style={{color: '#f63c6a'}} />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium" style={{color: '#f63c6a'}}>
                        Por que o telefone é importante?
                      </h3>
                      <div className="mt-2 text-sm text-gray-700">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Receber notificações de oportunidades de parceria</li>
                          <li>Outros corretores podem entrar em contato diretamente</li>
                          <li>Facilita a comunicação para negociar parcerias</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'company' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Informações da Empresa</h3>
                  <button 
                    onClick={saveCompanySettings}
                    disabled={saveStatus === 'saving'}
                    className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                      saveStatus === 'saved' 
                        ? 'bg-green-600 text-white' 
                        : saveStatus === 'error'
                        ? 'bg-red-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50`}
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo!' : saveStatus === 'error' ? 'Erro' : 'Salvar Empresa'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Razão Social *
                    </label>
                    <input
                      type="text"
                      value={companySettings.name}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      value={companySettings.tradeName}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, tradeName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CNPJ *
                    </label>
                    <input
                      type="text"
                      value={companySettings.document}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, document: formatCNPJ(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={18}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="text"
                      value={companySettings.phone}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={15}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={companySettings.website}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://exemplo.com"
                    />
                  </div>
                </div>

                {/* Seção DIMOB */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      📄 Configurações DIMOB (Receita Federal)
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Campos obrigatórios para gerar o arquivo DIMOB da Receita Federal
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        CPF do Responsável pela Empresa na RFB *
                      </label>
                      <input
                        type="text"
                        value={companySettings.responsibleCpf}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, responsibleCpf: formatCPF(e.target.value) }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        CPF da pessoa responsável pela empresa perante à Receita Federal
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Código do Município (IBGE) *
                      </label>
                      <input
                        type="text"
                        value={companySettings.municipalityCode}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, municipalityCode: e.target.value.replace(/\D/g, '').slice(0, 7) }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="5300108"
                        maxLength={7}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Código IBGE do município da empresa (ex: 5300108 para Brasília)
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <SettingsIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                          ℹ️ Sobre os campos DIMOB
                        </h5>
                        <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                          <p><strong>DIMOB:</strong> Declaração obrigatória para imobiliárias na Receita Federal</p>
                          <p><strong>CPF Responsável:</strong> Pessoa física responsável pela empresa (geralmente sócio ou administrador)</p>
                          <p><strong>Código IBGE:</strong> Consulte em <a href="https://cidades.ibge.gov.br/" target="_blank" className="underline">cidades.ibge.gov.br</a></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Endereço *
                  </label>
                  <input
                    type="text"
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      value={companySettings.city}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado *
                    </label>
                    <select
                      value={companySettings.state}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="AC">Acre (AC)</option>
                      <option value="AL">Alagoas (AL)</option>
                      <option value="AP">Amapá (AP)</option>
                      <option value="AM">Amazonas (AM)</option>
                      <option value="BA">Bahia (BA)</option>
                      <option value="CE">Ceará (CE)</option>
                      <option value="DF">Distrito Federal (DF)</option>
                      <option value="ES">Espírito Santo (ES)</option>
                      <option value="GO">Goiás (GO)</option>
                      <option value="MA">Maranhão (MA)</option>
                      <option value="MT">Mato Grosso (MT)</option>
                      <option value="MS">Mato Grosso do Sul (MS)</option>
                      <option value="MG">Minas Gerais (MG)</option>
                      <option value="PA">Pará (PA)</option>
                      <option value="PB">Paraíba (PB)</option>
                      <option value="PR">Paraná (PR)</option>
                      <option value="PE">Pernambuco (PE)</option>
                      <option value="PI">Piauí (PI)</option>
                      <option value="RJ">Rio de Janeiro (RJ)</option>
                      <option value="RN">Rio Grande do Norte (RN)</option>
                      <option value="RS">Rio Grande do Sul (RS)</option>
                      <option value="RO">Rondônia (RO)</option>
                      <option value="RR">Roraima (RR)</option>
                      <option value="SC">Santa Catarina (SC)</option>
                      <option value="SP">São Paulo (SP)</option>
                      <option value="SE">Sergipe (SE)</option>
                      <option value="TO">Tocantins (TO)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CEP *
                    </label>
                    <input
                      type="text"
                      value={companySettings.zipCode}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, zipCode: formatZipCode(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={9}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Logo da Empresa
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                      {companySettings.logo ? (
                        <img src={companySettings.logo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Building2 className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Fazer Upload
                      </label>
                      {companySettings.logo && (
                        <button
                          onClick={() => setCompanySettings(prev => ({ ...prev, logo: '' }))}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Remover Logo
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Formato aceito: PNG, JPG, JPEG. Tamanho máximo: 2MB
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configurações do Sistema</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tema
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={theme === 'light'}
                          onChange={(e) => setTheme(e.target.value as any)}
                          className="mr-2"
                        />
                        <Sun className="w-4 h-4 mr-2" />
                        Claro
                      </label>
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={theme === 'dark'}
                          onChange={(e) => setTheme(e.target.value as any)}
                          className="mr-2"
                        />
                        <Moon className="w-4 h-4 mr-2" />
                        Escuro
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Idioma
                    </label>
                    <select
                      value={systemSettings.language}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, language: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pt">Português (Brasil)</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Formato de Data
                    </label>
                    <select
                      value={systemSettings.dateFormat}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, dateFormat: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Moeda
                    </label>
                    <select
                      value={systemSettings.currency}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, currency: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="BRL">Real Brasileiro (R$)</option>
                      <option value="USD">Dólar Americano ($)</option>
                      <option value="EUR">Euro (€)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configurações de Notificações</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Notificações por Email</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Enviar notificações automáticas por email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailEnabled}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Notificações por WhatsApp</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Enviar lembretes por WhatsApp</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.whatsappEnabled}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, whatsappEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Contratos Vencendo</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Alertar quando contratos estão próximos do vencimento</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.contractExpiring}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, contractExpiring: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Pagamentos Vencendo</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Lembrar inquilinos sobre pagamentos próximos do vencimento</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.paymentDue}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, paymentDue: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Pagamentos em Atraso</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Notificar sobre pagamentos vencidos</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.paymentOverdue}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, paymentOverdue: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dias de Antecedência para Notificações
                  </label>
                  <select
                    value={notificationSettings.daysBefore}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, daysBefore: parseInt(e.target.value) }))}
                    className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 dia</option>
                    <option value={3}>3 dias</option>
                    <option value={5}>5 dias</option>
                    <option value={7}>7 dias</option>
                    <option value={15}>15 dias</option>
                    <option value={30}>30 dias</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configurações de Multa e Juros para Atrasos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Multa por Atraso (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={financialSettings.penaltyRate}
                      onChange={(e) => setFinancialSettings(prev => ({ ...prev, penaltyRate: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 2.0 para 2%"
                    />
                    <p className="text-xs text-gray-500 mt-1">Porcentagem sobre o valor do aluguel aplicada uma única vez</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Juros por Dia (%)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="10"
                      value={financialSettings.dailyInterestRate}
                      onChange={(e) => setFinancialSettings(prev => ({ ...prev, dailyInterestRate: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 0.033 para 1% ao mês"
                    />
                    <p className="text-xs text-gray-500 mt-1">Juros aplicados diariamente sobre o valor do aluguel</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Período de Carência (dias)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={financialSettings.gracePeriodDays}
                      onChange={(e) => setFinancialSettings(prev => ({ ...prev, gracePeriodDays: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 5 para 5 dias"
                    />
                    <p className="text-xs text-gray-500 mt-1">Dias após o vencimento antes de aplicar multa e juros</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Máximo de Dias para Juros
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      value={financialSettings.maxInterestDays}
                      onChange={(e) => setFinancialSettings(prev => ({ ...prev, maxInterestDays: parseInt(e.target.value) || 365 }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 365 para 1 ano"
                    />
                    <p className="text-xs text-gray-500 mt-1">Máximo de dias para cálculo de juros (evita valores excessivos)</p>
                  </div>
                </div>

                {/* Preview dos Cálculos */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Preview de Cálculo</h5>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p>• <strong>Aluguel de R$ 1.000,00</strong> com <strong>10 dias de atraso:</strong></p>
                    {financialSettings.gracePeriodDays > 0 && (
                      <p className="ml-4 text-orange-600 dark:text-orange-300">
                        - Período de carência: {financialSettings.gracePeriodDays} dias
                      </p>
                    )}
                    {10 <= financialSettings.gracePeriodDays ? (
                      <p className="ml-4 text-green-600 dark:text-green-300">
                        - Ainda no período de carência - Sem multa nem juros
                      </p>
                    ) : (
                      <>
                        <p className="ml-4">- Dias efetivos para cobrança: {Math.max(0, 10 - financialSettings.gracePeriodDays)} dias</p>
                        <p className="ml-4">- Multa: R$ {(1000 * (financialSettings.penaltyRate / 100)).toFixed(2)}</p>
                        <p className="ml-4">- Juros: R$ {(1000 * (financialSettings.dailyInterestRate / 100) * Math.max(0, 10 - financialSettings.gracePeriodDays)).toFixed(2)}</p>
                        <p className="ml-4">- <strong>Total: R$ {(1000 + (1000 * (financialSettings.penaltyRate / 100)) + (1000 * (financialSettings.dailyInterestRate / 100) * Math.max(0, 10 - financialSettings.gracePeriodDays))).toFixed(2)}</strong></p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configurações de Pagamento PIX</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure suas informações de PIX para que assistentes e clientes possam realizar pagamentos.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Chave PIX *
                    </label>
                    <input
                      type="text"
                      value={paymentSettings.pixKey}
                      onChange={(e) => {
                        const value = e.target.value
                        let formattedValue = value
                        
                        // Formatação simples baseada apenas no comprimento de números
                        const numbersOnly = value.replace(/\D/g, '')
                        
                        if (numbersOnly.length === 11 && /^\d+$/.test(value.replace(/\D/g, ''))) {
                          // CPF: 000.000.000-00
                          formattedValue = numbersOnly.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                        } else if (numbersOnly.length === 14 && /^\d+$/.test(value.replace(/\D/g, ''))) {
                          // CNPJ: 00.000.000/0000-00
                          formattedValue = numbersOnly.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
                        } else if ((numbersOnly.length === 10 || numbersOnly.length === 11) && /^\d+$/.test(value.replace(/\D/g, ''))) {
                          // Telefone
                          if (numbersOnly.length === 11) {
                            formattedValue = numbersOnly.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                          } else {
                            formattedValue = numbersOnly.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
                          }
                        }
                        
                        setPaymentSettings(prev => ({ ...prev, pixKey: formattedValue }))
                      }}
                      placeholder="Email, CPF, CNPJ, telefone ou chave aleatória"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Titular da Conta
                    </label>
                    <input
                      type="text"
                      value={paymentSettings.accountHolder}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, accountHolder: e.target.value }))}
                      placeholder="Nome do titular da conta PIX"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Banco
                    </label>
                    <input
                      type="text"
                      value={paymentSettings.bankName}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="Nome do banco (opcional)"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Instruções de Pagamento
                    </label>
                    <textarea
                      value={paymentSettings.pixInstructions}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, pixInstructions: e.target.value }))}
                      placeholder="Instruções que serão mostradas aos clientes"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {paymentSettings.pixKey && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        📋 Informações de PIX para Compartilhar:
                      </h4>
                      <a 
                        href="/pix" 
                        target="_blank"
                        className="text-blue-600 hover:text-blue-700 text-xs underline"
                      >
                        Ver página completa →
                      </a>
                    </div>
                    <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <p><strong>Chave PIX:</strong> {paymentSettings.pixKey}</p>
                      {paymentSettings.accountHolder && <p><strong>Titular:</strong> {paymentSettings.accountHolder}</p>}
                      {paymentSettings.bankName && <p><strong>Banco:</strong> {paymentSettings.bankName}</p>}
                      <p><strong>Instruções:</strong> {paymentSettings.pixInstructions}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        💡 <strong>Como usar:</strong> Compartilhe o link <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">app.gprop.com.br/pix</code> com clientes ou assistentes para que vejam suas informações de pagamento.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'apis' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">APIs Externas</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure as chaves de API para serviços externos utilizados pelo sistema.
                </p>
                
                <div className="space-y-6">
                  {/* InfoSimples API */}
                  <div className="p-6 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">InfoSimples IPTU</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          API para consulta de débitos de IPTU em prefeituras brasileiras
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        apiSettings.infosimplesApiKey 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {apiSettings.infosimplesApiKey ? 'Configurado' : 'Não Configurado'}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          API Key da InfoSimples
                        </label>
                        <input
                          type="password"
                          value={apiSettings.infosimplesApiKey}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, infosimplesApiKey: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:border-transparent"
                          style={{
                            '--focus-ring-color': '#f63c6a',
                            '--focus-border-color': 'transparent'
                          } as React.CSSProperties}
                          onFocus={(e) => {
                            e.target.style.boxShadow = '0 0 0 2px rgba(255, 67, 82, 0.2)'
                            e.target.style.borderColor = '#f63c6a'
                          }}
                          onBlur={(e) => {
                            e.target.style.boxShadow = ''
                            e.target.style.borderColor = '#d1d5db'
                          }}
                          placeholder="Insira sua API key da InfoSimples"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Mantenha esta chave em segurança. Ela será usada para consultar débitos de IPTU.
                        </p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                          ℹ️ Sobre a API InfoSimples
                        </h5>
                        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                          <p><strong>Funcionalidade:</strong> Consulta débitos de IPTU em tempo real</p>
                          <p><strong>Preço:</strong> R$ 0,05 a R$ 0,20 por consulta (dependendo do volume)</p>
                          <p><strong>Taxa mínima:</strong> R$ 100/mês</p>
                          <p><strong>Conta teste:</strong> R$ 100 grátis para novos usuários</p>
                          <div className="mt-3">
                            <a 
                              href="https://infosimples.com/consultas/pref-sp-sao-paulo-debitos-iptu/" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline text-sm"
                            >
                              📖 Documentação da API →
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Integrações</h3>
                
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">API de Boletos</h4>
                        <p className="text-sm text-gray-500">Configurar geração automática de boletos</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Não Configurado
                      </span>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">API dos Correios</h4>
                        <p className="text-sm text-gray-500">Buscar endereços por CEP automaticamente</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Configurado
                      </span>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">WhatsApp Business API</h4>
                        <p className="text-sm text-gray-500">Enviar notificações via WhatsApp</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Não Configurado
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'asaas' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium" style={{color: '#f63c6a'}}>🏦 ASAAS Split de Pagamentos</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure o split automático de pagamentos. O ASAAS dividirá automaticamente o aluguel entre proprietário e imobiliária.
                </p>
                
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-green-900 dark:text-green-100">Como Funciona o Split Automático:</h4>
                      <div className="mt-3 text-sm text-green-800 dark:text-green-200 space-y-2">
                        <p>✅ <strong>Inquilino paga boleto/PIX</strong> normalmente</p>
                        <p>💰 <strong>ASAAS divide automaticamente</strong> o valor</p>
                        <p>🏠 <strong>Proprietário recebe</strong> o valor do aluguel (descontando sua comissão)</p>
                        <p>🏢 <strong>Imobiliária recebe</strong> a comissão configurada no contrato</p>
                        <p>📊 <strong>Tudo automático</strong> - sem trabalho manual!</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">Status da Configuração</h4>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        asaasSettings.enabled && asaasSettings.apiKey
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {asaasSettings.enabled && asaasSettings.apiKey ? '✅ Configurado' : '⚠️ Não Configurado'}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          API Key do ASAAS *
                        </label>
                        <input
                          type="password"
                          value={asaasSettings.apiKey}
                          onChange={(e) => setAsaasSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:border-transparent"
                          style={{
                            '--focus-ring-color': '#f63c6a',
                            '--focus-border-color': 'transparent'
                          } as React.CSSProperties}
                          onFocus={(e) => {
                            e.target.style.boxShadow = '0 0 0 2px rgba(246, 60, 106, 0.2)'
                            e.target.style.borderColor = '#f63c6a'
                          }}
                          onBlur={(e) => {
                            e.target.style.boxShadow = ''
                            e.target.style.borderColor = '#d1d5db'
                          }}
                          placeholder="Cole sua API Key do ASAAS aqui"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Obtenha sua API Key no painel do ASAAS em Minha Conta → Integrações → API
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/asaas/test-connection', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ asaasApiKey: asaasSettings.apiKey })
                              })
                              const result = await response.json()
                              
                              if (result.success) {
                                setAsaasSettings(prev => ({ 
                                  ...prev, 
                                  enabled: true, 
                                  walletId: result.accountInfo.walletId 
                                }))
                                showSuccess('ASAAS Conectado e Salvo!', `Conta: ${result.accountInfo.name}`)
                                
                                // Recarregar configurações para confirmar que foi salvo
                                setTimeout(() => {
                                  loadAsaasSettings()
                                }, 1000)
                              } else {
                                showError('Erro na Conexão', result.message)
                              }
                            } catch (error) {
                              showError('Erro', 'Falha ao testar conexão')
                            }
                          }}
                          disabled={!asaasSettings.apiKey}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🔄 Testar Conexão
                        </button>
                        
                        {asaasSettings.enabled && (
                          <span className="text-sm text-green-600 font-medium">
                            ✅ Conectado com sucesso!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {asaasSettings.enabled && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
                        🎯 Próximos Passos para Usar o Split:
                      </h4>
                      <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                        <div className="flex items-start space-x-3">
                          <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">1</span>
                          <p><strong>Configure contas dos proprietários:</strong> Vá em "Proprietários" e clique em "Configurar ASAAS" para cada um</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">2</span>
                          <p><strong>Gere boletos com split:</strong> Nos contratos, use "Gerar Boleto com Split" em vez do botão normal</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">3</span>
                          <p><strong>Automático:</strong> Quando o inquilino pagar, o ASAAS dividirá automaticamente o valor!</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-yellow-900 dark:text-yellow-100 mb-3">
                      ⚠️ Importante - Configuração ASAAS:
                    </h4>
                    <div className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
                      <p>• <strong>Ambiente:</strong> Use o ambiente de produção do ASAAS para transações reais</p>
                      <p>• <strong>Webhook:</strong> Configure no ASAAS o webhook: <code className="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">https://app.gprop.com.br/api/asaas/webhook</code></p>
                      <p>• <strong>Taxas:</strong> O ASAAS cobra ~1,8% por boleto + R$ 2,00 por transação PIX</p>
                      <p>• <strong>Split:</strong> Não há taxa adicional para o split - é gratuito!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configurações de Segurança</h3>
                
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Política de Senhas</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Mínimo de 8 caracteres</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Incluir números</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Incluir caracteres especiais</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Expiração de senha (90 dias)</span>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Autenticação de Dois Fatores</h4>
                    <p className="text-sm text-gray-500 mb-3">Adicione uma camada extra de segurança</p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                      Configurar 2FA
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Sessões Ativas</h4>
                    <p className="text-sm text-gray-500 mb-3">Gerencie dispositivos conectados</p>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                      Ver Sessões
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Toast Notifications - Temporarily disabled */}
        {/* <ToastContainer toasts={toasts} onRemove={removeToast} /> */}
      </div>
    </DashboardLayout>
  )
}