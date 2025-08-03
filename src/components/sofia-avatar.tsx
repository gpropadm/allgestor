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
          {/* Background neutro profissional */}
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          
          {/* Cabelo preto */}
          <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1F2937" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          
          {/* Pele natural realista */}
          <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF2E7" />
            <stop offset="100%" stopColor="#FDE6D3" />
          </linearGradient>
          
          {/* Blazer azul royal */}
          <linearGradient id="blazerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          
          {/* Camisa branca */}
          <linearGradient id="shirtGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
        </defs>
        
        {/* Background neutro profissional */}
        <circle cx="50" cy="50" r="48" fill="url(#bgGradient)" />
        
        {/* Blazer azul royal */}
        <path 
          d="M22 75 Q25 68 35 70 L65 70 Q75 68 78 75 L78 95 L22 95 Z" 
          fill="url(#blazerGradient)"
        />
        
        {/* Gola do blazer */}
        <path 
          d="M35 70 Q40 66 45 68 L55 68 Q60 66 65 70 L60 72 L55 70 L45 70 L40 72 Z" 
          fill="url(#blazerGradient)"
        />
        
        {/* Botões pretos discretos */}
        <circle cx="50" cy="76" r="1" fill="#1F2937" />
        <circle cx="50" cy="82" r="1" fill="#1F2937" />
        <circle cx="50" cy="88" r="1" fill="#1F2937" />
        
        {/* Camisa branca por baixo */}
        <path 
          d="M40 68 Q45 65 50 66 Q55 65 60 68 L58 70 L52 68 L48 68 L42 70 Z" 
          fill="url(#shirtGradient)"
        />
        
        {/* Crachá azul claro no pescoço */}
        <ellipse cx="50" cy="72" rx="4" ry="2" fill="#BAE6FD" />
        <text x="50" y="73" textAnchor="middle" fontSize="3" fill="#1E40AF" fontWeight="bold">SOFIA</text>
        
        {/* Cordão do crachá */}
        <path d="M50 65 Q50 68 50 70" stroke="#2563EB" strokeWidth="1" />
        
        {/* Pescoço */}
        <ellipse cx="50" cy="60" rx="5" ry="6" fill="url(#skinGradient)" />
        
        {/* Rosto adulto profissional */}
        <ellipse cx="50" cy="42" rx="15" ry="17" fill="url(#skinGradient)" />
        
        {/* Cabelo preto curto e alinhado */}
        <path 
          d="M35 32 Q35 22 42 18 Q50 15 58 18 Q65 22 65 32 Q65 38 62 42 Q60 45 56 46 L44 46 Q40 45 38 42 Q35 38 35 32 Z" 
          fill="url(#hairGradient)"
        />
        
        {/* Cabelo bem penteado lateral */}
        <path 
          d="M37 30 Q42 25 46 27 Q50 24 54 27 Q58 25 63 30 Q60 32 56 31 Q52 29 48 30 Q44 29 40 31 Q37 32 37 30 Z" 
          fill="url(#hairGradient)"
        />
        
        {/* Olhos profissionais */}
        <ellipse cx="45" cy="40" rx="2.2" ry="2.5" fill="white" />
        <ellipse cx="55" cy="40" rx="2.2" ry="2.5" fill="white" />
        <ellipse cx="45" cy="40" rx="1.5" ry="1.8" fill="#374151" />
        <ellipse cx="55" cy="40" rx="1.5" ry="1.8" fill="#374151" />
        
        {/* Pupilas */}
        <circle cx="45" cy="40" r="0.7" fill="black" />
        <circle cx="55" cy="40" r="0.7" fill="black" />
        
        {/* Brilho nos olhos */}
        <circle cx="45.2" cy="39.5" r="0.3" fill="white" />
        <circle cx="55.2" cy="39.5" r="0.3" fill="white" />
        
        {/* Sobrancelhas bem definidas */}
        <path d="M42 37 Q45 36 48 37" stroke="#1F2937" strokeWidth="1" strokeLinecap="round" fill="none" />
        <path d="M52 37 Q55 36 58 37" stroke="#1F2937" strokeWidth="1" strokeLinecap="round" fill="none" />
        
        {/* Nariz delicado */}
        <ellipse cx="50" cy="43" rx="0.7" ry="1" fill="#FDE6D3" opacity="0.7" />
        
        {/* Sorriso profissional com dentes visíveis */}
        <path d="M46 47 Q50 50 54 47" stroke="#EC4899" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <ellipse cx="50" cy="48.5" rx="3" ry="0.7" fill="white" opacity="0.95" />
        
        {/* Batom rosa claro */}
        <ellipse cx="50" cy="48" rx="2" ry="0.6" fill="#F9A8D4" opacity="0.8" />
        
        {/* Blush nas bochechas */}
        <circle cx="41" cy="44" r="1.5" fill="#F9A8D4" opacity="0.3" />
        <circle cx="59" cy="44" r="1.5" fill="#F9A8D4" opacity="0.3" />
        
        {/* Brincos discretos */}
        <circle cx="37" cy="42" r="0.8" fill="#D1D5DB" />
        <circle cx="63" cy="42" r="0.8" fill="#D1D5DB" />
        
        {/* Badge SOFIA discreto */}
        <circle cx="75" cy="25" r="6" fill="white" opacity="0.9" />
        <text x="75" y="27" textAnchor="middle" fontSize="5" fill="#1E40AF" fontWeight="bold">S</text>
      </svg>
      
      {/* Badge de status online */}
      <div className={`absolute -bottom-1 -right-1 ${badgeSizes[size]} bg-green-400 border-2 border-white rounded-full`}></div>
    </div>
  )
}