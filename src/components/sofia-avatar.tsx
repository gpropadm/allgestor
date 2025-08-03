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
          {/* Background limpo branco */}
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FAFAFA" />
          </linearGradient>
          
          {/* Cabelo castanho bob ondulado */}
          <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B4513" />
            <stop offset="50%" stopColor="#A0522D" />
            <stop offset="100%" stopColor="#CD853F" />
          </linearGradient>
          
          {/* Pele clara e suave fotorrealista */}
          <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF8E7" />
            <stop offset="50%" stopColor="#FFEFD5" />
            <stop offset="100%" stopColor="#FFE4B5" />
          </linearGradient>
          
          {/* Blazer azul escuro de comissária */}
          <linearGradient id="blazerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          
          {/* Detalhes vermelhos nas ombreiras */}
          <linearGradient id="shoulderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
          
          {/* Blusa branca gola alta */}
          <linearGradient id="shirtGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F9FAFB" />
          </linearGradient>
          
          {/* Sombras para profundidade 3D */}
          <radialGradient id="shadowGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="80%" stopColor="#000000" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
          </radialGradient>
        </defs>
        
        {/* Background branco limpo */}
        <circle cx="50" cy="50" r="48" fill="url(#bgGradient)" />
        
        {/* Sombra corporal 3D */}
        <ellipse cx="50" cy="85" rx="25" ry="10" fill="url(#shadowGradient)" />
        
        {/* Blazer azul escuro de comissária */}
        <path 
          d="M20 72 Q23 65 32 67 L68 67 Q77 65 80 72 L80 95 L20 95 Z" 
          fill="url(#blazerGradient)"
        />
        
        {/* Detalhes vermelhos nas ombreiras */}
        <path d="M20 72 Q25 68 32 70 L32 75 Q25 73 20 77 Z" fill="url(#shoulderGradient)" />
        <path d="M68 70 Q75 68 80 72 L80 77 Q75 73 68 75 Z" fill="url(#shoulderGradient)" />
        
        {/* Gola do blazer estruturada */}
        <path 
          d="M32 67 Q38 63 42 65 L58 65 Q62 63 68 67 L64 70 L58 67 L42 67 L36 70 Z" 
          fill="url(#blazerGradient)"
        />
        
        {/* Botões dourados do uniforme */}
        <circle cx="50" cy="74" r="1.2" fill="#FFD700" stroke="#FFA500" strokeWidth="0.2" />
        <circle cx="50" cy="80" r="1.2" fill="#FFD700" stroke="#FFA500" strokeWidth="0.2" />
        <circle cx="50" cy="86" r="1.2" fill="#FFD700" stroke="#FFA500" strokeWidth="0.2" />
        
        {/* Blusa branca gola alta */}
        <path 
          d="M36 65 Q42 62 50 63 Q58 62 64 65 L62 67 L54 64 L46 64 L38 67 Z" 
          fill="url(#shirtGradient)"
        />
        
        {/* Gola alta da blusa */}
        <path d="M46 64 Q50 61 54 64 L52 65 L48 65 Z" fill="url(#shirtGradient)" />
        
        {/* Crachá retangular da companhia aérea */}
        <rect x="67" y="70" width="8" height="6" rx="0.5" fill="#FFFFFF" stroke="#C0C0C0" strokeWidth="0.2" />
        <rect x="68" y="71" width="2.5" height="2" fill="#E5E7EB" />
        <text x="71.5" y="72.5" textAnchor="middle" fontSize="1.2" fill="#374151" fontWeight="bold">SOFIA</text>
        <circle x="69" y="72" r="0.8" fill="#3B82F6" />
        
        {/* Cordão do crachá */}
        <path d="M71 70 Q71 67 50 64" stroke="#374151" strokeWidth="0.5" strokeDasharray="0.5,0.5" />
        
        {/* Pescoço com sombra 3D */}
        <ellipse cx="50" cy="60" rx="6" ry="7" fill="url(#skinGradient)" />
        <ellipse cx="49" cy="59" rx="1" ry="3" fill="#FFE4B5" opacity="0.5" />
        
        {/* Rosto fotorrealista com volume */}
        <ellipse cx="50" cy="40" rx="16" ry="18" fill="url(#skinGradient)" />
        
        {/* Sombras faciais para profundidade */}
        <ellipse cx="42" cy="45" rx="2" ry="4" fill="#FFE4B5" opacity="0.3" />
        <ellipse cx="58" cy="45" rx="2" ry="4" fill="#FFE4B5" opacity="0.3" />
        <path d="M44 52 Q50 54 56 52" stroke="#FFE4B5" strokeWidth="0.5" opacity="0.4" />
        
        {/* Cabelo castanho bob ondulado */}
        <path 
          d="M34 30 Q34 20 42 16 Q50 13 58 16 Q66 20 66 30 Q66 36 64 40 Q62 44 58 46 L42 46 Q38 44 36 40 Q34 36 34 30 Z" 
          fill="url(#hairGradient)"
        />
        
        {/* Ondulações do bob */}
        <path 
          d="M36 28 Q40 24 44 26 Q48 23 52 25 Q56 23 60 26 Q58 29 55 30 Q52 28 48 29 Q44 28 40 30 Q38 29 36 28 Z" 
          fill="url(#hairGradient)"
        />
        
        {/* Textura ondulada do cabelo */}
        <path d="M38 32 Q42 30 46 32" stroke="#CD853F" strokeWidth="0.3" opacity="0.7" />
        <path d="M54 32 Q58 30 62 32" stroke="#CD853F" strokeWidth="0.3" opacity="0.7" />
        <path d="M40 36 Q44 34 48 36" stroke="#CD853F" strokeWidth="0.3" opacity="0.7" />
        <path d="M52 36 Q56 34 60 36" stroke="#CD853F" strokeWidth="0.3" opacity="0.7" />
        
        {/* Olhos castanhos claros fotorrealistas */}
        <ellipse cx="44" cy="38" rx="2.5" ry="3" fill="white" />
        <ellipse cx="56" cy="38" rx="2.5" ry="3" fill="white" />
        
        {/* Íris castanha clara */}
        <ellipse cx="44" cy="38" rx="1.8" ry="2.2" fill="#D2691E" />
        <ellipse cx="56" cy="38" rx="1.8" ry="2.2" fill="#D2691E" />
        
        {/* Padrão da íris */}
        <circle cx="44" cy="38" r="1.2" fill="#8B4513" opacity="0.3" />
        <circle cx="56" cy="38" r="1.2" fill="#8B4513" opacity="0.3" />
        
        {/* Pupilas */}
        <circle cx="44" cy="38" r="0.8" fill="black" />
        <circle cx="56" cy="38" r="0.8" fill="black" />
        
        {/* Brilho nos olhos hiper-realista */}
        <ellipse cx="44.3" cy="37.5" rx="0.4" ry="0.6" fill="white" opacity="0.9" />
        <ellipse cx="56.3" cy="37.5" rx="0.4" ry="0.6" fill="white" opacity="0.9" />
        <circle cx="43.7" cy="38.2" r="0.2" fill="white" opacity="0.7" />
        <circle cx="55.7" cy="38.2" r="0.2" fill="white" opacity="0.7" />
        
        {/* Cílios superiores */}
        <path d="M41.5 35.5 Q42 35 42.5 35.2" stroke="#654321" strokeWidth="0.3" />
        <path d="M43 35 Q43.5 34.5 44 34.7" stroke="#654321" strokeWidth="0.3" />
        <path d="M45 34.7 Q45.5 34.2 46 34.5" stroke="#654321" strokeWidth="0.3" />
        <path d="M53.5 35.5 Q54 35 54.5 35.2" stroke="#654321" strokeWidth="0.3" />
        <path d="M55 35 Q55.5 34.5 56 34.7" stroke="#654321" strokeWidth="0.3" />
        <path d="M57 34.7 Q57.5 34.2 58 34.5" stroke="#654321" strokeWidth="0.3" />
        
        {/* Sobrancelhas castanhas bem definidas */}
        <path d="M41 35 Q44 34 47 35.5" stroke="#8B4513" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M53 35.5 Q56 34 59 35" stroke="#8B4513" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        
        {/* Textura das sobrancelhas */}
        <path d="M42 35.2 L42.3 34.8" stroke="#654321" strokeWidth="0.2" />
        <path d="M43.5 34.5 L43.8 34.1" stroke="#654321" strokeWidth="0.2" />
        <path d="M45 34.8 L45.3 34.4" stroke="#654321" strokeWidth="0.2" />
        <path d="M57 35.2 L56.7 34.8" stroke="#654321" strokeWidth="0.2" />
        <path d="M55.5 34.5 L55.2 34.1" stroke="#654321" strokeWidth="0.2" />
        <path d="M54 34.8 L53.7 34.4" stroke="#654321" strokeWidth="0.2" />
        
        {/* Nariz delicado com sombreamento */}
        <ellipse cx="50" cy="42" rx="1" ry="1.5" fill="#FFE4B5" opacity="0.8" />
        <path d="M49.5 43 Q50 43.5 50.5 43" stroke="#FFEFD5" strokeWidth="0.3" />
        <ellipse cx="49.7" cy="43.2" rx="0.2" ry="0.3" fill="#FFE4B5" opacity="0.6" />
        <ellipse cx="50.3" cy="43.2" rx="0.2" ry="0.3" fill="#FFE4B5" opacity="0.6" />
        
        {/* Sorriso amigável e confiante */}
        <path d="M45 47 Q50 51 55 47" stroke="#DC143C" strokeWidth="2" strokeLinecap="round" fill="none" />
        
        {/* Dentes brancos visíveis */}
        <ellipse cx="50" cy="49" rx="4" ry="1.2" fill="white" opacity="0.95" />
        <path d="M47 48.5 L47 49.5" stroke="#F0F0F0" strokeWidth="0.2" />
        <path d="M49 48.3 L49 49.7" stroke="#F0F0F0" strokeWidth="0.2" />
        <path d="M51 48.3 L51 49.7" stroke="#F0F0F0" strokeWidth="0.2" />
        <path d="M53 48.5 L53 49.5" stroke="#F0F0F0" strokeWidth="0.2" />
        
        {/* Lábios com volume */}
        <ellipse cx="50" cy="47.5" rx="3" ry="0.8" fill="#DC143C" opacity="0.6" />
        <ellipse cx="50" cy="49.2" rx="2.5" ry="0.6" fill="#B22222" opacity="0.4" />
        
        {/* Blush natural */}
        <ellipse cx="40" cy="43" rx="2.5" ry="3" fill="#FFC0CB" opacity="0.3" />
        <ellipse cx="60" cy="43" rx="2.5" ry="3" fill="#FFC0CB" opacity="0.3" />
        
        {/* Iluminação suave e difusa */}
        <ellipse cx="45" cy="30" rx="20" ry="25" fill="white" opacity="0.1" />
        <ellipse cx="55" cy="35" rx="15" ry="20" fill="white" opacity="0.08" />
        
        {/* Brincos pequenos e elegantes */}
        <circle cx="35" cy="40" r="1" fill="#C0C0C0" />
        <circle cx="65" cy="40" r="1" fill="#C0C0C0" />
        <circle cx="35" cy="40" r="0.5" fill="#E5E5E5" />
      </svg>
      
      {/* Badge de status online */}
      <div className={`absolute -bottom-1 -right-1 ${badgeSizes[size]} bg-green-400 border-2 border-white rounded-full`}></div>
    </div>
  )
}