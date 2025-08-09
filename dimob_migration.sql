-- DIMOB Migration SQL
-- Execute este SQL no banco de dados de produção
-- Data: 2025-01-08

-- 1. Adicionar campo includeInDimob na tabela contracts
ALTER TABLE "contracts" 
ADD COLUMN "includeInDimob" BOOLEAN DEFAULT true;

-- 2. Criar tabela DimobServiceCategory
CREATE TABLE "dimob_service_categories" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dimob_service_categories_pkey" PRIMARY KEY ("id")
);

-- 3. Adicionar foreign key para companies
ALTER TABLE "dimob_service_categories" 
ADD CONSTRAINT "dimob_service_categories_companyId_fkey" 
FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Criar índices para performance
CREATE INDEX "dimob_service_categories_companyId_idx" ON "dimob_service_categories"("companyId");
CREATE INDEX "dimob_service_categories_type_idx" ON "dimob_service_categories"("type");

-- 5. Inserir categorias padrão (opcional)
INSERT INTO "dimob_service_categories" ("id", "companyId", "name", "type", "description", "active", "createdAt", "updatedAt") 
VALUES 
    ('default_taxa_admin', 'system', 'Taxa de Administração', 'COMISSAO', 'Taxa cobrada para administração do imóvel', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('default_taxa_locacao', 'system', 'Taxa de Locação', 'COMISSAO', 'Taxa cobrada na intermediação da locação', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('default_aluguel', 'system', 'Aluguel', 'RENDIMENTO', 'Valor do aluguel repassado ao proprietário', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('default_irrf', 'system', 'IRRF', 'IMPOSTO_RETIDO', 'Imposto de Renda Retido na Fonte', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Fim da migração DIMOB