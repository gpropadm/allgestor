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
  Plug,
  Link2,
  ShieldCheck,
  Home,
  Banknote,
  PieChart,
  HousePlus,
  Contact,
  UserCheck,
  ScrollText,
  Target,
  Mail,
  Activity,
  Wrench
} from 'lucide-react'

// OPÇÃO 1: Ícones mais modernos
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Bot, label: '🤖 Assistente IA', href: '/ai-assistant', featured: true },
  { icon: TrendingUp, label: '📊 Pipeline Vendas', href: '/sales-pipeline', featured: true },
  { icon: Calculator, label: '💰 Simulador Financeiro', href: '/simulador-financeiro', featured: true },
  { icon: BarChart3, label: '📈 Analytics', href: '/analytics', featured: true },
  { icon: MessageCircle, label: '💬 WhatsApp', href: '/whatsapp', featured: true },
  { icon: Home, label: 'Gestão Imobiliária', href: '#', isDropdown: true },
  { icon: Banknote, label: 'Gestão Financeira', href: '#', isDropdown: true },
  { icon: FileText, label: '📊 DIMOB', href: '/dimob', featured: true },
  { icon: Zap, label: 'Leads', href: '/leads' },
  { icon: CreditCard, label: 'PIX Pagamento', href: '/pix' },
  { icon: Wallet, label: 'Gateway', href: '/gateway' },
  { icon: UserPlus, label: 'Usuários', href: '/users', adminOnly: true },
  { icon: Wallet, label: 'Config Gateway', href: '/admin/gateway-settings', adminOnly: true },
  { icon: TestTube, label: 'Teste Gateway', href: '/gateway-test', adminOnly: true },
  { icon: Shield, label: 'Backup', href: '/admin/backup', adminOnly: true },
  { icon: Settings, label: 'Configurações', href: '/settings' }
]

// OPÇÃO 2: Ícones mais visuais - MODELO ALTERNATIVO
const menuItemsAlternativo = [
  { icon: PieChart, label: 'Dashboard', href: '/dashboard' },
  { icon: Bot, label: '🤖 Assistente IA', href: '/ai-assistant', featured: true },
  { icon: TrendingUp, label: '📊 Pipeline Vendas', href: '/sales-pipeline', featured: true },
  { icon: Calculator, label: '💰 Simulador Financeiro', href: '/simulador-financeiro', featured: true },
  { icon: Activity, label: '📈 Analytics', href: '/analytics', featured: true },
  { icon: MessageCircle, label: '💬 WhatsApp', href: '/whatsapp', featured: true },
  { icon: HousePlus, label: 'Gestão Imobiliária', href: '#', isDropdown: true },
  { icon: Banknote, label: 'Gestão Financeira', href: '#', isDropdown: true },
  { icon: ScrollText, label: '📊 DIMOB', href: '/dimob', featured: true },
  { icon: Target, label: 'Leads', href: '/leads' },
  { icon: CreditCard, label: 'PIX Pagamento', href: '/pix' },
  { icon: Wallet, label: 'Gateway', href: '/gateway' },
  { icon: UserPlus, label: 'Usuários', href: '/users', adminOnly: true },
  { icon: Wallet, label: 'Config Gateway', href: '/admin/gateway-settings', adminOnly: true },
  { icon: TestTube, label: 'Teste Gateway', href: '/gateway-test', adminOnly: true },
  { icon: Shield, label: 'Backup', href: '/admin/backup', adminOnly: true },
  { icon: Wrench, label: 'Configurações', href: '/settings' }
]

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
  const [isConfigExpanded, setIsConfigExpanded] = useState(false)
  const [isImobiliariaExpanded, setIsImobiliariaExpanded] = useState(false)
  const [isFinanceiroExpanded, setIsFinanceiroExpanded] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isAdmin, setIsAdmin] = useState(false)

  // Subitens de Configurações
  const configMenuItems = [
    { icon: Building2, label: 'Empresa', href: '/settings?tab=empresa' },
    { icon: Settings, label: 'Sistema', href: '/settings?tab=sistema' },
    { icon: Bell, label: 'Notificações', href: '/settings?tab=notifications' },
    { icon: DollarSign, label: 'Financeiro', href: '/settings?tab=financeiro' },
    { icon: CreditCard, label: 'ASAAS Split', href: '/settings?tab=split' },
    { icon: Plug, label: 'APIs Externas', href: '/settings?tab=apis' },
    { icon: Link2, label: 'Integrações', href: '/settings?tab=integracoes' },
    { icon: ShieldCheck, label: 'Segurança', href: '/settings?tab=seguranca' },
  ]

  // Subitens de Gestão Imobiliária
  const imobiliariaMenuItems = [
    { icon: Users, label: 'Proprietários', href: '/owners' },
    { icon: Building, label: 'Imóveis', href: '/properties' },
    { icon: User, label: 'Inquilinos', href: '/tenants' },
    { icon: FileText, label: 'Contratos', href: '/contracts' },
  ]

  // Subitens de Gestão Financeira
  const financeiroMenuItems = [
    { icon: Receipt, label: 'Pagamentos', href: '/payments' },
    { icon: FileText, label: 'Recibos', href: '/recibos' },
    { icon: FileText, label: 'Comprovantes', href: '/comprovantes' },
    { icon: TrendingDown, label: 'Despesas', href: '/expenses' },
    { icon: Calculator, label: 'Financeiro', href: '/financial' },
  ]

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
            {menuItemsAlternativo.map((item) => {
              // Ocultar itens adminOnly se não for admin
              if (item.adminOnly && !isAdmin) {
                return null
              }
              
              // Se é Configurações, renderizar como expansível
              if (item.label === 'Configurações') {
                return (
                  <li key="configuracoes">
                    {/* Header Configurações */}
                    <button
                      onClick={() => setIsConfigExpanded(!isConfigExpanded)}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <div className="flex items-center space-x-3">
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">Configurações</span>
                      </div>
                      {isConfigExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    
                    {/* Subitens */}
                    {isConfigExpanded && (
                      <ul className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 dark:border-gray-600 pl-4">
                        {configMenuItems.map((subItem) => {
                          const isActive = pathname === subItem.href
                          return (
                            <li key={subItem.href}>
                              <Link
                                href={subItem.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors border-r-2 text-sm ${
                                  isActive
                                    ? ''
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent'
                                }`}
                                style={isActive ? {backgroundColor: '#fef2f2', color: '#f63c6a', borderColor: '#f63c6a'} : {}}
                              >
                                <subItem.icon className="w-4 h-4" />
                                <span className="font-medium">{subItem.label}</span>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              }

              // Se é Gestão Imobiliária, renderizar como expansível
              if (item.label === 'Gestão Imobiliária') {
                return (
                  <li key="imobiliaria">
                    {/* Header Gestão Imobiliária */}
                    <button
                      onClick={() => setIsImobiliariaExpanded(!isImobiliariaExpanded)}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <div className="flex items-center space-x-3">
                        <Home className="w-5 h-5" />
                        <span className="font-medium">Gestão Imobiliária</span>
                      </div>
                      {isImobiliariaExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    
                    {/* Subitens */}
                    {isImobiliariaExpanded && (
                      <ul className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 dark:border-gray-600 pl-4">
                        {imobiliariaMenuItems.map((subItem) => {
                          const isActive = pathname === subItem.href
                          return (
                            <li key={subItem.href}>
                              <Link
                                href={subItem.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors border-r-2 text-sm ${
                                  isActive
                                    ? ''
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent'
                                }`}
                                style={isActive ? {backgroundColor: '#fef2f2', color: '#f63c6a', borderColor: '#f63c6a'} : {}}
                              >
                                <subItem.icon className="w-4 h-4" />
                                <span className="font-medium">{subItem.label}</span>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              }

              // Se é Gestão Financeira, renderizar como expansível
              if (item.label === 'Gestão Financeira') {
                return (
                  <li key="financeiro">
                    {/* Header Gestão Financeira */}
                    <button
                      onClick={() => setIsFinanceiroExpanded(!isFinanceiroExpanded)}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <div className="flex items-center space-x-3">
                        <Banknote className="w-5 h-5" />
                        <span className="font-medium">Gestão Financeira</span>
                      </div>
                      {isFinanceiroExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    
                    {/* Subitens */}
                    {isFinanceiroExpanded && (
                      <ul className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 dark:border-gray-600 pl-4">
                        {financeiroMenuItems.map((subItem) => {
                          const isActive = pathname === subItem.href
                          return (
                            <li key={subItem.href}>
                              <Link
                                href={subItem.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors border-r-2 text-sm ${
                                  isActive
                                    ? ''
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent'
                                }`}
                                style={isActive ? {backgroundColor: '#fef2f2', color: '#f63c6a', borderColor: '#f63c6a'} : {}}
                              >
                                <subItem.icon className="w-4 h-4" />
                                <span className="font-medium">{subItem.label}</span>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              }
              
              // Se é um item dropdown, não renderizar link
              if (item.isDropdown) {
                return null
              }
              
              // Itens normais
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors border-r-2 ${
                      isActive
                        ? ''
                        : item.featured
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-blue-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent'
                    }`}
                    style={isActive ? {backgroundColor: '#fef2f2', color: '#f63c6a', borderColor: '#f63c6a'} : {}}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
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
            {menuItemsAlternativo.map((item) => {
              // Ocultar itens adminOnly se não for admin
              if (item.adminOnly && !isAdmin) {
                return null
              }
              
              // Se é Configurações no desktop, criar dropdown hover
              if (item.label === 'Configurações') {
                return (
                  <li key={item.href} className="px-2 relative group">
                    <div
                      className="relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
                      title="Configurações"
                    >
                      <Settings className="w-5 h-5" />
                    </div>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute left-16 top-0 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                          CONFIGURAÇÕES
                        </div>
                        <nav className="mt-2">
                          {configMenuItems.map((subItem) => {
                            const isActive = pathname === subItem.href || pathname.includes(subItem.href.split('?')[0])
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all duration-200 text-sm ${
                                  isActive
                                    ? 'bg-red-50 text-red-600 border-l-2 border-red-600'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                <subItem.icon className="w-4 h-4" />
                                <span className="font-medium">{subItem.label}</span>
                              </Link>
                            )
                          })}
                        </nav>
                      </div>
                    </div>
                  </li>
                )
              }

              // Se é Gestão Imobiliária no desktop, criar dropdown hover
              if (item.label === 'Gestão Imobiliária') {
                return (
                  <li key={item.href} className="px-2 relative group">
                    <div
                      className="relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
                      title="Gestão Imobiliária"
                    >
                      <Home className="w-5 h-5" />
                    </div>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute left-16 top-0 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                          GESTÃO IMOBILIÁRIA
                        </div>
                        <nav className="mt-2">
                          {imobiliariaMenuItems.map((subItem) => {
                            const isActive = pathname === subItem.href
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all duration-200 text-sm ${
                                  isActive
                                    ? 'bg-red-50 text-red-600 border-l-2 border-red-600'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                <subItem.icon className="w-4 h-4" />
                                <span className="font-medium">{subItem.label}</span>
                              </Link>
                            )
                          })}
                        </nav>
                      </div>
                    </div>
                  </li>
                )
              }

              // Se é Gestão Financeira no desktop, criar dropdown hover
              if (item.label === 'Gestão Financeira') {
                return (
                  <li key={item.href} className="px-2 relative group">
                    <div
                      className="relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
                      title="Gestão Financeira"
                    >
                      <Banknote className="w-5 h-5" />
                    </div>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute left-16 top-0 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                          GESTÃO FINANCEIRA
                        </div>
                        <nav className="mt-2">
                          {financeiroMenuItems.map((subItem) => {
                            const isActive = pathname === subItem.href
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all duration-200 text-sm ${
                                  isActive
                                    ? 'bg-red-50 text-red-600 border-l-2 border-red-600'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                <subItem.icon className="w-4 h-4" />
                                <span className="font-medium">{subItem.label}</span>
                              </Link>
                            )
                          })}
                        </nav>
                      </div>
                    </div>
                  </li>
                )
              }
              
              // Se é um item dropdown, não renderizar link
              if (item.isDropdown) {
                return null
              }
              
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