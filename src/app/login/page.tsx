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
  const [displayedQuestion, setDisplayedQuestion] = useState('')
  const [displayedAnswer, setDisplayedAnswer] = useState('')
  const [isTypingQuestion, setIsTypingQuestion] = useState(true)
  const [isTypingAnswer, setIsTypingAnswer] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  const conversations = [
    {
      question: "Como posso automatizar meu DIMOB",
      answer: "Com IA integrada, geramos relatórios DIMOB completos em segundos, sem erros manuais."
    },
    {
      question: "Onde encontro leads qualificados",
      answer: "Capturamos e qualificamos leads automaticamente de múltiplas fontes para você."
    },
    {
      question: "Como organizar minha gestão imobiliária",
      answer: "Sistema completo: contratos, pagamentos, inquilinos e proprietários em um só lugar."
    },
    {
      question: "Como fechar mais negócios",
      answer: "IA analisa padrões e sugere as melhores oportunidades na hora certa."
    },
    {
      question: "Posso digitalizar meus contratos",
      answer: "Contratos digitais inteligentes com assinatura eletrônica e automação completa."
    },
    {
      question: "Como ter relatórios que vendem",
      answer: "Relatórios personalizados que destacam seus resultados e conquistam clientes."
    }
  ]

  // Efeito de conversação estilo ChatGPT
  useEffect(() => {
    let timeout: NodeJS.Timeout
    let answerTimeout: NodeJS.Timeout
    let nextConversationTimeout: NodeJS.Timeout

    const currentConversation = conversations[currentPhraseIndex]

    const typeQuestion = () => {
      let charIndex = 0
      
      const typeChar = () => {
        if (charIndex < currentConversation.question.length) {
          setDisplayedQuestion(currentConversation.question.slice(0, charIndex + 1))
          charIndex++
          timeout = setTimeout(typeChar, 40)
        } else {
          setIsTypingQuestion(false)
          // Espera 800ms e começa a resposta
          answerTimeout = setTimeout(() => {
            setShowAnswer(true)
            setIsTypingAnswer(true)
            typeAnswer()
          }, 800)
        }
      }
      
      typeChar()
    }

    const typeAnswer = () => {
      let charIndex = 0
      
      const typeChar = () => {
        if (charIndex < currentConversation.answer.length) {
          setDisplayedAnswer(currentConversation.answer.slice(0, charIndex + 1))
          charIndex++
          timeout = setTimeout(typeChar, 35)
        } else {
          setIsTypingAnswer(false)
          // Espera 4s e vai para próxima conversa
          nextConversationTimeout = setTimeout(() => {
            setDisplayedQuestion('')
            setDisplayedAnswer('')
            setShowAnswer(false)
            setIsTypingQuestion(true)
            setIsTypingAnswer(false)
            setCurrentPhraseIndex((prev) => (prev + 1) % conversations.length)
          }, 4000)
        }
      }
      
      typeChar()
    }

    typeQuestion()

    return () => {
      clearTimeout(timeout)
      clearTimeout(answerTimeout)
      clearTimeout(nextConversationTimeout)
    }
  }, [currentPhraseIndex])

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Brand Section (70%) */}
      <div className="hidden lg:block flex-1 lg:flex-[0.7] relative overflow-hidden" style={{ backgroundColor: '#ffffdb' }}>
        <div className="absolute inset-0 flex flex-col justify-center items-center px-8 lg:px-16">
          <div className="text-center max-w-4xl">
            {/* Logo */}
            <div className="flex items-center justify-center mb-16">
              <div className="flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mr-6">
                <Building2 className="w-10 h-10" style={{ color: '#fe7600' }} />
              </div>
              <span className="text-5xl font-bold" style={{ color: '#fe7600' }}>ALL-GESTOR</span>
            </div>

            {/* Conversation Simulation */}
            <div className="mb-20 text-left max-w-4xl px-4 lg:px-0">
              {/* Question */}
              <div className="mb-4">
                <h1 className="text-5xl lg:text-6xl font-bold" style={{ color: '#fe7600' }}>
                  {displayedQuestion}
                  <span className={`inline-block w-2 ml-2 ${isTypingQuestion ? 'animate-pulse' : 'hidden'}`} 
                        style={{ backgroundColor: '#fe7600', height: '1em' }}></span>
                </h1>
              </div>

              {/* Answer */}
              {showAnswer && (
                <div className="mt-6">
                  <p className="text-2xl lg:text-3xl font-medium leading-relaxed" style={{ color: '#fe7600' }}>
                    {displayedAnswer}
                    <span className={`inline-block w-1 ml-1 ${isTypingAnswer ? 'animate-pulse' : 'hidden'}`} 
                          style={{ backgroundColor: '#fe7600', height: '1.2em' }}></span>
                  </p>
                </div>
              )}
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
      <div className="w-full lg:flex-[0.3] bg-white flex items-center justify-center px-4 sm:px-8 py-8 lg:py-12 lg:shadow-2xl">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl mr-3" style={{ backgroundColor: '#fe7600' }}>
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold" style={{ color: '#fe7600' }}>ALL-GESTOR</span>
            </div>
          </div>

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
                backgroundColor: loading || !email || !password ? '#d1d5db' : '#fe7600'
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