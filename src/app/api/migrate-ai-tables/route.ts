import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    // Executar a migração SQL diretamente
    await prisma.$executeRaw`
      -- Criar tabela de assistentes IA
      CREATE TABLE IF NOT EXISTS ai_assistants (
          id TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "companyId" TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          personality TEXT,
          speciality TEXT,
          "systemPrompt" TEXT NOT NULL,
          "contextFilePath" TEXT,
          "isActive" BOOLEAN DEFAULT true,
          "isPrimary" BOOLEAN DEFAULT false,
          "avatarUrl" TEXT,
          settings TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT fk_ai_assistants_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT fk_ai_assistants_company FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT unique_user_assistant_name UNIQUE ("userId", name)
      );
    `

    await prisma.$executeRaw`
      -- Criar tabela de conversas com assistentes
      CREATE TABLE IF NOT EXISTS ai_conversations (
          id TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "assistantId" TEXT NOT NULL,
          title TEXT,
          "contextData" TEXT,
          "lastActivity" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT fk_ai_conversations_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT fk_ai_conversations_assistant FOREIGN KEY ("assistantId") REFERENCES ai_assistants(id) ON DELETE CASCADE
      );
    `

    await prisma.$executeRaw`
      -- Criar tabela de mensagens das conversas
      CREATE TABLE IF NOT EXISTS ai_messages (
          id TEXT PRIMARY KEY,
          "conversationId" TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('USER', 'ASSISTANT')),
          content TEXT NOT NULL,
          "mcpData" TEXT,
          "tokensUsed" INTEGER DEFAULT 0,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT fk_ai_messages_conversation FOREIGN KEY ("conversationId") REFERENCES ai_conversations(id) ON DELETE CASCADE
      );
    `

    // Criar índices para performance
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_ai_assistants_user ON ai_assistants("userId");`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_ai_assistants_company ON ai_assistants("companyId");`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations("userId");`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_ai_conversations_assistant ON ai_conversations("assistantId");`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages("conversationId");`

    return NextResponse.json({ 
      success: true, 
      message: 'Tabelas AI criadas com sucesso!' 
    })

  } catch (error) {
    console.error('Erro ao criar tabelas AI:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao criar tabelas AI',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}