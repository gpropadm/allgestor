-- Script de recuperação para dados cadastrados hoje (26/06/2025)
-- Execute este script na branch de recuperação do Neon

-- 1. VERIFICAR DADOS PERDIDOS DE HOJE
-- Usuários criados hoje
SELECT 'USERS_TODAY' as table_name, COUNT(*) as count 
FROM users 
WHERE DATE(createdAt) = '2025-06-26';

-- Propriedades criadas hoje  
SELECT 'PROPERTIES_TODAY' as table_name, COUNT(*) as count
FROM properties 
WHERE DATE(createdAt) = '2025-06-26';

-- Proprietários criados hoje
SELECT 'OWNERS_TODAY' as table_name, COUNT(*) as count
FROM owners 
WHERE DATE(createdAt) = '2025-06-26';

-- Inquilinos criados hoje
SELECT 'TENANTS_TODAY' as table_name, COUNT(*) as count
FROM tenants 
WHERE DATE(createdAt) = '2025-06-26';

-- Contratos criados hoje
SELECT 'CONTRACTS_TODAY' as table_name, COUNT(*) as count
FROM contracts 
WHERE DATE(createdAt) = '2025-06-26';

-- Configurações alteradas hoje
SELECT 'SETTINGS_TODAY' as table_name, COUNT(*) as count
FROM settings 
WHERE DATE(updatedAt) = '2025-06-26';

-- 2. EXTRAIR DADOS PARA INSERÇÃO
-- Usuários de hoje (formato INSERT)
SELECT 
  'INSERT INTO users (id, email, name, password, phone, role, companyId, isActive, isBlocked, lastLogin, createdAt, updatedAt) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(email) || ', ' ||
  quote_literal(name) || ', ' ||
  quote_literal(password) || ', ' ||
  COALESCE(quote_literal(phone), 'NULL') || ', ' ||
  quote_literal(role) || ', ' ||
  COALESCE(quote_literal(companyId), 'NULL') || ', ' ||
  isActive || ', ' ||
  isBlocked || ', ' ||
  COALESCE(quote_literal(lastLogin::text), 'NULL') || ', ' ||
  quote_literal(createdAt::text) || ', ' ||
  quote_literal(updatedAt::text) || ');'
FROM users 
WHERE DATE(createdAt) = '2025-06-26';

-- Propriedades de hoje (formato INSERT)
SELECT 
  'INSERT INTO properties (id, title, description, address, city, state, zipCode, bedrooms, bathrooms, area, rentPrice, salePrice, propertyType, status, availableFor, ownerId, companyId, userId, images, amenities, acceptsPartnership, acceptsFinancing, createdAt, updatedAt) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(title) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  quote_literal(address) || ', ' ||
  quote_literal(city) || ', ' ||
  quote_literal(state) || ', ' ||
  quote_literal(zipCode) || ', ' ||
  bedrooms || ', ' ||
  bathrooms || ', ' ||
  area || ', ' ||
  rentPrice || ', ' ||
  COALESCE(salePrice::text, 'NULL') || ', ' ||
  quote_literal(propertyType::text) || ', ' ||
  quote_literal(status::text) || ', ' ||
  quote_literal(availableFor) || ', ' ||
  quote_literal(ownerId) || ', ' ||
  quote_literal(companyId) || ', ' ||
  quote_literal(userId) || ', ' ||
  quote_literal(images) || ', ' ||
  quote_literal(amenities) || ', ' ||
  acceptsPartnership || ', ' ||
  acceptsFinancing || ', ' ||
  quote_literal(createdAt::text) || ', ' ||
  quote_literal(updatedAt::text) || ');'
FROM properties 
WHERE DATE(createdAt) = '2025-06-26';

-- Proprietários de hoje (formato INSERT)
SELECT 
  'INSERT INTO owners (id, name, email, phone, document, address, city, state, zipCode, companyId, userId, createdAt, updatedAt) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ', ' ||
  quote_literal(email) || ', ' ||
  quote_literal(phone) || ', ' ||
  quote_literal(document) || ', ' ||
  quote_literal(address) || ', ' ||
  quote_literal(city) || ', ' ||
  quote_literal(state) || ', ' ||
  quote_literal(zipCode) || ', ' ||
  COALESCE(quote_literal(companyId), 'NULL') || ', ' ||
  quote_literal(userId) || ', ' ||
  quote_literal(createdAt::text) || ', ' ||
  quote_literal(updatedAt::text) || ');'
FROM owners 
WHERE DATE(createdAt) = '2025-06-26';

-- Inquilinos de hoje (formato INSERT)
SELECT 
  'INSERT INTO tenants (id, name, email, phone, document, address, city, state, zipCode, income, companyId, userId, emergencyContact, occupation, createdAt, updatedAt) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ', ' ||
  quote_literal(email) || ', ' ||
  quote_literal(phone) || ', ' ||
  quote_literal(document) || ', ' ||
  quote_literal(address) || ', ' ||
  quote_literal(city) || ', ' ||
  quote_literal(state) || ', ' ||
  quote_literal(zipCode) || ', ' ||
  income || ', ' ||
  quote_literal(companyId) || ', ' ||
  quote_literal(userId) || ', ' ||
  COALESCE(quote_literal(emergencyContact), 'NULL') || ', ' ||
  COALESCE(quote_literal(occupation), 'NULL') || ', ' ||
  quote_literal(createdAt::text) || ', ' ||
  quote_literal(updatedAt::text) || ');'
FROM tenants 
WHERE DATE(createdAt) = '2025-06-26';

-- Contratos de hoje (formato INSERT)  
SELECT 
  'INSERT INTO contracts (id, propertyId, tenantId, companyId, userId, startDate, endDate, rentAmount, depositAmount, administrationFeePercentage, managementFeePercentage, iptuDeductible, condominiumDeductible, maintenanceDeductible, status, terms, createdAt, updatedAt) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(propertyId) || ', ' ||
  quote_literal(tenantId) || ', ' ||
  quote_literal(companyId) || ', ' ||
  quote_literal(userId) || ', ' ||
  quote_literal(startDate::text) || ', ' ||
  quote_literal(endDate::text) || ', ' ||
  rentAmount || ', ' ||
  depositAmount || ', ' ||
  administrationFeePercentage || ', ' ||
  managementFeePercentage || ', ' ||
  iptuDeductible || ', ' ||
  condominiumDeductible || ', ' ||
  maintenanceDeductible || ', ' ||
  quote_literal(status::text) || ', ' ||
  COALESCE(quote_literal(terms), 'NULL') || ', ' ||
  quote_literal(createdAt::text) || ', ' ||
  quote_literal(updatedAt::text) || ');'
FROM contracts 
WHERE DATE(createdAt) = '2025-06-26';

-- Configurações alteradas hoje (formato INSERT/UPDATE)
SELECT 
  'INSERT INTO settings (id, companyId, key, value, category, createdAt, updatedAt) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(companyId) || ', ' ||
  quote_literal(key) || ', ' ||
  quote_literal(value) || ', ' ||
  quote_literal(category) || ', ' ||
  quote_literal(createdAt::text) || ', ' ||
  quote_literal(updatedAt::text) || ') ON CONFLICT (companyId, key) DO UPDATE SET value = EXCLUDED.value, updatedAt = EXCLUDED.updatedAt;'
FROM settings 
WHERE DATE(updatedAt) = '2025-06-26';