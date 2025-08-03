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
          {/* Background gradient roxo moderno */}
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
          
          {/* Cabelo castanho natural */}
          <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          
          {/* Pele clara e natural */}
          <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FDE68A" />
          </linearGradient>
          
          {/* Camiseta roxa */}
          <linearGradient id="shirtGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        
        {/* Background roxo elegante */}
        <circle cx="50" cy="50" r="48" fill="url(#bgGradient)" />
        
        {/* Camiseta roxa */}
        <path 
          d="M25 75 Q30 70 40 72 L60 72 Q70 70 75 75 L75 95 L25 95 Z" 
          fill="url(#shirtGradient)"
        />
        
        {/* Logo branco na camiseta */}
        <circle cx="50" cy="80" r="3" fill="white" opacity="0.9" />
        <path d="M48 78 L52 78 L50 82 Z" fill="url(#shirtGradient)" />
        
        {/* Pescoço */}
        <ellipse cx="50" cy="65" rx="6" ry="8" fill="url(#skinGradient)" />
        
        {/* Rosto jovem e amigável */}
        <ellipse cx="50" cy="45" rx="16" ry="18" fill="url(#skinGradient)" />
        
        {/* Cabelo castanho curto moderno */}
        <path 
          d="M34 35 Q34 25 42 22 Q50 18 58 22 Q66 25 66 35 Q66 40 64 45 Q62 50 58 52 L42 52 Q38 50 36 45 Q34 40 34 35 Z" 
          fill="url(#hairGradient)"
        />
        
        {/* Franja lateral moderna */}
        <path 
          d="M36 32 Q40 28 44 30 Q48 27 52 29 Q56 28 60 30 Q58 33 55 34 Q52 32 48 33 Q44 32 40 34 Q38 33 36 32 Z" 
          fill="url(#hairGradient)"
        />
        
        {/* Olhos claros e expressivos */}
        <ellipse cx="45" cy="42" rx="2.5" ry="3" fill="white" />
        <ellipse cx="55" cy="42" rx="2.5" ry="3" fill="white" />
        <ellipse cx="45" cy="42" rx="1.8" ry="2.2" fill="#3B82F6" />
        <ellipse cx="55" cy="42" rx="1.8" ry="2.2" fill="#3B82F6" />
        
        {/* Pupilas */}
        <circle cx="45" cy="42" r="0.8" fill="#1E40AF" />
        <circle cx="55" cy="42" r="0.8" fill="#1E40AF" />
        
        {/* Brilho nos olhos */}
        <circle cx="45.3" cy="41.5" r="0.4" fill="white" />
        <circle cx="55.3" cy="41.5" r="0.4" fill="white" />
        
        {/* Sobrancelhas bem definidas */}
        <path d="M42 38 Q45 37 48 38" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M52 38 Q55 37 58 38" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        
        {/* Nariz delicado */}
        <ellipse cx="50" cy="46" rx="0.8" ry="1.2" fill="#FDE68A" opacity="0.8" />
        
        {/* Sorriso gentil e confiante */}
        <path d="M46 50 Q50 53 54 50" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        
        {/* Dentes brancos */}
        <ellipse cx="50" cy="51.5" rx="3" ry="0.8" fill="white" opacity="0.9" />
        
        {/* Maquiagem leve - sombra */}
        <ellipse cx="45" cy="40" rx="2" ry="1" fill="#C084FC" opacity="0.2" />
        <ellipse cx="55" cy="40" rx="2" ry="1" fill="#C084FC" opacity="0.2" />
        
        {/* Batom discreto */}
        <ellipse cx="50" cy="51" rx="2.5" ry="0.8" fill="#F87171" opacity="0.6" />
        
        {/* Badge AI moderno */}
        <circle cx="75" cy="25" r="7" fill="white" opacity="0.95" />
        <text x="75" y="28" textAnchor="middle" fontSize="7" fill="#8B5CF6" fontWeight="bold">AI</text>
        
        {/* Efeito profissional sutil */}
        <circle cx="30" cy="30" r="1" fill="white" opacity="0.6">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="70" cy="70" r="0.8" fill="white" opacity="0.5">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </svg>
      
      {/* Badge de status online */}
      <div className={`absolute -bottom-1 -right-1 ${badgeSizes[size]} bg-green-400 border-2 border-white rounded-full`}></div>
    </div>
  )
}