-- Execute na BRANCH DE RECUPERAÇÃO para extrair dados de hoje
-- Copie o resultado e execute na PRODUÇÃO

-- EXTRAIR USUÁRIOS DE HOJE
SELECT 'INSERT INTO users (id, email, name, password, phone, role, "companyId", "isActive", "isBlocked", "lastLogin", "createdAt", "updatedAt") VALUES (''' || 
       id || ''', ''' || 
       email || ''', ''' || 
       replace(name, '''', '''''') || ''', ''' || 
       password || ''', ' || 
       COALESCE('''' || phone || '''', 'NULL') || ', ''' || 
       role || ''', ' || 
       COALESCE('''' || "companyId" || '''', 'NULL') || ', ' || 
       "isActive" || ', ' || 
       "isBlocked" || ', ' || 
       COALESCE('''' || "lastLogin"::text || '''', 'NULL') || ', ''' || 
       "createdAt"::text || ''', ''' || 
       "updatedAt"::text || ''') ON CONFLICT (id) DO NOTHING;' as sql_command
FROM users 
WHERE DATE("createdAt") = '2025-06-26'

UNION ALL

-- EXTRAIR PROPRIETÁRIOS DE HOJE
SELECT 'INSERT INTO owners (id, name, email, phone, document, address, city, state, "zipCode", "companyId", "userId", "createdAt", "updatedAt") VALUES (''' || 
       id || ''', ''' || 
       replace(name, '''', '''''') || ''', ''' || 
       email || ''', ''' || 
       phone || ''', ''' || 
       document || ''', ''' || 
       replace(address, '''', '''''') || ''', ''' || 
       city || ''', ''' || 
       state || ''', ''' || 
       "zipCode" || ''', ' || 
       COALESCE('''' || "companyId" || '''', 'NULL') || ', ''' || 
       "userId" || ''', ''' || 
       "createdAt"::text || ''', ''' || 
       "updatedAt"::text || ''') ON CONFLICT (id) DO NOTHING;'
FROM owners 
WHERE DATE("createdAt") = '2025-06-26'

UNION ALL

-- EXTRAIR PROPRIEDADES DE HOJE
SELECT 'INSERT INTO properties (id, title, description, address, city, state, "zipCode", bedrooms, bathrooms, area, "rentPrice", "salePrice", "propertyType", status, "availableFor", "ownerId", "companyId", "userId", images, amenities, "acceptsPartnership", "acceptsFinancing", "createdAt", "updatedAt") VALUES (''' || 
       id || ''', ''' || 
       replace(title, '''', '''''') || ''', ' || 
       COALESCE('''' || replace(description, '''', '''''') || '''', 'NULL') || ', ''' || 
       replace(address, '''', '''''') || ''', ''' || 
       city || ''', ''' || 
       state || ''', ''' || 
       "zipCode" || ''', ' || 
       bedrooms || ', ' || 
       bathrooms || ', ' || 
       area || ', ' || 
       "rentPrice" || ', ' || 
       COALESCE("salePrice"::text, 'NULL') || ', ''' || 
       "propertyType"::text || ''', ''' || 
       status::text || ''', ''' || 
       replace("availableFor", '''', '''''') || ''', ''' || 
       "ownerId" || ''', ''' || 
       "companyId" || ''', ''' || 
       "userId" || ''', ''' || 
       replace(images, '''', '''''') || ''', ''' || 
       replace(amenities, '''', '''''') || ''', ' || 
       "acceptsPartnership" || ', ' || 
       "acceptsFinancing" || ', ''' || 
       "createdAt"::text || ''', ''' || 
       "updatedAt"::text || ''') ON CONFLICT (id) DO NOTHING;'
FROM properties 
WHERE DATE("createdAt") = '2025-06-26'

UNION ALL

-- EXTRAIR INQUILINOS DE HOJE
SELECT 'INSERT INTO tenants (id, name, email, phone, document, address, city, state, "zipCode", income, "companyId", "userId", "emergencyContact", occupation, "createdAt", "updatedAt") VALUES (''' || 
       id || ''', ''' || 
       replace(name, '''', '''''') || ''', ''' || 
       email || ''', ''' || 
       phone || ''', ''' || 
       document || ''', ''' || 
       replace(address, '''', '''''') || ''', ''' || 
       city || ''', ''' || 
       state || ''', ''' || 
       "zipCode" || ''', ' || 
       income || ', ''' || 
       "companyId" || ''', ''' || 
       "userId" || ''', ' || 
       COALESCE('''' || "emergencyContact" || '''', 'NULL') || ', ' || 
       COALESCE('''' || occupation || '''', 'NULL') || ', ''' || 
       "createdAt"::text || ''', ''' || 
       "updatedAt"::text || ''') ON CONFLICT (id) DO NOTHING;'
FROM tenants 
WHERE DATE("createdAt") = '2025-06-26';