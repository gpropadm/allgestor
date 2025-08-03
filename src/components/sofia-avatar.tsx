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
        className="w-full h-full rounded-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Background gradient moderno */}
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
          
          {/* Cabelo castanho claro moderno */}
          <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B4513" />
            <stop offset="100%" stopColor="#A0522D" />
          </linearGradient>
          
          {/* Pele natural */}
          <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDBCB4" />
            <stop offset="100%" stopColor="#F8AFA6" />
          </linearGradient>
        </defs>
        
        {/* Background elegante */}
        <circle cx="50" cy="50" r="48" fill="url(#bgGradient)" />
        
        {/* Rosto mais bonito */}
        <ellipse cx="50" cy="48" rx="20" ry="22" fill="url(#skinGradient)" />
        
        {/* Cabelo longo e elegante - parte de trás */}
        <path 
          d="M30 40 Q25 30 30 25 Q40 15 50 18 Q60 15 70 25 Q75 30 70 40 Q72 55 70 65 Q65 70 60 68 Q50 70 40 68 Q35 70 30 65 Q28 55 30 40 Z" 
          fill="url(#hairGradient)"
        />
        
        {/* Franja moderna e feminina */}
        <path 
          d="M35 32 Q40 25 45 27 Q50 22 55 27 Q60 25 65 32 Q62 35 58 34 Q54 32 50 33 Q46 32 42 34 Q38 35 35 32 Z" 
          fill="url(#hairGradient)"
        />
        
        {/* Olhos grandes e expressivos */}
        <ellipse cx="44" cy="44" rx="3" ry="4" fill="white" />
        <ellipse cx="56" cy="44" rx="3" ry="4" fill="white" />
        <ellipse cx="44" cy="44" rx="2" ry="3" fill="#2D3748" />
        <ellipse cx="56" cy="44" rx="2" ry="3" fill="#2D3748" />
        
        {/* Pupilas e brilho */}
        <circle cx="44" cy="44" r="1.2" fill="black" />
        <circle cx="56" cy="44" r="1.2" fill="black" />
        <circle cx="44.5" cy="43" r="0.6" fill="white" opacity="0.9" />
        <circle cx="56.5" cy="43" r="0.6" fill="white" opacity="0.9" />
        
        {/* Cílios superiores */}
        <path d="M41 41 Q42 40 43 41" stroke="#2D3748" strokeWidth="0.8" strokeLinecap="round" fill="none" />
        <path d="M45 40 Q46 39 47 40" stroke="#2D3748" strokeWidth="0.8" strokeLinecap="round" fill="none" />
        <path d="M53 40 Q54 39 55 40" stroke="#2D3748" strokeWidth="0.8" strokeLinecap="round" fill="none" />
        <path d="M57 41 Q58 40 59 41" stroke="#2D3748" strokeWidth="0.8" strokeLinecap="round" fill="none" />
        
        {/* Sobrancelhas bem feitas */}
        <path d="M41 39 Q44 37.5 47 38.5" stroke="#8B4513" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M53 38.5 Q56 37.5 59 39" stroke="#8B4513" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        
        {/* Nariz delicado */}
        <ellipse cx="50" cy="48" rx="1" ry="1.5" fill="#F8AFA6" opacity="0.7" />
        
        {/* Boca sorridente e bonita */}
        <path d="M46 52 Q50 55 54 52" stroke="#E53E3E" strokeWidth="2" strokeLinecap="round" fill="none" />
        <ellipse cx="50" cy="54" rx="2.5" ry="1" fill="#E53E3E" opacity="0.6" />
        
        {/* Blush sutil */}
        <circle cx="40" cy="50" r="2" fill="#F687B3" opacity="0.3" />
        <circle cx="60" cy="50" r="2" fill="#F687B3" opacity="0.3" />
        
        {/* Brincos elegantes */}
        <circle cx="36" cy="48" r="1.5" fill="#FFD700" />
        <circle cx="64" cy="48" r="1.5" fill="#FFFd700" />
        
        {/* Símbolo AI discreto */}
        <circle cx="75" cy="25" r="6" fill="white" opacity="0.9" />
        <text x="75" y="27.5" textAnchor="middle" fontSize="6" fill="#667eea" fontWeight="bold">AI</text>
        
        {/* Sparkles mágicos */}
        <g fill="white" opacity="0.9">
          <path d="M25 25 L26 27 L25 29 L24 27 Z">
            <animateTransform attributeName="transform" type="rotate" values="0 25 27;360 25 27" dur="4s" repeatCount="indefinite" />
          </path>
          <path d="M80 60 L81 62 L80 64 L79 62 Z">
            <animateTransform attributeName="transform" type="rotate" values="0 80 62;360 80 62" dur="3s" repeatCount="indefinite" />
          </path>
          <circle cx="20" cy="60" r="1">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
      
      {/* Badge de status online */}
      <div className={`absolute -bottom-1 -right-1 ${badgeSizes[size]} bg-green-400 border-2 border-white rounded-full`}></div>
    </div>
  )
}