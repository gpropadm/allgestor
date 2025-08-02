#!/usr/bin/env node
/**
 * ⏰ Agendador de Backup Automático
 * 
 * Este script agenda backups automáticos em intervalos regulares
 * Pode ser executado como cron job ou processo contínuo
 */

const { createBackup } = require('./backup-database');
const fs = require('fs');
const path = require('path');

// Configurações
const BACKUP_INTERVALS = {
  daily: 24 * 60 * 60 * 1000,    // 24 horas
  hourly: 60 * 60 * 1000,        // 1 hora
  every6h: 6 * 60 * 60 * 1000,   // 6 horas
  every12h: 12 * 60 * 60 * 1000  // 12 horas
};

const STATUS_FILE = path.join(__dirname, '../backups/backup-status.json');

function updateStatus(status) {
  const statusData = {
    lastBackup: new Date().toISOString(),
    status: status,
    nextBackup: null
  };
  
  fs.writeFileSync(STATUS_FILE, JSON.stringify(statusData, null, 2));
}

function getLastBackupTime() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
      return new Date(status.lastBackup);
    }
  } catch (error) {
    console.warn('⚠️ Erro ao ler status do backup:', error.message);
  }
  return null;
}

async function scheduleBackup(interval = 'daily') {
  const intervalMs = BACKUP_INTERVALS[interval] || BACKUP_INTERVALS.daily;
  
  console.log(`⏰ Agendador de backup iniciado (${interval})`);
  console.log(`🕐 Intervalo: ${intervalMs / 1000 / 60 / 60} horas`);
  
  // Backup inicial
  await performScheduledBackup();
  
  // Agendar próximos backups
  setInterval(async () => {
    await performScheduledBackup();
  }, intervalMs);
  
  // Manter processo ativo
  process.on('SIGINT', () => {
    console.log('\\n⏹️ Agendador de backup interrompido');
    process.exit(0);
  });
  
  console.log('✅ Agendador ativo. Pressione Ctrl+C para parar.');
}

async function performScheduledBackup() {
  try {
    console.log('🛡️ Executando backup agendado...');
    updateStatus('running');
    
    const backupPath = await createBackup();
    
    updateStatus('completed');
    console.log(`✅ Backup agendado concluído: ${path.basename(backupPath)}`);
    
    // Notificar sucesso (você pode adicionar integração com email, Slack, etc.)
    await notifyBackupSuccess(backupPath);
    
  } catch (error) {
    console.error('❌ Erro no backup agendado:', error);
    updateStatus('failed');
    
    // Notificar falha
    await notifyBackupFailure(error);
  }
}

async function notifyBackupSuccess(backupPath) {
  // Aqui você pode adicionar notificações
  // Exemplos: email, Slack, Discord, etc.
  
  const stats = fs.statSync(backupPath);
  const size = (stats.size / 1024 / 1024).toFixed(2);
  
  console.log(`📧 Backup bem-sucedido - Tamanho: ${size}MB`);
  
  // Exemplo de log estruturado
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: 'backup_success',
    file: path.basename(backupPath),
    size: `${size}MB`,
    environment: process.env.NODE_ENV || 'development'
  };
  
  const logFile = path.join(__dirname, '../backups/backup.log');
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\\n');
}

async function notifyBackupFailure(error) {
  console.error('📧 Notificando falha no backup...');
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: 'backup_failure',
    error: error.message,
    environment: process.env.NODE_ENV || 'development'
  };
  
  const logFile = path.join(__dirname, '../backups/backup.log');
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\\n');
}

function checkBackupHealth() {
  const lastBackup = getLastBackupTime();
  
  if (!lastBackup) {
    console.log('⚠️ Nenhum backup encontrado');
    return false;
  }
  
  const hoursSinceLastBackup = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60);
  
  console.log(`📊 Último backup: ${lastBackup.toLocaleString('pt-BR')}`);
  console.log(`⏰ Há ${hoursSinceLastBackup.toFixed(1)} horas`);
  
  if (hoursSinceLastBackup > 25) { // Mais de 25 horas = problema
    console.log('❌ Backup atrasado!');
    return false;
  }
  
  console.log('✅ Backup em dia');
  return true;
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'start':
      const interval = args[1] || 'daily';
      await scheduleBackup(interval);
      break;
      
    case 'status':
      checkBackupHealth();
      break;
      
    case 'once':
      await performScheduledBackup();
      break;
      
    default:
      console.log('📋 Comandos disponíveis:');
      console.log('  node backup-scheduler.js start [daily|hourly|every6h|every12h]');
      console.log('  node backup-scheduler.js status');
      console.log('  node backup-scheduler.js once');
      break;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erro no agendador:', error);
    process.exit(1);
  });
}

module.exports = { scheduleBackup, checkBackupHealth };