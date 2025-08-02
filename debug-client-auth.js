#!/usr/bin/env node

/**
 * Script para debugar autenticação do cliente
 * Uso: node debug-client-auth.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugClientAuth() {
  try {
    console.log('🔍 DEBUG - Autenticação do Cliente\n');
    
    // 1. Listar alguns inquilinos para análise
    console.log('1️⃣ Buscando inquilinos no banco...');
    
    const tenants = await prisma.tenant.findMany({
      take: 5,
      include: {
        contracts: {
          where: {
            status: 'ACTIVE'
          },
          take: 1
        }
      }
    });
    
    console.log(`   Encontrados: ${tenants.length} inquilinos\n`);
    
    tenants.forEach((tenant, i) => {
      console.log(`${i+1}. ${tenant.name}`);
      console.log(`   📞 Telefone: "${tenant.phone}"`);
      console.log(`   📄 CPF: "${tenant.document}"`);
      console.log(`   📋 Contratos ativos: ${tenant.contracts.length}`);
      
      // Mostrar diferentes variações do telefone
      const cleanPhone = tenant.phone.replace(/\D/g, '');
      console.log(`   📞 Variações telefone:`);
      console.log(`      Original: "${tenant.phone}"`);
      console.log(`      Limpo: "${cleanPhone}"`);
      console.log(`      Com +55: "+55${cleanPhone}"`);
      
      // Mostrar CPF limpo
      const cleanDocument = tenant.document.replace(/\D/g, '');
      console.log(`   📄 Variações CPF:`);
      console.log(`      Original: "${tenant.document}"`);
      console.log(`      Limpo: "${cleanDocument}"`);
      console.log('');
    });
    
    // 2. Testar busca com primeiro inquilino
    if (tenants.length > 0) {
      const testTenant = tenants[0];
      console.log(`2️⃣ Testando busca com: ${testTenant.name}`);
      
      const cleanPhone = testTenant.phone.replace(/\D/g, '');
      const cleanDocument = testTenant.document.replace(/\D/g, '');
      
      console.log(`   Buscando com telefone limpo: "${cleanPhone}"`);
      console.log(`   Buscando com CPF limpo: "${cleanDocument}"`);
      
      const foundTenant = await prisma.tenant.findFirst({
        where: {
          AND: [
            {
              OR: [
                { phone: cleanPhone },
                { phone: `+55${cleanPhone}` },
                { phone: testTenant.phone }, // Original
              ]
            },
            { document: cleanDocument }
          ]
        },
        include: {
          contracts: {
            where: {
              status: 'ACTIVE'
            }
          }
        }
      });
      
      if (foundTenant) {
        console.log('   ✅ ENCONTRADO!');
        console.log(`   Nome: ${foundTenant.name}`);
        console.log(`   Contratos: ${foundTenant.contracts.length}`);
      } else {
        console.log('   ❌ NÃO ENCONTRADO!');
        
        // Testar cada campo separadamente
        console.log('\n   🔍 Testando campos separadamente...');
        
        const byPhone = await prisma.tenant.findMany({
          where: {
            OR: [
              { phone: cleanPhone },
              { phone: `+55${cleanPhone}` },
              { phone: testTenant.phone },
            ]
          }
        });
        console.log(`   Por telefone: ${byPhone.length} encontrados`);
        
        const byDocument = await prisma.tenant.findMany({
          where: {
            document: cleanDocument
          }
        });
        console.log(`   Por CPF: ${byDocument.length} encontrados`);
      }
    }
    
    console.log('\n3️⃣ INSTRUÇÕES PARA TESTE:');
    console.log('   Use os dados exatos mostrados acima');
    console.log('   Telefone: Copie exatamente como aparece no "Limpo"');
    console.log('   CPF: Copie exatamente como aparece no "Limpo"');
    console.log('   URL: https://app.gprop.com.br/cliente');
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar com DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.log('⚠️  Definindo DATABASE_URL...');
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_lIefyWBcFA64@ep-raspy-night-acszvire-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";
}

debugClientAuth();