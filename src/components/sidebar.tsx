'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
// Phosphor Icons
import {
  SquaresFour,
  Robot,
  TrendUp,
  Calculator,
  ChartBar,
  WhatsappLogo,
  FileText,
  Target,
  PixLogo,
  CreditCard,
  Buildings,
  UserCircle,
  House,
  Users,
  Wallet,
  Money,
  Receipt,
  FileArrowUp,
  TrendDown,
  ChartPie,
  UserGear,
  GearSix,
  Shield,
  Bell,
  CurrencyDollar,
  Plug,
  LinkSimple,
  ShieldCheck,
  Power,
  Lightning
} from '@phosphor-icons/react'

// Manter alguns ícones do Lucide para funcionalidades específicas
import {
  TestTube,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Building2,
  FileText as FileContract
} from 'lucide-react'

// Nova configuração com ícones Phosphor otimizados
const menuItems = [
  { icon: SquaresFour, label: 'Dashboard', href: '/dashboard' },
  { icon: WhatsappLogo, label: '💬 WhatsApp', href: '/whatsapp', featured: true },
  { icon: Buildings, label: 'Gestão Imobiliária', href: '#', isDropdown: true },
  { icon: Wallet, label: 'Gestão Financeira', href: '#', isDropdown: true },
  { icon: FileText, label: '📊 DIMOB', href: '/dimob', featured: true },
  { icon: Target, label: 'Leads', href: '/leads' },
  { icon: PixLogo, label: 'PIX Pagamento', href: '/pix' },
  { icon: CreditCard, label: 'Gateway', href: '/gateway' },
  { icon: UserGear, label: 'Usuários', href: '/users', adminOnly: true },
  { icon: GearSix, label: 'Config Gateway', href: '/admin/gateway-settings', adminOnly: true },
  { icon: TestTube, label: 'Teste Gateway', href: '/gateway-test', adminOnly: true },
  { icon: Shield, label: 'Backup', href: '/admin/backup', adminOnly: true },
  { icon: Lightning, label: 'IA & Analytics', href: '#', isDropdown: true, featured: true },
  { icon: GearSix, label: 'Configurações', href: '/settings' }
]


export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isConfigExpanded, setIsConfigExpanded] = useState(false)
  const [isImobiliariaExpanded, setIsImobiliariaExpanded] = useState(false)
  const [isFinanceiroExpanded, setIsFinanceiroExpanded] = useState(false)
  const [isIAAnalyticsExpanded, setIsIAAnalyticsExpanded] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isAdmin, setIsAdmin] = useState(false)

  // Subitens de IA & Analytics com ícones Phosphor
  const iaAnalyticsMenuItems = [
    { icon: Robot, label: '🤖 Assistente IA', href: '/ai-assistant' },
    { icon: TrendUp, label: '📊 Pipeline Vendas', href: '/sales-pipeline' },
    { icon: Calculator, label: '💰 Simulador Financeiro', href: '/simulador-financeiro' },
    { icon: ChartBar, label: '📈 Analytics', href: '/analytics' },
  ]

  // Subitens de Configurações com ícones Phosphor
  const configMenuItems = [
    { icon: Building2, label: 'Empresa', href: '/settings?tab=empresa' },
    { icon: GearSix, label: 'Sistema', href: '/settings?tab=sistema' },
    { icon: Bell, label: 'Notificações', href: '/settings?tab=notifications' },
    { icon: CurrencyDollar, label: 'Financeiro', href: '/settings?tab=financeiro' },
    { icon: CreditCard, label: 'ASAAS Split', href: '/settings?tab=split' },
    { icon: Plug, label: 'APIs Externas', href: '/settings?tab=apis' },
    { icon: LinkSimple, label: 'Integrações', href: '/settings?tab=integracoes' },
    { icon: ShieldCheck, label: 'Segurança', href: '/settings?tab=seguranca' },
  ]

  // Subitens de Gestão Imobiliária com ícones Phosphor
  const imobiliariaMenuItems = [
    { icon: UserCircle, label: 'Proprietários', href: '/owners' },
    { icon: House, label: 'Imóveis', href: '/properties' },
    { icon: Users, label: 'Inquilinos', href: '/tenants' },
    { icon: FileContract, label: 'Contratos', href: '/contracts' },
  ]

  // Subitens de Gestão Financeira com ícones Phosphor
  const financeiroMenuItems = [
    { icon: Money, label: 'Pagamentos', href: '/payments' },
    { icon: Receipt, label: 'Recibos', href: '/recibos' },
    { icon: FileArrowUp, label: 'Comprovantes', href: '/comprovantes' },
    { icon: TrendDown, label: 'Despesas', href: '/expenses' },
    { icon: ChartPie, label: 'Financeiro', href: '/financial' },
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
              <Buildings className="w-6 h-6 text-white" />
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
            {menuItems.map((item) => {
              // Ocultar itens adminOnly se não for admin
              if (item.adminOnly && !isAdmin) {
                return null
              }
              
              // Se é IA & Analytics, renderizar como expansível
              if (item.label === 'IA & Analytics') {
                return (
                  <li key="ia-analytics">
                    {/* Header IA & Analytics */}
                    <button
                      onClick={() => setIsIAAnalyticsExpanded(!isIAAnalyticsExpanded)}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <div className="flex items-center space-x-3">
                        <Lightning className="w-5 h-5" />
                        <span className="font-medium">IA & Analytics</span>
                      </div>
                      {isIAAnalyticsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    
                    {/* Subitens */}
                    {isIAAnalyticsExpanded && (
                      <ul className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 dark:border-gray-600 pl-4">
                        {iaAnalyticsMenuItems.map((subItem) => {
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
                        <GearSix className="w-5 h-5" />
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
                        <Buildings className="w-5 h-5" />
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
                        <Wallet className="w-5 h-5" />
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
            <Buildings className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 flex flex-col">
          <ul className="space-y-1 flex-1">
            {menuItems.map((item) => {
              // Ocultar itens adminOnly se não for admin
              if (item.adminOnly && !isAdmin) {
                return null
              }
              
              // Se é IA & Analytics no desktop, criar dropdown hover
              if (item.label === 'IA & Analytics') {
                return (
                  <li key="ia-analytics-desktop" className="px-2 relative group">
                    <div
                      className="relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
                      title="IA & Analytics"
                    >
                      <Lightning className="w-5 h-5" />
                    </div>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute left-16 top-0 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                          IA & ANALYTICS
                        </div>
                        <nav className="mt-2">
                          {iaAnalyticsMenuItems.map((subItem) => {
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

              // Se é Configurações no desktop, criar dropdown hover
              if (item.label === 'Configurações') {
                return (
                  <li key={item.href} className="px-2 relative group">
                    <div
                      className="relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
                      title="Configurações"
                    >
                      <GearSix className="w-5 h-5" />
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
                      <Buildings className="w-5 h-5" />
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
                      <Wallet className="w-5 h-5" />
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