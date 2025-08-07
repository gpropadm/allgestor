-- Migration para adicionar campo contractNumber na tabela Contract
-- Este campo será usado para exibir números de contrato mais amigáveis

-- Adicionar coluna contractNumber
ALTER TABLE "Contract" ADD COLUMN "contractNumber" VARCHAR(50);

-- Criar índice para busca eficiente
CREATE INDEX "Contract_contractNumber_idx" ON "Contract"("contractNumber");

-- Função para gerar número de contrato baseado no ano e sequencial
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
DECLARE
    current_year TEXT;
    next_seq INTEGER;
    new_number TEXT;
BEGIN
    -- Obter ano atual
    current_year := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Obter próximo número sequencial para o ano
    SELECT COALESCE(MAX(
        CASE 
            WHEN "contractNumber" ~ ('^CTR-' || current_year || '-[0-9]+$') 
            THEN CAST(SUBSTRING("contractNumber" FROM (LENGTH('CTR-' || current_year || '-') + 1)) AS INTEGER)
            ELSE 0 
        END
    ), 0) + 1
    INTO next_seq
    FROM "Contract"
    WHERE "userId" = NEW."userId";
    
    -- Gerar novo número no formato CTR-YYYY-NNN
    new_number := 'CTR-' || current_year || '-' || LPAD(next_seq::TEXT, 3, '0');
    
    -- Definir o número do contrato
    NEW."contractNumber" := new_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para gerar número automaticamente
CREATE TRIGGER generate_contract_number_trigger
    BEFORE INSERT ON "Contract"
    FOR EACH ROW
    EXECUTE FUNCTION generate_contract_number();

-- Atualizar contratos existentes com números sequenciais
WITH numbered_contracts AS (
    SELECT 
        id,
        "userId",
        "createdAt",
        ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt") as seq_num
    FROM "Contract"
    WHERE "contractNumber" IS NULL
)
UPDATE "Contract" 
SET "contractNumber" = 'CTR-' || EXTRACT(YEAR FROM numbered_contracts."createdAt")::TEXT || '-' || LPAD(numbered_contracts.seq_num::TEXT, 3, '0')
FROM numbered_contracts
WHERE "Contract".id = numbered_contracts.id;