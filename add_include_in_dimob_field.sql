-- Migração para adicionar campo includeInDimob na tabela contracts
-- Execute este SQL no seu SQL Editor do banco de dados

-- 1. Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
    -- Verificar se a coluna includeInDimob já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'includeInDimob'
        AND table_schema = 'public'
    ) THEN
        -- Adicionar a coluna se ela não existir
        ALTER TABLE "contracts" 
        ADD COLUMN "includeInDimob" BOOLEAN DEFAULT true;
        
        RAISE NOTICE 'Campo includeInDimob adicionado à tabela contracts com sucesso!';
    ELSE
        RAISE NOTICE 'Campo includeInDimob já existe na tabela contracts.';
    END IF;
END $$;

-- 2. Atualizar todos os contratos existentes para includeInDimob = true (por segurança)
UPDATE "contracts" 
SET "includeInDimob" = true 
WHERE "includeInDimob" IS NULL;

-- 3. Verificar o resultado
SELECT 
    id,
    "contractNumber",
    "includeInDimob",
    "createdAt"
FROM "contracts" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Resultado esperado: todos os contratos devem ter includeInDimob = true