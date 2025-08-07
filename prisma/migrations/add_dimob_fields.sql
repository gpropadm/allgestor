-- Adicionar campos obrigatórios para DIMOB na tabela companies
ALTER TABLE companies 
ADD COLUMN responsibleCpf VARCHAR(11), -- CPF do responsável pela empresa na RFB
ADD COLUMN municipalityCode VARCHAR(4); -- Código IBGE do município

-- Adicionar campos obrigatórios para DIMOB na tabela properties
ALTER TABLE properties 
ADD COLUMN dimobPropertyType CHAR(1) DEFAULT 'U' CHECK (dimobPropertyType IN ('U', 'R')), -- U=Urbano, R=Rural
ADD COLUMN municipalityCode VARCHAR(4), -- Código IBGE do município do imóvel
ADD COLUMN extractedCep VARCHAR(8); -- CEP extraído/validado para DIMOB

-- Comentários para documentação
COMMENT ON COLUMN companies.responsibleCpf IS 'CPF do responsável pela pessoa jurídica perante à RFB (obrigatório DIMOB)';
COMMENT ON COLUMN companies.municipalityCode IS 'Código IBGE do município da empresa (obrigatório DIMOB)';
COMMENT ON COLUMN properties.dimobPropertyType IS 'Tipo do imóvel para DIMOB: U=Urbano, R=Rural (obrigatório DIMOB)';
COMMENT ON COLUMN properties.municipalityCode IS 'Código IBGE do município do imóvel (obrigatório DIMOB)';
COMMENT ON COLUMN properties.extractedCep IS 'CEP extraído e validado para DIMOB (8 dígitos numéricos)';

-- Índices para performance
CREATE INDEX idx_companies_municipality_code ON companies(municipalityCode);
CREATE INDEX idx_properties_municipality_code ON properties(municipalityCode);
CREATE INDEX idx_properties_dimob_type ON properties(dimobPropertyType);