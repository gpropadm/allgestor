'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Building2,
  Users,
  FileText,
  Settings,
  Menu,
  X,
  LayoutDashboard,
  Building,
  User,
  Receipt,
  Calculator,
  Zap,
  UserPlus,
  Power,
  TrendingDown,
  CreditCard,
  Shield,
  Wallet,
  TestTube,
  Bot,
  BarChart3,
  TrendingUp,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Bell,
  DollarSign,
  Split,
  Plug,
  Link2,
  ShieldCheck,
  Briefcase
} from 'lucide-react'

// Menu hierárquico estilo Discord/Slack
const menuStructure = [
  // Itens principais (não agrupados)
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Bot, label: '🤖 Assistente IA', href: '/ai-assistant', featured: true },
  { icon: TrendingUp, label: '📊 Pipeline Vendas', href: '/sales-pipeline', featured: true },
  { icon: BarChart3, label: '📈 Analytics', href: '/analytics', featured: true },

  // Categoria: Gestão
  {
    type: 'category',
    icon: Briefcase,
    label: 'Gestão',
    children: [
      { icon: Users, label: 'Proprietários', href: '/owners' },
      { icon: Building, label: 'Imóveis', href: '/properties' },
      { icon: User, label: 'Inquilinos', href: '/tenants' },
      { icon: FileText, label: 'Contratos', href: '/contracts' },
      { icon: Zap, label: 'Leads', href: '/leads' },
    ]
  },

  // Categoria: Financeiro
  {
    type: 'category',
    icon: DollarSign,
    label: 'Financeiro',
    children: [
      { icon: Receipt, label: 'Pagamentos', href: '/payments' },
      { icon: FileText, label: '🧾 Recibos', href: '/recibos', featured: true },
      { icon: FileText, label: '📄 Comprovantes', href: '/comprovantes', featured: true },
      { icon: TrendingDown, label: 'Despesas', href: '/expenses' },
      { icon: Calculator, label: 'Financeiro', href: '/financial' },
      { icon: Calculator, label: '💰 Simulador Financeiro', href: '/simulador-financeiro', featured: true },
      { icon: FileText, label: '📊 DIMOB', href: '/dimob', featured: true },
    ]
  },

  // Categoria: Pagamentos
  {
    type: 'category',
    icon: CreditCard,
    label: 'Pagamentos',
    children: [
      { icon: CreditCard, label: 'PIX Pagamento', href: '/pix' },
      { icon: Wallet, label: 'Gateway', href: '/gateway' },
      { icon: MessageCircle, label: '💬 WhatsApp', href: '/whatsapp', featured: true },
    ]
  },

  // Categoria: Configurações
  {
    type: 'category',
    icon: Settings,
    label: 'Configurações',
    children: [
      { icon: User, label: 'Meu Perfil', href: '/settings' },
      { icon: Building2, label: 'Empresa', href: '/settings?tab=empresa' },
      { icon: Settings, label: 'Sistema', href: '/settings?tab=sistema' },
      { icon: Bell, label: 'Notificações', href: '/settings?tab=notifications' },
      { icon: DollarSign, label: 'R$ Financeiro', href: '/settings?tab=financeiro' },
      { icon: Split, label: '$ ASAAS Split', href: '/settings?tab=split' },
      { icon: Plug, label: 'APIs Externas', href: '/settings?tab=apis' },
      { icon: Link2, label: 'Integrações', href: '/settings?tab=integracoes' },
      { icon: ShieldCheck, label: 'Segurança', href: '/settings?tab=seguranca' },
    ]
  },

  // Admin apenas
  {
    type: 'category',
    icon: Shield,
    label: 'Admin',
    adminOnly: true,
    children: [
      { icon: UserPlus, label: 'Usuários', href: '/users' },
      { icon: Wallet, label: 'Config Gateway', href: '/admin/gateway-settings' },
      { icon: TestTube, label: 'Teste Gateway', href: '/gateway-test' },
      { icon: Shield, label: 'Backup', href: '/admin/backup' },
    ]
  }
]

// OPÇÃO 2: Ícones mais visuais (descomente para usar)
// const menuItems = [
//   { icon: PieChart, label: 'Dashboard', href: '/dashboard' },
//   { icon: HousePlus, label: 'Imóveis', href: '/properties' },
//   { icon: Contact, label: 'Proprietários', href: '/owners' },
//   { icon: UserCheck, label: 'Inquilinos', href: '/tenants' },
//   { icon: ScrollText, label: 'Contratos', href: '/contracts' },
//   { icon: Banknote, label: 'Pagamentos', href: '/payments' },
//   { icon: TrendingUp, label: 'Financeiro', href: '/financial' },
//   { icon: Target, label: 'Leads', href: '/leads' },
//   { icon: Mail, label: 'Chat OLX', href: '/olx-chat' },
//   { icon: Activity, label: 'Analytics & IA', href: '/analytics' },
//   { icon: Users, label: 'Usuários', href: '/users' },
//   { icon: Wrench, label: 'Configurações', href: '/settings' }
// ]

// OPÇÃO 3: Mix balanceado (descomente para usar)
// const menuItems = [
//   { icon: BarChart3, label: 'Dashboard', href: '/dashboard' },
//   { icon: Building, label: 'Imóveis', href: '/properties' },
//   { icon: Users, label: 'Proprietários', href: '/owners' },
//   { icon: UserCog, label: 'Inquilinos', href: '/tenants' },
//   { icon: FileContract, label: 'Contratos', href: '/contracts' },
//   { icon: CreditCard, label: 'Pagamentos', href: '/payments' },
//   { icon: Coins, label: 'Financeiro', href: '/financial' },
//   { icon: Zap, label: 'Leads', href: '/leads' },
//   { icon: MessageSquare, label: 'Chat OLX', href: '/olx-chat' },
//   { icon: Brain, label: 'Analytics & IA', href: '/analytics' },
//   { icon: UserPlus, label: 'Usuários', href: '/users' },
//   { icon: Settings, label: 'Configurações', href: '/settings' }
// ]

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Gestão']) // Gestão aberta por padrão
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isAdmin, setIsAdmin] = useState(false)

  const toggleCategory = (categoryLabel: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryLabel) 
        ? prev.filter(cat => cat !== categoryLabel)
        : [...prev, categoryLabel]
    )
  }

  // Verificar se é admin usando a mesma lógica da página de settings
  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/users/profile')
      if (response.ok) {
        const userData = await response.json()
        const isExplicitAdmin = userData.role === 'ADMIN'
        const isFallbackAdmin = userData.id === '1' || userData.email?.toLowerCase().includes('admin')
        setIsAdmin(isExplicitAdmin || isFallbackAdmin)
      } else {
        setIsAdmin(false)
      }
    } catch (error) {
      setIsAdmin(false)
    }
  }

  useEffect(() => {
    if (session) {
      checkAdminStatus()
    }
  }, [session])

  // Componente para renderizar item do menu
  const renderMenuItem = (item: any, isChild = false) => {
    if (item.adminOnly && !isAdmin) return null
    
    const isActive = pathname === item.href
    const isExpanded = expandedCategories.includes(item.label)

    // Se é uma categoria
    if (item.type === 'category') {
      return (
        <li key={item.label} className="mb-2">
          {/* Header da categoria */}
          <button
            onClick={() => toggleCategory(item.label)}
            className="flex items-center justify-between w-full px-4 py-3 text-left rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <div className="flex items-center space-x-3">
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </div>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {/* Subitens */}
          {isExpanded && (
            <ul className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 dark:border-gray-600 pl-4">
              {item.children.map((child: any) => renderMenuItem(child, true))}
            </ul>
          )}
        </li>
      )
    }

    // Item normal
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 border-r-2 ${
            isActive
              ? ''
              : item.featured
              ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-blue-200'
              : `text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent ${
                  isChild ? 'text-sm' : ''
                }`
          }`}
          style={isActive ? {backgroundColor: '#fef2f2', color: '#f63c6a', borderColor: '#f63c6a'} : {}}
        >
          <item.icon className={`${isChild ? 'w-4 h-4' : 'w-5 h-5'}`} />
          <span className={`font-medium ${isChild ? 'text-sm' : ''}`}>{item.label}</span>
        </Link>
      </li>
    )
  }


  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mobile (full width) */}
      <div
        className={`lg:hidden fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out z-40 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg" style={{backgroundColor: '#f63c6a'}}>
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="logo-font text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                ALL-GESTOR
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gestão Imobiliária</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuStructure.map((item) => renderMenuItem(item))}
          </ul>
          
          {/* Logout Button */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 w-full"
            >
              <Power className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </nav>

      </div>

      {/* Sidebar - Desktop (icon only with tooltips) */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
          <div className="p-2 rounded-lg" style={{backgroundColor: '#f63c6a'}}>
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 flex flex-col">
          <ul className="space-y-1 flex-1">
            {menuStructure.map((item) => {
              // Para desktop, mostrar apenas ícones das categorias ou itens principais
              if (item.adminOnly && !isAdmin) return null
              
              // Se é categoria, mostrar o ícone da categoria
              if (item.type === 'category') {
                return (
                  <li key={item.label} className="px-2">
                    <button
                      onClick={() => toggleCategory(item.label)}
                      className="group relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                      title={item.label}
                    >
                      <item.icon className="w-5 h-5" />
                    </button>
                  </li>
                )
              }
              
              // Item normal
              const isActive = pathname === item.href
              return (
                <li key={item.href} className="px-2">
                  <Link
                    href={item.href}
                    className={`group relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 ${
                      isActive
                        ? ''
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                    style={isActive ? {backgroundColor: '#fef2f2', color: '#f63c6a'} : {}}
                    title={item.label}
                  >
                    <item.icon className="w-5 h-5" />
                  </Link>
                </li>
              )
            })}
          </ul>
          
          {/* Logout Button */}
          <div className="px-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="group relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
              title="Sair"
            >
              <Power className="w-5 h-5" />
            </button>
          </div>
        </nav>

      </div>
    </>
  )
}