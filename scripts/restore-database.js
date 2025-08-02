#!/usr/bin/env node
/**
 * 🔄 Sistema de Restauração do CRM Imobiliário
 * 
 * Este script restaura dados de um backup específico
 * Suporta restauração completa ou seletiva por tabela
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const BACKUP_DIR = path.join(__dirname, '../backups');

async function listBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      console.log('📁 Nenhum backup encontrado. Execute backup-database.js primeiro.');
      return [];
    }
    
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          path: filePath,
          date: stats.mtime,
          size: (stats.size / 1024 / 1024).toFixed(2) + ' MB'
        };
      })
      .sort((a, b) => b.date - a.date);
    
    console.log('📋 Backups disponíveis:');
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.filename}`);
      console.log(`   📅 Data: ${file.date.toLocaleString('pt-BR')}`);
      console.log(`   💾 Tamanho: ${file.size}`);
      console.log('');
    });
    
    return files;
    
  } catch (error) {
    console.error('❌ Erro ao listar backups:', error);
    return [];
  }
}

async function restoreFromBackup(backupPath, options = {}) {
  try {
    console.log('🔄 Iniciando restauração...');
    console.log('📁 Arquivo:', backupPath);
    
    // Verificar se arquivo existe
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Arquivo de backup não encontrado: ${backupPath}`);
    }
    
    // Ler backup
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    console.log('📊 Informações do backup:');
    console.log(`   📅 Data: ${new Date(backupData.metadata.timestamp).toLocaleString('pt-BR')}`);
    console.log(`   🔢 Versão: ${backupData.metadata.version}`);
    console.log(`   📊 Total de registros: ${backupData.metadata.totalRecords}`);
    
    // Confirmar restauração
    if (!options.force) {
      console.log('\n⚠️ ATENÇÃO: Esta operação irá substituir dados existentes!');
      console.log('💡 Use --force para pular esta confirmação');
      
      // Em produção, você pode implementar uma confirmação interativa aqui
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Restauração em produção requer confirmação manual');
      }
    }
    
    const { data } = backupData;
    
    // Limpar dados existentes (opcional)
    if (options.clearFirst) {
      console.log('🗑️ Limpando dados existentes...');
      await clearDatabase();
    }
    
    // Restaurar em ordem de dependência
    console.log('📦 Restaurando dados...');
    
    // 1. Companies (sem dependências)
    if (data.companies && data.companies.length > 0) {
      console.log('🏢 Restaurando empresas...');
      for (const company of data.companies) {
        await prisma.company.upsert({
          where: { id: company.id },
          update: company,
          create: company
        });
      }
      console.log(`✅ ${data.companies.length} empresas restauradas`);
    }
    
    // 2. Users (dependem de companies)
    if (data.users && data.users.length > 0) {
      console.log('👥 Restaurando usuários...');
      for (const user of data.users) {
        const userData = { ...user };
        delete userData.company; // Remove nested data
        
        await prisma.user.upsert({
          where: { id: user.id },
          update: userData,
          create: userData
        });
      }
      console.log(`✅ ${data.users.length} usuários restaurados`);
    }
    
    // 3. Owners (dependem de users)
    if (data.owners && data.owners.length > 0) {
      console.log('🏠 Restaurando proprietários...');
      for (const owner of data.owners) {
        const ownerData = { ...owner };
        delete ownerData.properties;
        delete ownerData.bankAccounts;
        
        await prisma.owner.upsert({
          where: { id: owner.id },
          update: ownerData,
          create: ownerData
        });
      }
      console.log(`✅ ${data.owners.length} proprietários restaurados`);
    }
    
    // 4. Properties (dependem de owners)
    if (data.properties && data.properties.length > 0) {
      console.log('🏘️ Restaurando propriedades...');
      for (const property of data.properties) {
        const propertyData = { ...property };
        delete propertyData.owner;
        delete propertyData.tenants;
        delete propertyData.contracts;
        
        await prisma.property.upsert({
          where: { id: property.id },
          update: propertyData,
          create: propertyData
        });
      }
      console.log(`✅ ${data.properties.length} propriedades restauradas`);
    }
    
    // 5. Bank Accounts (dependem de owners)
    if (data.bankAccounts && data.bankAccounts.length > 0) {
      console.log('🏦 Restaurando contas bancárias...');
      for (const bankAccount of data.bankAccounts) {
        await prisma.bankAccounts.upsert({
          where: { id: bankAccount.id },
          update: bankAccount,
          create: bankAccount
        });
      }
      console.log(`✅ ${data.bankAccounts.length} contas bancárias restauradas`);
    }
    
    // 6. Outras tabelas (se existirem)
    const otherTables = ['tenants', 'contracts', 'payments', 'leads', 'maintenances'];
    
    for (const tableName of otherTables) {
      if (data[tableName] && data[tableName].length > 0 && prisma[tableName]) {
        console.log(`📋 Restaurando ${tableName}...`);
        for (const record of data[tableName]) {
          await prisma[tableName].upsert({
            where: { id: record.id },
            update: record,
            create: record
          });
        }
        console.log(`✅ ${data[tableName].length} ${tableName} restaurados`);
      }
    }
    
    // Verificar restauração
    const verification = await verifyRestore(backupData.counts);
    
    console.log('🎉 RESTAURAÇÃO CONCLUÍDA!');
    console.log('📊 Verificação:');
    Object.entries(verification).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Erro na restauração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function clearDatabase() {
  // Limpar em ordem reversa de dependência
  const tables = [
    'maintenances', 'payments', 'contracts', 'tenants',
    'bankAccounts', 'properties', 'owners', 'users', 'companies'
  ];
  
  for (const table of tables) {
    if (prisma[table]) {
      await prisma[table].deleteMany();
      console.log(`🗑️ ${table} limpa`);
    }
  }
}

async function verifyRestore(expectedCounts) {
  const actualCounts = {};
  
  const tables = ['users', 'companies', 'owners', 'properties', 'bankAccounts'];
  
  for (const table of tables) {
    if (prisma[table]) {
      actualCounts[table] = await prisma[table].count();
    }
  }
  
  return actualCounts;
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--list') || args.length === 0) {
    await listBackups();
    return;
  }
  
  const backupFile = args[0];
  const options = {
    force: args.includes('--force'),
    clearFirst: args.includes('--clear')
  };
  
  let backupPath;
  
  if (backupFile === 'latest') {
    backupPath = path.join(BACKUP_DIR, 'latest-backup.json');
  } else if (fs.existsSync(backupFile)) {
    backupPath = backupFile;
  } else {
    backupPath = path.join(BACKUP_DIR, backupFile);
  }
  
  await restoreFromBackup(backupPath, options);
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
    .then(() => {
      console.log('🎉 Processo concluído!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Falha na restauração:', error);
      process.exit(1);
    });
}

module.exports = { restoreFromBackup, listBackups };