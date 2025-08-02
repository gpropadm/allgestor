#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugSpecificTenant() {
  try {
    console.log('🔍 DEBUG ESPECÍFICO - DANIEL\n');
    
    // Buscar DANIEL especificamente
    const daniel = await prisma.tenant.findFirst({
      where: {
        name: 'DANIEL'
      },
      include: {
        contracts: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            property: true,
            payments: {
              take: 3,
              orderBy: {
                dueDate: 'desc'
              }
            }
          }
        }
      }
    });
    
    if (daniel) {
      console.log('✅ DANIEL encontrado:');
      console.log(`   ID: ${daniel.id}`);
      console.log(`   Nome: ${daniel.name}`);
      console.log(`   Telefone: "${daniel.phone}"`);
      console.log(`   Documento: "${daniel.document}"`);
      console.log(`   Email: ${daniel.email}`);
      console.log(`   Contratos ativos: ${daniel.contracts.length}`);
      
      if (daniel.contracts.length > 0) {
        const contract = daniel.contracts[0];
        console.log('\n📋 Contrato ativo:');
        console.log(`   ID: ${contract.id}`);
        console.log(`   Imóvel: ${contract.property.title}`);
        console.log(`   Valor: R$ ${contract.rentAmount}`);
        console.log(`   Status: ${contract.status}`);
        console.log(`   Pagamentos: ${contract.payments.length}`);
      }
      
      // Testar todas as variações de busca
      console.log('\n🔍 Testando variações de busca:');
      
      const cleanPhone = daniel.phone.replace(/\D/g, '');
      const cleanDocument = daniel.document.replace(/\D/g, '');
      
      console.log(`   Telefone limpo: "${cleanPhone}"`);
      console.log(`   Documento limpo: "${cleanDocument}"`);
      
      // Teste 1: Busca exata
      const test1 = await prisma.tenant.findFirst({
        where: {
          AND: [
            { phone: cleanPhone },
            { document: cleanDocument }
          ]
        }
      });
      console.log(`   Teste 1 (exato): ${test1 ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);
      
      // Teste 2: Busca com OR no telefone
      const test2 = await prisma.tenant.findFirst({
        where: {
          AND: [
            {
              OR: [
                { phone: cleanPhone },
                { phone: daniel.phone },
                { phone: `+55${cleanPhone}` }
              ]
            },
            { document: cleanDocument }
          ]
        }
      });
      console.log(`   Teste 2 (OR telefone): ${test2 ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);
      
      // Teste 3: Só por telefone
      const test3 = await prisma.tenant.findFirst({
        where: {
          phone: cleanPhone
        }
      });
      console.log(`   Teste 3 (só telefone): ${test3 ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);
      
      // Teste 4: Só por documento
      const test4 = await prisma.tenant.findFirst({
        where: {
          document: cleanDocument
        }
      });
      console.log(`   Teste 4 (só documento): ${test4 ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);
      
    } else {
      console.log('❌ DANIEL não encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Definir DATABASE_URL
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_lIefyWBcFA64@ep-raspy-night-acszvire-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";

debugSpecificTenant();