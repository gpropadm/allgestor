'use client'

import { useState, useEffect } from 'react'
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

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  const phrases = [
    "DIMOB automático em segundos",
    "Leads qualificados na sua mão", 
    "Gestão completa da sua imobiliária",
    "Feche mais negócios com IA",
    "Contratos digitais inteligentes",
    "Relatórios que vendem por você"
  ]

  // Efeito de digitação estilo ChatGPT
  useEffect(() => {
    let timeout: NodeJS.Timeout
    let phraseTimeout: NodeJS.Timeout

    const typePhrase = () => {
      const currentPhrase = phrases[currentPhraseIndex]
      let charIndex = 0
      
      const typeChar = () => {
        if (charIndex < currentPhrase.length) {
          setDisplayedText(currentPhrase.slice(0, charIndex + 1))
          charIndex++
          timeout = setTimeout(typeChar, 50)
        } else {
          setIsTyping(false)
          phraseTimeout = setTimeout(() => {
            setIsTyping(true)
            setDisplayedText('')
            setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length)
          }, 3000)
        }
      }
      
      typeChar()
    }

    typePhrase()

    return () => {
      clearTimeout(timeout)
      clearTimeout(phraseTimeout)
    }
  }, [currentPhraseIndex])

  return (
    <div className="min-h-screen flex">
      {/* Left side - Brand Section (70%) */}
      <div className="flex-[0.7] relative overflow-hidden" style={{ backgroundColor: '#ffffdb' }}>
        <div className="absolute inset-0 flex flex-col justify-center items-center px-8 lg:px-16">
          <div className="text-center max-w-4xl">
            {/* Logo */}
            <div className="flex items-center justify-center mb-16">
              <div className="flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mr-6">
                <Building2 className="w-10 h-10" style={{ color: '#fe7600' }} />
              </div>
              <span className="text-5xl font-bold" style={{ color: '#fe7600' }}>ALL-GESTOR</span>
            </div>

            {/* Animated Phrase */}
            <div className="mb-20">
              <h1 className="text-6xl lg:text-7xl font-bold mb-8" style={{ color: '#fe7600' }}>
                {displayedText}
                <span className={`inline-block w-2 ml-2 ${isTyping ? 'animate-pulse' : ''}`} 
                      style={{ backgroundColor: '#fe7600', height: '1em' }}></span>
              </h1>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full blur-2xl" 
             style={{ backgroundColor: 'rgba(254, 118, 0, 0.1)' }}></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full blur-xl" 
             style={{ backgroundColor: 'rgba(254, 118, 0, 0.15)' }}></div>
        <div className="absolute top-1/2 left-32 w-16 h-16 rounded-full blur-lg" 
             style={{ backgroundColor: 'rgba(254, 118, 0, 0.2)' }}></div>
      </div>

      {/* Right side - Login Form (30%) */}
      <div className="flex-[0.3] bg-white flex items-center justify-center px-8 py-12 shadow-2xl">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Entrar</h2>
            <p className="text-gray-600">Acesse sua conta</p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                style={{ focusRingColor: '#fe7600' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#fe7600'
                  e.target.style.boxShadow = '0 0 0 2px rgba(254, 118, 0, 0.2)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="seu@email.com"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 pr-12"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#fe7600'
                    e.target.style.boxShadow = '0 0 0 2px rgba(254, 118, 0, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db'
                    e.target.style.boxShadow = 'none'
                  }}
                  placeholder="••••••••"
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
              className="w-full text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: loading || !email || !password ? '#d1d5db' : '#fe7600',
                focusRingColor: '#fe7600' 
              }}
              onMouseEnter={(e) => {
                if (!loading && email && password) {
                  (e.target as HTMLElement).style.backgroundColor = '#e56600'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && email && password) {
                  (e.target as HTMLElement).style.backgroundColor = '#fe7600'
                }
              }}
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
              &copy; 2025 ALL-GESTOR
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}