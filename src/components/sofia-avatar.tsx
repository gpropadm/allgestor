import React from 'react'

interface SofiaAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function SofiaAvatar({ size = 'md', className = '' }: SofiaAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }
  
  const badgeSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4', 
    xl: 'w-5 h-5'
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Circle - Gradient azul elegante */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          
          {/* Gradient para o cabelo */}
          <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A5568" />
            <stop offset="100%" stopColor="#2D3748" />
          </linearGradient>
          
          {/* Gradient para a pele */}
          <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        
        {/* Background */}
        <circle cx="50" cy="50" r="48" fill="url(#bgGradient)" />
        
        {/* Rosto */}
        <circle cx="50" cy="45" r="18" fill="url(#skinGradient)" />
        
        {/* Cabelo - Estilo moderno e elegante */}
        <path 
          d="M32 35 Q32 25 42 25 Q50 20 58 25 Q68 25 68 35 Q68 40 65 42 Q63 45 60 45 L40 45 Q37 45 35 42 Q32 40 32 35 Z" 
          fill="url(#hairGradient)"
        />
        
        {/* Franja moderna */}
        <path 
          d="M38 32 Q42 28 46 30 Q50 27 54 30 Q58 28 62 32 Q60 35 58 36 Q54 34 50 35 Q46 34 42 36 Q40 35 38 32 Z" 
          fill="url(#hairGradient)"
        />
        
        {/* Olhos expressivos */}
        <ellipse cx="45" cy="42" rx="2.5" ry="3" fill="#1F2937" />
        <ellipse cx="55" cy="42" rx="2.5" ry="3" fill="#1F2937" />
        
        {/* Brilho nos olhos */}
        <circle cx="46" cy="41" r="0.8" fill="white" />
        <circle cx="56" cy="41" r="0.8" fill="white" />
        
        {/* Sobrancelhas elegantes */}
        <path d="M42 38 Q45 37 48 38" stroke="#4A5568" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M52 38 Q55 37 58 38" stroke="#4A5568" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        
        {/* Nariz sutil */}
        <circle cx="50" cy="46" r="0.8" fill="#F59E0B" opacity="0.6" />
        
        {/* Boca sorridente e confiante */}
        <path d="M46 50 Q50 53 54 50" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        
        {/* Colar profissional */}
        <circle cx="50" cy="65" r="2" fill="#FCD34D" />
        <rect x="48" y="63" width="4" height="8" fill="#3B82F6" rx="1" />
        
        {/* Detalhe tecnológico - Símbolo IA */}
        <circle cx="75" cy="25" r="8" fill="white" opacity="0.9" />
        <text x="75" y="29" textAnchor="middle" fontSize="8" fill="#3B82F6" fontWeight="bold">AI</text>
        
        {/* Sparkles para indicar inteligência */}
        <g fill="white" opacity="0.8">
          <circle cx="25" cy="30" r="1">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="80" cy="45" r="1.5">
            <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="30" cy="70" r="1">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
          </circle>
        </g>
        
        {/* Ícone de casa (referência imobiliária) */}
        <g transform="translate(20, 75) scale(0.8)" fill="white" opacity="0.7">
          <path d="M5 10 L10 5 L15 10 L15 18 L5 18 Z" />
          <rect x="8" y="13" width="4" height="5" />
          <circle cx="7" cy="15" r="0.5" />
        </g>
      </svg>
      
      {/* Badge de status online */}
      <div className={`absolute -bottom-1 -right-1 ${badgeSizes[size]} bg-green-400 border-2 border-white rounded-full`}></div>
    </div>
  )
}