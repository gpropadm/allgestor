// 🎵 Sistema de Sons para Notificações de Leads

export class NotificationSounds {
  private audioContext: AudioContext | null = null
  private isPlaying: boolean = false
  private audioQueue: (() => void)[] = []
  private isTestingAllSounds: boolean = false

  constructor() {
    // Initialize Web Audio API only in browser environment
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.warn('🔇 Audio API not available:', error)
        this.audioContext = null
      }
    } else {
      // Server-side or audio not supported
      this.audioContext = null
    }
  }

  // 🎵 Som para Match de Lead Normal (Verde)
  playMatchSound() {
    this.playTone([800, 1000, 1200], 0.3, 'sine')
  }

  // 🤝 Som para Parceria (Verde WhatsApp) - Som suave e amigável
  playPartnershipSound() {
    this.playTone([523, 659, 784, 659], 0.25, 'sine') // Dó, Mi, Sol, Mi - acorde alegre
  }

  // 👑 Som para Lead VIP Gold
  playVipGoldSound() {
    this.playTone([1200, 1400, 1600, 1800], 0.5, 'sawtooth')
  }

  // ⭐ Som para Lead VIP Platinum
  playVipPlatinumSound() {
    this.playTone([1000, 1300, 1600, 1300, 1000], 0.6, 'sine')
  }

  // 💎 Som para Lead VIP Diamond
  playVipDiamondSound() {
    this.playTone([1500, 1800, 2100, 2400, 2100, 1800], 0.7, 'triangle')
  }

  // 🚨 Som para Lead Urgente
  playUrgentSound() {
    this.playTone([1000, 500, 1000, 500, 1000], 0.8, 'square')
  }

  // 🌙 Som para Lead Noturno (mais suave)
  playNightSound() {
    this.playTone([400, 600, 800], 0.2, 'sine')
  }

  // 💰 Som para Lead Alto Valor
  playHighValueSound() {
    this.playTone([800, 1200, 1600, 2000, 1600, 1200], 0.6, 'sawtooth')
  }

  private playTone(frequencies: number[], volume: number = 0.5, waveType: OscillatorType = 'sine') {
    const toneFunction = () => {
      if (!this.audioContext) return

      try {
        const duration = 0.15 // Duration of each note
        const gap = 0.05 // Gap between notes

        frequencies.forEach((freq, index) => {
          const oscillator = this.audioContext!.createOscillator()
          const gainNode = this.audioContext!.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(this.audioContext!.destination)

          oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime)
          oscillator.type = waveType

          // Envelope for smooth sound
          const startTime = this.audioContext!.currentTime + (index * (duration + gap))
          const endTime = startTime + duration

          gainNode.gain.setValueAtTime(0, startTime)
          gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01)
          gainNode.gain.exponentialRampToValueAtTime(0.01, endTime)

          oscillator.start(startTime)
          oscillator.stop(endTime)
        })
      } catch (error) {
        console.log('Audio playback error:', error)
        // Fallback to simple beep
        this.playSimpleBeep()
      }
    }

    // Add tone to queue to prevent overlap
    this.queueAudio(toneFunction)
  }

  // 🎵 Audio queue management
  private processAudioQueue() {
    if (this.isPlaying || this.audioQueue.length === 0) return
    
    this.isPlaying = true
    const nextAudio = this.audioQueue.shift()!
    nextAudio()
    
    // Set playing to false after audio duration + pause interval
    setTimeout(() => {
      this.isPlaying = false
      this.processAudioQueue() // Process next in queue
    }, 2000) // 2 second interval between sounds
  }

  // 🎵 Add audio to queue to prevent overlap
  private queueAudio(audioFunction: () => void) {
    this.audioQueue.push(audioFunction)
    this.processAudioQueue()
  }

  // 🎵 Play custom audio file with timing control
  private playAudioFile(filename: string, volume: number = 0.5, startTime: number = 0, duration?: number) {
    const audioFunction = () => {
      try {
        const audio = new Audio(`/sounds/${filename}`)
        audio.volume = Math.min(Math.max(volume, 0), 1) // Clamp between 0 and 1
        
        // Set start time if specified
        if (startTime > 0) {
          audio.currentTime = startTime
        }
        
        // Set duration limit if specified
        if (duration && duration > 0) {
          audio.addEventListener('loadedmetadata', () => {
            // Stop audio after specified duration
            setTimeout(() => {
              if (!audio.paused && !audio.ended) {
                audio.pause()
                audio.currentTime = 0
              }
            }, duration * 1000) // Convert to milliseconds
          })
        }
        
        audio.play().catch(error => {
          console.log('Custom audio playback error:', error)
          // Fallback to simple beep if custom audio fails
          this.playSimpleBeep()
        })
      } catch (error) {
        console.log('Custom audio loading error:', error)
        // Fallback to simple beep if custom audio fails
        this.playSimpleBeep()
      }
    }
    
    // Add to queue to prevent overlap
    this.queueAudio(audioFunction)
  }

  // Fallback simple beep
  private playSimpleBeep() {
    if (!this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.3)
    } catch (error) {
      console.log('Simple beep error:', error)
    }
  }

  // 🚨 Som de Alarme (Urgente)
  playAlarmSound() {
    // Alarme com frequências alternadas rápidas
    this.playTone([1000, 800, 1000, 800, 1000], 0.6, 'square')
  }

  // 🔴 Som Red (Alerta/Atenção)
  playRedSound() {
    // Som de atenção com frequências descendentes
    this.playTone([880, 740, 659, 587], 0.4, 'sine') // Lá, Fá#, Mi, Ré - progressão descendente
  }

  // 🎨 SONS POR COR/TEMA
  playGreenSound() {
    this.playTone([523, 659, 784], 0.3, 'sine') // Dó, Mi, Sol - acorde maior fresco
  }

  playBlueSound() {
    this.playTone([440, 554, 659], 0.25, 'sine') // Lá, Dó#, Mi - calmo e profissional
  }

  playYellowSound() {
    this.playTone([587, 740, 880, 1047], 0.35, 'sine') // Ré, Fá#, Lá, Dó - alegre e otimista
  }

  playPurpleSound() {
    this.playTone([349, 523, 698, 1047], 0.4, 'sine') // Fá, Dó, Fá, Dó - elegante e sofisticado
  }

  playOrangeSound() {
    this.playTone([659, 831, 1047, 1319], 0.45, 'triangle') // Mi, Sol#, Dó, Mi - energético
  }

  // 🎼 SONS MUSICAIS
  playChordMajorSound() {
    this.playTone([523, 659, 784, 1047], 0.4, 'sine') // Dó maior - alegre
  }

  playChordMinorSound() {
    this.playTone([523, 622, 784, 1047], 0.35, 'sine') // Dó menor - dramático
  }

  playBellSound() {
    this.playTone([1047, 1175, 1397, 1047], 0.3, 'triangle') // Som de sino
  }

  playFanfareSound() {
    this.playTone([523, 659, 784, 1047, 1319], 0.5, 'sawtooth') // Fanfarra de sucesso
  }

  playMelodySound() {
    this.playTone([523, 587, 659, 698, 784, 880, 988, 1047], 0.35, 'sine') // Escala ascendente
  }

  // 🌟 SONS POR INTENSIDADE
  playGentleSound() {
    this.playTone([440, 523, 659], 0.15, 'sine') // Muito suave
  }

  playSoftSound() {
    this.playTone([523, 659, 784], 0.2, 'sine') // Suave
  }

  playMediumSound() {
    this.playTone([659, 784, 988], 0.4, 'sine') // Médio
  }

  playStrongSound() {
    this.playTone([784, 988, 1175], 0.6, 'triangle') // Forte
  }

  playIntenseSound() {
    this.playTone([880, 1047, 1319, 1568], 0.8, 'sawtooth') // Muito intenso
  }

  // 🎯 SONS POR FUNÇÃO
  playAnnouncementSound() {
    this.playTone([784, 1047, 784, 1047], 0.5, 'square') // Para anúncios
  }

  playSuccessSound() {
    this.playTone([523, 659, 784, 1047, 1319], 0.4, 'sine') // Para sucessos
  }

  playWarningSound() {
    this.playTone([740, 659, 740, 659], 0.5, 'triangle') // Para avisos
  }

  playErrorSound() {
    this.playTone([392, 330, 277], 0.6, 'sawtooth') // Para erros
  }

  playInfoSound() {
    this.playTone([659, 784, 880], 0.3, 'sine') // Para informações
  }

  // 🌍 SONS POR ESTILO
  playCorporateSound() {
    this.playTone([440, 554, 659, 831], 0.35, 'sine') // Corporativo profissional
  }

  playGamingSound() {
    this.playTone([659, 831, 1047, 831, 659], 0.4, 'square') // Estilo games
  }

  playModernSound() {
    this.playTone([880, 1175, 1568, 2093], 0.3, 'triangle') // Moderno e tech
  }

  playFunSound() {
    this.playTone([523, 698, 880, 1175, 1568, 1175, 880, 698], 0.4, 'sine') // Divertido
  }

  playZenSound() {
    this.playTone([220, 277, 330, 370], 0.2, 'sine') // Relaxante e zen
  }

  // ⏰ SONS POR CONTEXTO
  playMorningSound() {
    this.playTone([523, 659, 784, 1047], 0.35, 'sine') // Som matinal
  }

  playAfternoonSound() {
    this.playTone([659, 784, 988, 1175], 0.4, 'sine') // Som diurno
  }

  playEveningSound() {
    this.playTone([440, 523, 659, 784], 0.3, 'sine') // Som vespertino
  }

  playMidnightSound() {
    this.playTone([330, 415, 523], 0.2, 'sine') // Som noturno
  }

  playReminderSound() {
    this.playTone([784, 988, 784], 0.35, 'triangle') // Som de lembrete
  }

  // 🎵 SOM PERSONALIZADO
  playCustomSound() {
    // Toca o áudio personalizado que você criou (com fila automática para múltiplas notificações)
    this.playAudioFile('mp3.mp3', 0.6)
  }

  // 🎵 SOM PERSONALIZADO - Versão completa (sem corte)
  playCustomSoundFull() {
    // Toca o áudio completo sem limitação de tempo
    this.playAudioFile('mp3.mp3', 0.6)
  }

  // 🎵 SOM PERSONALIZADO - Apenas uma parte específica
  playCustomSoundClip(startSeconds: number = 0, durationSeconds: number = 2) {
    // Permite controle personalizado do tempo
    this.playAudioFile('mp3.mp3', 0.6, startSeconds, durationSeconds)
  }

  // 🎯 Som por tipo - ARSENAL COMPLETO
  playByType(type: 'match' | 'partnership' | 'vip-gold' | 'vip-platinum' | 'vip-diamond' | 'urgent' | 'night' | 'high-value' | 'alarm' | 'red' |
    // Cores
    'green' | 'blue' | 'yellow' | 'purple' | 'orange' |
    // Musicais  
    'chord-major' | 'chord-minor' | 'bell' | 'fanfare' | 'melody' |
    // Intensidade
    'gentle' | 'soft' | 'medium' | 'strong' | 'intense' |
    // Função
    'announcement' | 'success' | 'warning' | 'error' | 'info' |
    // Estilo
    'corporate' | 'gaming' | 'modern' | 'fun' | 'zen' |
    // Contexto
    'morning' | 'afternoon' | 'evening' | 'midnight' | 'reminder' |
    // Personalizado
    'custom' | 'custom-full' | 'custom-short') {
    switch (type) {
      case 'match':
        this.playMatchSound()
        break
      case 'partnership':
        this.playPartnershipSound()
        break
      case 'vip-gold':
        this.playVipGoldSound()
        break
      case 'vip-platinum':
        this.playVipPlatinumSound()
        break
      case 'vip-diamond':
        this.playVipDiamondSound()
        break
      case 'urgent':
        this.playUrgentSound()
        break
      case 'night':
        this.playNightSound()
        break
      case 'high-value':
        this.playHighValueSound()
        break
      case 'alarm':
        this.playAlarmSound()
        break
      case 'red':
        this.playRedSound()
        break
      // Cores
      case 'green':
        this.playGreenSound()
        break
      case 'blue':
        this.playBlueSound()
        break
      case 'yellow':
        this.playYellowSound()
        break
      case 'purple':
        this.playPurpleSound()
        break
      case 'orange':
        this.playOrangeSound()
        break
      // Musicais
      case 'chord-major':
        this.playChordMajorSound()
        break
      case 'chord-minor':
        this.playChordMinorSound()
        break
      case 'bell':
        this.playBellSound()
        break
      case 'fanfare':
        this.playFanfareSound()
        break
      case 'melody':
        this.playMelodySound()
        break
      // Intensidade
      case 'gentle':
        this.playGentleSound()
        break
      case 'soft':
        this.playSoftSound()
        break
      case 'medium':
        this.playMediumSound()
        break
      case 'strong':
        this.playStrongSound()
        break
      case 'intense':
        this.playIntenseSound()
        break
      // Função
      case 'announcement':
        this.playAnnouncementSound()
        break
      case 'success':
        this.playSuccessSound()
        break
      case 'warning':
        this.playWarningSound()
        break
      case 'error':
        this.playErrorSound()
        break
      case 'info':
        this.playInfoSound()
        break
      // Estilo
      case 'corporate':
        this.playCorporateSound()
        break
      case 'gaming':
        this.playGamingSound()
        break
      case 'modern':
        this.playModernSound()
        break
      case 'fun':
        this.playFunSound()
        break
      case 'zen':
        this.playZenSound()
        break
      // Contexto
      case 'morning':
        this.playMorningSound()
        break
      case 'afternoon':
        this.playAfternoonSound()
        break
      case 'evening':
        this.playEveningSound()
        break
      case 'midnight':
        this.playMidnightSound()
        break
      case 'reminder':
        this.playReminderSound()
        break
      // Personalizado
      case 'custom':
        this.playCustomSound()
        break
      case 'custom-full':
        this.playCustomSoundFull()
        break
      case 'custom-short':
        this.playCustomSoundClip(0, 1.5) // 1.5 segundos
        break
      default:
        this.playMatchSound()
    }
  }

  // 🔇 Verificar se áudio está disponível
  isAudioAvailable(): boolean {
    return !!this.audioContext
  }

  // 📋 Listar todos os sons disponíveis
  getAvailableSounds() {
    return [
      // Sons básicos
      { type: 'match', name: '🎯 Match Normal', description: 'Som para matches de leads', volume: 0.3, category: 'Básicos' },
      { type: 'partnership', name: '🤝 Parceria', description: 'Som harmônico para parcerias', volume: 0.25, category: 'Básicos' },
      { type: 'red', name: '🔴 Atenção', description: 'Som chamativo para alertas importantes', volume: 0.4, category: 'Básicos' },
      { type: 'alarm', name: '🚨 Alarme', description: 'Som de alarme forte', volume: 0.6, category: 'Básicos' },
      
      // VIP
      { type: 'vip-gold', name: '👑 VIP Gold', description: 'Som premium para leads VIP', volume: 0.5, category: 'VIP' },
      { type: 'vip-platinum', name: '⭐ VIP Platinum', description: 'Som elegante para leads premium', volume: 0.6, category: 'VIP' },
      { type: 'vip-diamond', name: '💎 VIP Diamond', description: 'Som luxuoso para leads top', volume: 0.7, category: 'VIP' },
      { type: 'high-value', name: '💰 Alto Valor', description: 'Som para leads de alto valor', volume: 0.6, category: 'VIP' },
      { type: 'urgent', name: '🚨 Urgente', description: 'Som de urgência', volume: 0.8, category: 'VIP' },
      { type: 'night', name: '🌙 Noturno', description: 'Som suave para horários noturnos', volume: 0.2, category: 'VIP' },

      // Sons por Cor/Tema
      { type: 'green', name: '🟢 Verde', description: 'Som fresco e natural', volume: 0.3, category: 'Cores' },
      { type: 'blue', name: '🔵 Azul', description: 'Som calmo e profissional', volume: 0.25, category: 'Cores' },
      { type: 'yellow', name: '🟡 Amarelo', description: 'Som alegre e otimista', volume: 0.35, category: 'Cores' },
      { type: 'purple', name: '🟣 Roxo', description: 'Som elegante e sofisticado', volume: 0.4, category: 'Cores' },
      { type: 'orange', name: '🟠 Laranja', description: 'Som energético e vibrante', volume: 0.45, category: 'Cores' },

      // Sons Musicais
      { type: 'chord-major', name: '🎵 Acorde Maior', description: 'Som harmônico alegre', volume: 0.4, category: 'Musical' },
      { type: 'chord-minor', name: '🎶 Acorde Menor', description: 'Som dramático e profundo', volume: 0.35, category: 'Musical' },
      { type: 'bell', name: '🔔 Sino', description: 'Som cristalino de sino', volume: 0.3, category: 'Musical' },
      { type: 'fanfare', name: '🎺 Fanfarra', description: 'Som triunfal de sucesso', volume: 0.5, category: 'Musical' },
      { type: 'melody', name: '🎼 Melodia', description: 'Escala musical ascendente', volume: 0.35, category: 'Musical' },

      // Sons por Intensidade
      { type: 'gentle', name: '🌸 Suave', description: 'Som muito delicado', volume: 0.15, category: 'Intensidade' },
      { type: 'soft', name: '🤫 Baixo', description: 'Som discreto', volume: 0.2, category: 'Intensidade' },
      { type: 'medium', name: '🔊 Médio', description: 'Som equilibrado', volume: 0.4, category: 'Intensidade' },
      { type: 'strong', name: '📢 Alto', description: 'Som forte e claro', volume: 0.6, category: 'Intensidade' },
      { type: 'intense', name: '💥 Intenso', description: 'Som muito forte', volume: 0.8, category: 'Intensidade' },

      // Sons por Função
      { type: 'announcement', name: '📢 Anúncio', description: 'Som para anúncios importantes', volume: 0.5, category: 'Função' },
      { type: 'success', name: '✅ Sucesso', description: 'Som de conquista', volume: 0.4, category: 'Função' },
      { type: 'warning', name: '⚠️ Aviso', description: 'Som de alerta moderado', volume: 0.5, category: 'Função' },
      { type: 'error', name: '❌ Erro', description: 'Som de problema', volume: 0.6, category: 'Função' },
      { type: 'info', name: 'ℹ️ Informação', description: 'Som informativo', volume: 0.3, category: 'Função' },

      // Sons por Estilo
      { type: 'corporate', name: '🏢 Corporativo', description: 'Som profissional', volume: 0.35, category: 'Estilo' },
      { type: 'gaming', name: '🎮 Games', description: 'Som estilo videogame', volume: 0.4, category: 'Estilo' },
      { type: 'modern', name: '⚡ Moderno', description: 'Som tecnológico', volume: 0.3, category: 'Estilo' },
      { type: 'fun', name: '🎉 Divertido', description: 'Som alegre e animado', volume: 0.4, category: 'Estilo' },
      { type: 'zen', name: '🧘 Zen', description: 'Som relaxante', volume: 0.2, category: 'Estilo' },

      // Sons por Contexto/Horário
      { type: 'morning', name: '🌅 Manhã', description: 'Som matinal energizante', volume: 0.35, category: 'Contexto' },
      { type: 'afternoon', name: '☀️ Tarde', description: 'Som diurno produtivo', volume: 0.4, category: 'Contexto' },
      { type: 'evening', name: '🌆 Noite', description: 'Som vespertino tranquilo', volume: 0.3, category: 'Contexto' },
      { type: 'midnight', name: '🌙 Madrugada', description: 'Som noturno discreto', volume: 0.2, category: 'Contexto' },
      { type: 'reminder', name: '⏰ Lembrete', description: 'Som de lembrete', volume: 0.35, category: 'Contexto' },

      // Som Personalizado
      { type: 'custom', name: '🎵 Som Personalizado', description: 'Seu áudio personalizado - intervalo automático entre múltiplas notificações', volume: 0.6, category: 'Personalizado' },
      { type: 'custom-full', name: '🎵 Som Completo', description: 'Seu áudio personalizado - versão completa', volume: 0.6, category: 'Personalizado' },
      { type: 'custom-short', name: '🎵 Som Curto (1.5s)', description: 'Seu áudio personalizado - versão curta', volume: 0.6, category: 'Personalizado' }
    ] as const
  }

  // 🎵 Tocar som específico com log
  playSoundWithLog(type: string) {
    const soundInfo = this.getAvailableSounds().find(s => s.type === type)
    if (soundInfo) {
      console.log(`🎵 Tocando: ${soundInfo.name} - ${soundInfo.description}`)
      this.playByType(type as any)
    }
  }

  // 🎼 Testar todos os sons sequencialmente
  testAllSounds() {
    if (!this.isAudioAvailable()) {
      console.log('🔇 Áudio indisponível para testar sons')
      return
    }

    if (this.isTestingAllSounds) {
      console.log('⚠️ Teste de sons já em andamento, ignorando...')
      return
    }

    this.isTestingAllSounds = true
    const sounds = ['urgent', 'partnership', 'vip-gold', 'vip-platinum', 'vip-diamond', 'match', 'night', 'high-value']
    let currentIndex = 0

    const playNext = () => {
      if (currentIndex < sounds.length) {
        const soundType = sounds[currentIndex]
        console.log(`🎵 Testando som ${currentIndex + 1}/${sounds.length}: ${soundType}`)
        this.playByType(soundType as any)
        currentIndex++
        setTimeout(playNext, 1000) // Espera 1 segundo entre os sons
      } else {
        console.log('🎼 Teste de todos os sons concluído!')
        this.isTestingAllSounds = false
      }
    }

    console.log('🎼 Iniciando teste de todos os sons...')
    playNext()
  }
}

// Singleton instance
let notificationSoundsInstance: NotificationSounds | null = null

// Get or create singleton instance
export const getNotificationSounds = () => {
  if (!notificationSoundsInstance) {
    notificationSoundsInstance = new NotificationSounds()
  }
  return notificationSoundsInstance
}

export const notificationSounds = getNotificationSounds()

// Expose globally for console testing (browser only) - APENAS QUANDO SOLICITADO
if (typeof window !== 'undefined') {
  // Evitar múltiplas instâncias - usar singleton global
  if (!(window as any).notificationSounds) {
    (window as any).notificationSounds = notificationSounds
    console.log('🎵 NotificationSounds disponível via window.notificationSounds')
  }
}