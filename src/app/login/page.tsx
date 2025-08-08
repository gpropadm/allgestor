'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Building2, Sparkles } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Email ou senha incorretos')
      } else {
        const session = await getSession()
        if (session) {
          router.push('/dashboard')
        }
      }
    } catch {
      setError('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-2xl mb-6">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bem-vindo de volta</h1>
            <p className="text-gray-500 mt-2">Faça login em sua conta</p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Endereço de email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                placeholder="Digite seu email"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 pr-12"
                  placeholder="Digite sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !email || !password}
              className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Continuar'
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              &copy; 2025 ALL-GESTOR. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Brand Section */}
      <div className="hidden lg:flex flex-1 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
        <div className="relative z-10 flex flex-col justify-center px-16 py-20">
          <div className="max-w-lg">
            {/* Logo */}
            <div className="flex items-center mb-12">
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl mr-4">
                <Building2 className="w-6 h-6 text-gray-900" />
              </div>
              <span className="text-2xl font-bold text-white">ALL-GESTOR</span>
            </div>

            {/* Main Message */}
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Sua Imobiliária 
              <br />
              <span className="text-gray-300">inteligente e conectada</span>
            </h2>

            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Gestão completa de imóveis, leads qualificados e automação que trabalha para você 24h por dia.
            </p>

            {/* Features */}
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-green-500 rounded-lg mr-4">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Leads Inteligentes</h3>
                  <p className="text-gray-400 text-sm">Captura e qualifica leads automaticamente</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-lg mr-4">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Gestão Completa</h3>
                  <p className="text-gray-400 text-sm">Contratos, pagamentos e relatórios em um só lugar</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-500 rounded-lg mr-4">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">IA Integrada</h3>
                  <p className="text-gray-400 text-sm">Automação inteligente para máxima eficiência</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-32 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-2xl"></div>
      </div>
    </div>
  )
}