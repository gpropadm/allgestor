'use client'

import { useState, useEffect } from 'react'
import { 
  Home, 
  History, 
  Phone, 
  Lock,
  Eye,
  EyeOff,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  X,
  User,
  Bell,
  Receipt,
  Settings,
  MessageCircle,
  LogOut,
  Zap,
  Calendar
} from 'lucide-react'

interface ClientContract {
  id: string
  property: {
    title: string
    address: string
    propertyType: string
  }
  rentAmount: number
  startDate: string
  endDate: string
  tenant: {
    name: string
    phone: string
    document: string
  }
  payments: Array<{
    id: string
    amount: number
    dueDate: string
    status: 'PENDING' | 'PAID' | 'OVERDUE'
    boletoUrl?: string
    paidDate?: string
  }>
}

export default function ClientPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginData, setLoginData] = useState({
    phone: '',
    document: ''
  })
  const [contract, setContract] = useState<ClientContract | null>(null)
  const [error, setError] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Por enquanto, simular login bem-sucedido para demonstração
      // TODO: Implementar API real quando resolver problema de deploy
      
      console.log('🧪 Simulando login para demo:', loginData.phone);
      
      // Simular dados de contrato para demonstração
      const mockContract = {
        id: "demo-contract-001",
        property: {
          title: "Casa Demo - 3 quartos",
          address: "Rua das Flores, 123 - Centro",
          propertyType: "HOUSE",
          owner: {
            name: "Proprietário Demo",
            email: "proprietario@demo.com",
            phone: "(61) 99999-0000"
          }
        },
        rentAmount: 1400,
        startDate: "2025-01-01T00:00:00Z",
        endDate: "2025-12-31T23:59:59Z",
        tenant: {
          name: "Cliente Demo",
          phone: loginData.phone,
          document: loginData.document
        },
        payments: [
          {
            id: "payment-001",
            amount: 1400,
            dueDate: "2025-08-10T00:00:00Z",
            status: "PENDING" as const,
            boletoUrl: "https://exemplo.com/boleto1.pdf"
          },
          {
            id: "payment-002", 
            amount: 1400,
            dueDate: "2025-07-10T00:00:00Z",
            status: "PAID" as const,
            paidDate: "2025-07-08T00:00:00Z"
          },
          {
            id: "payment-003",
            amount: 1400,
            dueDate: "2025-06-10T00:00:00Z", 
            status: "PAID" as const,
            paidDate: "2025-06-05T00:00:00Z"
          }
        ]
      };

      // Simular resposta da API
      const result = {
        success: true,
        message: 'Login demo realizado com sucesso',
        contract: mockContract
      };

      if (result.success) {
        setContract(result.contract)
        setIsLoggedIn(true)
        localStorage.setItem('clientAuth', JSON.stringify(result.contract))
      } else {
        setError(result.message || 'Dados não encontrados')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setContract(null)
    localStorage.removeItem('clientAuth')
    setLoginData({ phone: '', document: '' })
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }


  // Verificar se já está logado ao carregar
  useEffect(() => {
    const savedAuth = localStorage.getItem('clientAuth')
    if (savedAuth) {
      try {
        const contractData = JSON.parse(savedAuth)
        setContract(contractData)
        setIsLoggedIn(true)
      } catch (error) {
        localStorage.removeItem('clientAuth')
      }
    }
  }, [])

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Portal do Cliente</h1>
            <p className="text-gray-600">Acesse seus boletos e informações</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  required
                  placeholder="(11) 99999-9999"
                  value={loginData.phone}
                  onChange={(e) => setLoginData({...loginData, phone: formatPhone(e.target.value)})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={15}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPF
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="000.000.000-00"
                  value={loginData.document}
                  onChange={(e) => setLoginData({...loginData, document: formatDocument(e.target.value)})}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={14}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !loginData.phone || !loginData.document}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Problemas para acessar? Entre em contato com a imobiliária.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  const nextPayment = contract.payments
    .filter(p => p.status === 'PENDING')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]

  const recentPayments = contract.payments
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 6)

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'boletos', label: 'Meus Boletos', icon: Receipt },
    { id: 'historico', label: 'Histórico', icon: History },
    { id: 'perfil', label: 'Meu Perfil', icon: User },
    { id: 'manutencoes', label: 'Manutenções', icon: Settings },
    { id: 'contato', label: 'Contato', icon: MessageCircle },
  ]

  const renderContent = () => {
    // Renderizar o header para todas as seções
    const renderSectionWithHeader = () => {
      const sectionTitles: { [key: string]: string } = {
        'dashboard': 'O que deseja fazer?',
        'boletos': 'Visualize seus boletos',
        'historico': 'Acompanhe seus pagamentos', 
        'perfil': 'Seus dados pessoais',
        'manutencoes': 'Solicite reparos',
        'contato': 'Entre em contato'
      }
      
      const sectionContent = () => {
        switch (activeSection) {
          case 'dashboard':
            return <DashboardContent contract={contract} nextPayment={nextPayment} setActiveSection={setActiveSection} />
          case 'boletos':
            return <BoletosContent contract={contract} />
          case 'historico':
            return <HistoricoContent payments={recentPayments} />
          case 'perfil':
            return <PerfilContent contract={contract} />
          case 'manutencoes':
            return <ManutencoesContent />
          case 'contato':
            return <ContatoContent />
          default:
            return <DashboardContent contract={contract} nextPayment={nextPayment} setActiveSection={setActiveSection} />
        }
      }
      
      if (activeSection === 'dashboard') {
        return sectionContent()
      }
      
      return (
        <div>
          {/* Header para outras seções */}
          <div className="bg-slate-700 px-6 py-4 -mx-6 -mt-6 mb-6">
            <div className="text-white">
              <h2 className="text-xl font-semibold mb-1">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h2>
              <p className="text-slate-300">{sectionTitles[activeSection]}</p>
            </div>
          </div>
          {sectionContent()}
        </div>
      )
    }
    
    return renderSectionWithHeader()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* App Header - Dark */}
      <div className="bg-slate-700 px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/30"
            >
              <div className="w-4 h-4 flex flex-col justify-between">
                <span className={`h-0.5 w-full bg-white rounded transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                }`}></span>
                <span className={`h-0.5 w-full bg-white rounded transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0' : ''
                }`}></span>
                <span className={`h-0.5 w-full bg-white rounded transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                }`}></span>
              </div>
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-white font-bold text-lg">Portal</h1>
            <p className="text-slate-300 text-sm">Cliente</p>
          </div>
        </div>
        
        <div className="text-white">
          <h2 className="text-xl font-semibold mb-1">Olá, {contract.tenant.name.split(' ')[0]}</h2>
          <p className="text-slate-300">O que deseja fazer?</p>
        </div>
      </div>

      {/* Sidebar Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-80 bg-slate-800 transform transition-transform duration-300 ease-in-out">
            <div className="p-6 pt-16">
              {/* Profile Section */}
              <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-slate-600">
                <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{contract.tenant.name}</h3>
                  <p className="text-slate-300 text-sm">Cliente</p>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="ml-auto p-2 rounded-lg hover:bg-slate-700 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Menu Items */}
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id)
                        setIsMenuOpen(false)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="w-full flex items-center space-x-3 text-white hover:bg-slate-700 rounded-lg p-3 transition-colors"
                    >
                      <Icon className="w-5 h-5 text-slate-300" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
                
                <div className="border-t border-slate-600 pt-4 mt-4">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 text-red-400 hover:bg-red-900/20 rounded-lg p-3 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sair</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-6 py-6 bg-white flex-1">
        {renderContent()}
      </div>
    </div>
  )
}

// Componentes das seções
function DashboardContent({ contract, nextPayment, setActiveSection }: { contract: ClientContract, nextPayment: any, setActiveSection: (section: string) => void }) {
  return (
    <div className="space-y-6">
      {/* Menu Grid - Estilo do exemplo */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Boletos */}
        <button 
          onClick={() => setActiveSection('boletos')}
          className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-600 hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3 mx-auto">
            <Receipt className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="font-semibold text-gray-800 text-sm">Boletos</h3>
        </button>
        
        {/* Histórico */}
        <button 
          onClick={() => setActiveSection('historico')}
          className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-600 hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3 mx-auto">
            <History className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="font-semibold text-gray-800 text-sm">Histórico</h3>
        </button>
        
        {/* Perfil */}
        <button 
          onClick={() => setActiveSection('perfil')}
          className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-600 hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3 mx-auto">
            <User className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="font-semibold text-gray-800 text-sm">Perfil</h3>
        </button>
        
        {/* Manutenções */}
        <button 
          onClick={() => setActiveSection('manutencoes')}
          className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-600 hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3 mx-auto">
            <Settings className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="font-semibold text-gray-800 text-sm">Manutenções</h3>
        </button>
        
      </div>
      
      {/* Contato - Full Width */}
      <button 
        onClick={() => setActiveSection('contato')}
        className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1"
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-800">Contato & Suporte</h3>
        </div>
      </button>
      
      {/* Ações rápidas */}
      <div className="mt-6">
        <h4 className="text-gray-600 font-medium mb-3 text-sm">Ações rápidas</h4>
        
        {/* Próximo Vencimento */}
        {nextPayment && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">Próximo vencimento</p>
                  <p className="text-gray-500 text-xs">
                    R$ {nextPayment.amount.toLocaleString('pt-BR')} - {new Date(nextPayment.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                  Ver Boleto
                </button>
                <button className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">
                  PIX
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Status */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">Status dos pagamentos</p>
                <p className="text-gray-500 text-xs">2 pagos, 1 pendente</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

function BoletosContent({ contract }: { contract: ClientContract }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">Meus Boletos</h2>
        <span className="text-slate-300 text-sm">{contract.payments.length} boletos</span>
      </div>
      
      <div className="space-y-3">
        {contract.payments.map((payment) => (
          <div key={payment.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  payment.status === 'PAID' ? 'bg-green-100' : payment.status === 'OVERDUE' ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  {payment.status === 'PAID' ? 
                    <CheckCircle className="w-4 h-4 text-green-600" /> :
                    payment.status === 'OVERDUE' ? 
                    <AlertCircle className="w-4 h-4 text-red-600" /> :
                    <Clock className="w-4 h-4 text-yellow-600" />
                  }
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">R$ {payment.amount.toLocaleString('pt-BR')}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  payment.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                  payment.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {payment.status === 'PAID' ? 'Pago' : payment.status === 'OVERDUE' ? 'Vencido' : 'Pendente'}
                </span>
                <button className="p-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors">
                  <Download className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {contract.payments.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum boleto encontrado</h3>
          <p className="text-gray-600">Os boletos aparecerão aqui quando forem gerados.</p>
        </div>
      )}
    </div>
  )
}

function HistoricoContent({ payments }: { payments: any[] }) {
  const sortedPayments = payments.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">Histórico</h2>
        <span className="text-slate-300 text-sm">{payments.length} registros</span>
      </div>
      
      <div className="space-y-3">
        {sortedPayments.map((payment) => (
          <div key={payment.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  payment.status === 'PAID' ? 'bg-green-500' : 
                  payment.status === 'OVERDUE' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-800 text-sm">R$ {payment.amount.toLocaleString('pt-BR')}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                payment.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                payment.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {payment.status === 'PAID' ? 'Pago' : payment.status === 'OVERDUE' ? 'Vencido' : 'Pendente'}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {payments.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <History className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum histórico</h3>
          <p className="text-gray-600">O histórico de pagamentos aparecerá aqui.</p>
        </div>
      )}
    </div>
  )
}

function PerfilContent({ contract }: { contract: ClientContract }) {
  return (
    <div className="space-y-4">
      {/* Personal Information */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Pessoais</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Nome</label>
            <p className="text-gray-900 font-medium">{contract.tenant.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Telefone</label>
            <p className="text-gray-900 font-medium">{contract.tenant.phone}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">CPF</label>
            <p className="text-gray-900 font-medium">{contract.tenant.document}</p>
          </div>
        </div>
      </div>

      {/* Property Information */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Imóvel</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Endereço</label>
            <p className="text-gray-900 font-medium flex items-center">
              <MapPin className="w-4 h-4 text-gray-500 mr-2" />
              {contract.property.address}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Valor do Aluguel</label>
            <p className="text-2xl font-bold text-gray-800">
              R$ {contract.rentAmount.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Início do Contrato</label>
              <p className="text-gray-900 font-medium">
                {new Date(contract.startDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Término do Contrato</label>
              <p className="text-gray-900 font-medium">
                {new Date(contract.endDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ManutencoesContent() {
  const [showForm, setShowForm] = useState(false)
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          {showForm ? 'Cancelar' : 'Nova Solicitação'}
        </button>
      </div>
      
      {/* Request Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Solicitar Manutenção</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Problema</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent">
                <option>Elétrica</option>
                <option>Hidráulica</option>
                <option>Pintura</option>
                <option>Estrutural</option>
                <option>Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
              <textarea 
                rows={4} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent" 
                placeholder="Descreva o problema em detalhes..."
              />
            </div>
            <button className="w-full bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors">
              Enviar Solicitação
            </button>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {!showForm && (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma manutenção ativa</h3>
          <p className="text-gray-600 mb-4">
            Você não possui solicitações de manutenção no momento.
          </p>
        </div>
      )}
    </div>
  )
}

function ContatoContent() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fale Conosco</h3>
        
        <div className="space-y-3">
          <button 
            onClick={() => window.open('https://wa.me/5561999990000', '_blank')}
            className="w-full flex items-center space-x-4 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">WhatsApp</p>
              <p className="text-sm text-gray-600">(61) 99999-0000</p>
            </div>
          </button>
          
          <button 
            onClick={() => window.open('tel:+556133334444', '_self')}
            className="w-full flex items-center space-x-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-600 flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Telefone</p>
              <p className="text-sm text-gray-600">(61) 3333-4444</p>
            </div>
          </button>
        </div>
      </div>
      
      {/* Business Hours */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Horário de Atendimento</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
            <span className="font-medium text-gray-700">Segunda - Sexta</span>
            <span className="font-semibold text-gray-900">8h às 18h</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
            <span className="font-medium text-gray-700">Sábados</span>
            <span className="font-semibold text-gray-900">9h às 13h</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
            <span className="font-medium text-gray-700">Domingos</span>
            <span className="font-medium text-gray-500">Fechado</span>
          </div>
        </div>
      </div>
      
      {/* Emergency Contact */}
      <div className="bg-red-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold">Emergência</h3>
        </div>
        <p className="mb-4 text-red-100">
          Para emergências, entre em contato imediatamente:
        </p>
        <button 
          onClick={() => window.open('tel:+556199999000', '_self')}
          className="flex items-center space-x-3 bg-white/20 px-4 py-3 rounded-xl hover:bg-white/30 transition-colors"
        >
          <Phone className="w-5 h-5" />
          <span className="font-semibold">(61) 99999-0000</span>
        </button>
      </div>
    </div>
  )
}