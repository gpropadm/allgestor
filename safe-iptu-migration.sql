-- Migração segura para adicionar campo IPTU
-- Execute APENAS se recuperar os dados primeiro

-- Adiciona campo propertyRegistration na tabela properties (se não existir)
ALTER TABLE "properties" 
ADD COLUMN IF NOT EXISTS "propertyRegistration" TEXT;

-- Comando para verificar se o campo foi adicionado:
-- SELECT column_name FROM information_schema.columns WHERE table_name='properties' AND column_name='propertyRegistration';