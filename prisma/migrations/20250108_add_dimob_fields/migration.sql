-- Migration: Add DIMOB fields
-- Date: 2025-01-08
-- Description: Adds fields for DIMOB configuration and service categories

-- Add includeInDimob field to contracts table
ALTER TABLE contracts ADD COLUMN "includeInDimob" BOOLEAN DEFAULT true;

-- Create DIMOB service categories table  
CREATE TABLE "dimob_service_categories" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- COMISSAO, RENDIMENTO, IMPOSTO_RETIDO
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dimob_service_categories_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "dimob_service_categories" ADD CONSTRAINT "dimob_service_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX "dimob_service_categories_companyId_idx" ON "dimob_service_categories"("companyId");
CREATE INDEX "dimob_service_categories_type_idx" ON "dimob_service_categories"("type");

-- Insert default service categories
INSERT INTO "dimob_service_categories" ("id", "companyId", "name", "type", "description") 
VALUES 
    ('default_taxa_admin', 'system', 'Taxa de Administração', 'COMISSAO', 'Taxa cobrada para administração do imóvel'),
    ('default_taxa_locacao', 'system', 'Taxa de Locação', 'COMISSAO', 'Taxa cobrada na intermediação da locação'),
    ('default_aluguel', 'system', 'Aluguel', 'RENDIMENTO', 'Valor do aluguel repassado ao proprietário'),
    ('default_irrf', 'system', 'IRRF', 'IMPOSTO_RETIDO', 'Imposto de Renda Retido na Fonte');