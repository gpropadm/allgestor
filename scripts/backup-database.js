#!/usr/bin/env node
/**
 * 🛡️ Sistema de Backup Automático do CRM Imobiliário
 * 
 * Este script faz backup completo de todos os dados do banco
 * Salva em formato JSON com timestamp para fácil recuperação
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configurações
const BACKUP_DIR = path.join(__dirname, '../backups');
const MAX_BACKUPS = 30; // Manter últimos 30 backups

async function createBackup() {
  try {
    console.log('🛡️ Iniciando backup do banco de dados...');
    
    // Criar diretório de backup se não existir
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    // Buscar todos os dados
    console.log('📊 Coletando dados...');
    
    const [
      users,
      companies,
      owners,
      properties,
      bankAccounts,
      leads,
      contracts,
      payments,
      tenants,
      maintenances
    ] = await Promise.all([
      prisma.user.findMany({ include: { company: true } }),
      prisma.company.findMany(),
      prisma.owner.findMany({ 
        include: { 
          properties: true, 
          bankAccounts: true 
        } 
      }),
      prisma.property.findMany({ 
        include: { 
          owner: true,
          tenants: true,
          contracts: true 
        } 
      }),
      prisma.bankAccounts.findMany(),
      prisma.lead ? prisma.lead.findMany() : [],
      prisma.contract ? prisma.contract.findMany() : [],
      prisma.payment ? prisma.payment.findMany() : [],
      prisma.tenant ? prisma.tenant.findMany() : [],
      prisma.maintenance ? prisma.maintenance.findMany() : []
    ]);
    
    // Criar objeto de backup
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        totalRecords: users.length + companies.length + owners.length + properties.length,
        environment: process.env.NODE_ENV || 'development'
      },
      data: {
        users,
        companies,
        owners,
        properties,
        bankAccounts,
        leads,
        contracts,
        payments,
        tenants,
        maintenances
      },
      counts: {
        users: users.length,
        companies: companies.length,
        owners: owners.length,
        properties: properties.length,
        bankAccounts: bankAccounts.length,
        leads: leads.length,
        contracts: contracts.length,
        payments: payments.length,
        tenants: tenants.length,
        maintenances: maintenances.length
      }
    };
    
    // Nome do arquivo com timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    // Salvar backup
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    
    // Criar link para o backup mais recente
    const latestPath = path.join(BACKUP_DIR, 'latest-backup.json');
    if (fs.existsSync(latestPath)) {
      fs.unlinkSync(latestPath);
    }
    fs.copyFileSync(filepath, latestPath);
    
    console.log('✅ Backup criado com sucesso!');
    console.log('📁 Arquivo:', filename);
    console.log('📊 Dados salvos:');
    console.log(`   👥 Usuários: ${backupData.counts.users}`);
    console.log(`   🏢 Empresas: ${backupData.counts.companies}`);
    console.log(`   🏠 Proprietários: ${backupData.counts.owners}`);
    console.log(`   🏘️ Propriedades: ${backupData.counts.properties}`);
    console.log(`   🏦 Contas Bancárias: ${backupData.counts.bankAccounts}`);
    console.log(`   📋 Leads: ${backupData.counts.leads}`);
    console.log(`   📄 Contratos: ${backupData.counts.contracts}`);
    console.log(`   💰 Pagamentos: ${backupData.counts.payments}`);
    console.log(`   🏠 Inquilinos: ${backupData.counts.tenants}`);
    console.log(`   🔧 Manutenções: ${backupData.counts.maintenances}`);
    
    // Limpar backups antigos
    await cleanOldBackups();
    
    return filepath;
    
  } catch (error) {
    console.error('❌ Erro no backup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`🗑️ Backup antigo removido: ${file.name}`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Erro ao limpar backups antigos:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createBackup()
    .then(filepath => {
      console.log(`🎉 Backup concluído: ${filepath}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Falha no backup:', error);
      process.exit(1);
    });
}

module.exports = { createBackup };