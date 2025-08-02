// Script Node.js para recuperação rápida dos dados de hoje
// Execute: node quick-recovery.js

const { Client } = require('pg');

// CONNECTION STRING DA BRANCH DE RECUPERAÇÃO (substitua pela sua)
const RECOVERY_CONNECTION = 'postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require';

// CONNECTION STRING DA PRODUÇÃO ATUAL (substitua pela sua)  
const PRODUCTION_CONNECTION = 'postgresql://user:pass@ep-yyy.neon.tech/neondb?sslmode=require';

async function extractTodayData() {
  const recoveryClient = new Client({ connectionString: RECOVERY_CONNECTION });
  const prodClient = new Client({ connectionString: PRODUCTION_CONNECTION });
  
  try {
    await recoveryClient.connect();
    await prodClient.connect();
    
    console.log('🔍 Analisando dados perdidos de hoje...');
    
    // Verificar usuários de hoje
    const usersToday = await recoveryClient.query(`
      SELECT * FROM users WHERE DATE(createdAt) = '2025-06-26'
    `);
    
    // Verificar propriedades de hoje
    const propertiesQuery = `
      SELECT id, title, description, address, city, state, zipCode, 
             bedrooms, bathrooms, area, rentPrice, salePrice, 
             propertyType::text, status::text, availableFor, 
             ownerId, companyId, userId, images, amenities, 
             acceptsPartnership, acceptsFinancing, 
             createdAt, updatedAt
      FROM properties 
      WHERE DATE(createdAt) = '2025-06-26'
    `;
    const propertiesToday = await recoveryClient.query(propertiesQuery);
    
    // Verificar proprietários de hoje
    const ownersToday = await recoveryClient.query(`
      SELECT * FROM owners WHERE DATE(createdAt) = '2025-06-26'
    `);
    
    // Verificar inquilinos de hoje  
    const tenantsToday = await recoveryClient.query(`
      SELECT * FROM tenants WHERE DATE(createdAt) = '2025-06-26'
    `);
    
    console.log('📊 DADOS ENCONTRADOS DE HOJE:');
    console.log(`- Usuários: ${usersToday.rows.length}`);
    console.log(`- Propriedades: ${propertiesToday.rows.length}`);
    console.log(`- Proprietários: ${ownersToday.rows.length}`);
    console.log(`- Inquilinos: ${tenantsToday.rows.length}`);
    
    // Restaurar usuários
    for (const user of usersToday.rows) {
      try {
        await prodClient.query(`
          INSERT INTO users (id, email, name, password, phone, role, companyId, isActive, isBlocked, lastLogin, createdAt, updatedAt) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO NOTHING
        `, [user.id, user.email, user.name, user.password, user.phone, user.role, user.companyId, user.isActive, user.isBlocked, user.lastLogin, user.createdAt, user.updatedAt]);
        console.log(`✅ Usuário restaurado: ${user.name}`);
      } catch (err) {
        console.log(`❌ Erro ao restaurar usuário ${user.name}:`, err.message);
      }
    }
    
    // Restaurar proprietários
    for (const owner of ownersToday.rows) {
      try {
        await prodClient.query(`
          INSERT INTO owners (id, name, email, phone, document, address, city, state, zipCode, companyId, userId, createdAt, updatedAt) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO NOTHING
        `, [owner.id, owner.name, owner.email, owner.phone, owner.document, owner.address, owner.city, owner.state, owner.zipCode, owner.companyId, owner.userId, owner.createdAt, owner.updatedAt]);
        console.log(`✅ Proprietário restaurado: ${owner.name}`);
      } catch (err) {
        console.log(`❌ Erro ao restaurar proprietário ${owner.name}:`, err.message);
      }
    }
    
    // Restaurar propriedades
    for (const property of propertiesToday.rows) {
      try {
        await prodClient.query(`
          INSERT INTO properties (id, title, description, address, city, state, zipCode, bedrooms, bathrooms, area, rentPrice, salePrice, propertyType, status, availableFor, ownerId, companyId, userId, images, amenities, acceptsPartnership, acceptsFinancing, createdAt, updatedAt) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::PropertyType, $14::PropertyStatus, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
          ON CONFLICT (id) DO NOTHING
        `, [property.id, property.title, property.description, property.address, property.city, property.state, property.zipCode, property.bedrooms, property.bathrooms, property.area, property.rentPrice, property.salePrice, property.propertytype, property.status, property.availablefor, property.ownerid, property.companyid, property.userid, property.images, property.amenities, property.acceptspartnership, property.acceptsfinancing, property.createdat, property.updatedat]);
        console.log(`✅ Propriedade restaurada: ${property.title}`);
      } catch (err) {
        console.log(`❌ Erro ao restaurar propriedade ${property.title}:`, err.message);
      }
    }
    
    // Restaurar inquilinos
    for (const tenant of tenantsToday.rows) {
      try {
        await prodClient.query(`
          INSERT INTO tenants (id, name, email, phone, document, address, city, state, zipCode, income, companyId, userId, emergencyContact, occupation, createdAt, updatedAt) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO NOTHING
        `, [tenant.id, tenant.name, tenant.email, tenant.phone, tenant.document, tenant.address, tenant.city, tenant.state, tenant.zipCode, tenant.income, tenant.companyId, tenant.userId, tenant.emergencyContact, tenant.occupation, tenant.createdAt, tenant.updatedAt]);
        console.log(`✅ Inquilino restaurado: ${tenant.name}`);
      } catch (err) {
        console.log(`❌ Erro ao restaurar inquilino ${tenant.name}:`, err.message);
      }
    }
    
    console.log('🎉 RECUPERAÇÃO CONCLUÍDA!');
    
  } catch (error) {
    console.error('❌ Erro na recuperação:', error);
  } finally {
    await recoveryClient.end();
    await prodClient.end();
  }
}

// Executar recuperação
extractTodayData().catch(console.error);