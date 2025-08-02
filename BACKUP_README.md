# 🛡️ Sistema de Backup do CRM Imobiliário

## 📋 Visão Geral

Sistema completo de backup e restauração para proteger todos os dados do seu CRM. Inclui backup automático, restauração seletiva e monitoramento.

## 🚀 Como Usar

### 1. **Fazer Backup Manual**
```bash
# Backup completo imediato
node scripts/backup-database.js

# Resultado: backup salvo em /backups/backup-YYYY-MM-DD-HH-mm-ss.json
```

### 2. **Listar Backups Disponíveis**
```bash
# Ver todos os backups
node scripts/restore-database.js --list
```

### 3. **Restaurar Backup**
```bash
# Restaurar o backup mais recente
node scripts/restore-database.js latest --force

# Restaurar backup específico
node scripts/restore-database.js backup-2025-06-29-15-30-45.json --force

# Restaurar limpando dados existentes primeiro
node scripts/restore-database.js latest --force --clear
```

### 4. **Backup Automático**
```bash
# Iniciar backup diário automático
node scripts/backup-scheduler.js start daily

# Backup a cada 6 horas
node scripts/backup-scheduler.js start every6h

# Backup a cada hora (para desenvolvimento)
node scripts/backup-scheduler.js start hourly

# Verificar status dos backups
node scripts/backup-scheduler.js status

# Fazer um backup único agora
node scripts/backup-scheduler.js once
```

## 📊 O Que é Salvo no Backup

✅ **Dados Principais:**
- 👥 Usuários e permissões
- 🏢 Empresas/imobiliárias  
- 🏠 Proprietários
- 🏘️ Propriedades
- 🏦 Contas bancárias
- 📋 Leads e contatos
- 📄 Contratos
- 💰 Pagamentos
- 🏠 Inquilinos
- 🔧 Manutenções

✅ **Metadados:**
- 📅 Data e hora do backup
- 🔢 Quantidade de registros
- 🌍 Ambiente (dev/prod)
- ✨ Versão do sistema

## 📁 Estrutura dos Arquivos

```
backups/
├── backup-2025-06-29-15-30-45.json  # Backup com timestamp
├── backup-2025-06-29-14-00-00.json  # Backup anterior
├── latest-backup.json               # Link para o mais recente
├── backup-status.json               # Status do agendador
└── backup.log                       # Log de operações
```

## ⚙️ Configurações Avançadas

### **Retenção de Backups**
- **Máximo**: 30 backups (configurável)
- **Limpeza**: Automática dos mais antigos
- **Espaço**: ~1-5MB por backup

### **Agendamento Personalizado**
```bash
# Adicionar ao crontab para backup diário às 2h da manhã
0 2 * * * cd /path/to/crm && node scripts/backup-database.js

# Backup a cada 6 horas
0 */6 * * * cd /path/to/crm && node scripts/backup-database.js
```

### **Notificações** (Futuro)
- 📧 Email em caso de falha
- 📱 Slack/Discord notifications
- 📊 Métricas de saúde do backup

## 🆘 Recuperação de Emergência

### **Cenário 1: Perda Total dos Dados**
```bash
# 1. Parar aplicação
# 2. Restaurar último backup
node scripts/restore-database.js latest --force --clear

# 3. Verificar dados
node scripts/backup-database.js status

# 4. Reiniciar aplicação
```

### **Cenário 2: Dados Corrompidos**
```bash
# 1. Fazer backup atual (mesmo corrompido)
node scripts/backup-database.js

# 2. Restaurar backup anterior
node scripts/restore-database.js --list
node scripts/restore-database.js [arquivo-anterior] --force --clear
```

### **Cenário 3: Migração de Servidor**
```bash
# No servidor antigo:
node scripts/backup-database.js

# No servidor novo:
# 1. Copiar arquivo de backup
# 2. Configurar banco de dados
# 3. Restaurar dados
node scripts/restore-database.js backup-file.json --force
```

## 🔒 Segurança

### **Proteção dos Backups**
- ✅ Backups em formato JSON legível
- ✅ Sem senhas em texto plano (hasheadas)
- ✅ Timestamps para auditoria
- ⚠️ **IMPORTANTE**: Manter backups seguros e privados

### **Boas Práticas**
1. **Teste restaurações** regularmente
2. **Mantenha backups offsite** (cloud, outro servidor)
3. **Monitore espaço em disco**
4. **Documente procedimentos** de emergência

## 📞 Comandos Rápidos de Emergência

```bash
# BACKUP URGENTE AGORA
node scripts/backup-database.js

# RESTAURAR ÚLTIMA VERSÃO  
node scripts/restore-database.js latest --force

# VER STATUS DOS BACKUPS
node scripts/backup-scheduler.js status

# LISTAR TODOS OS BACKUPS
node scripts/restore-database.js --list
```

## 🎯 Próximos Passos Recomendados

1. **Configure backup automático diário**
2. **Teste uma restauração** para validar
3. **Configure notificações** de falha
4. **Documente procedimentos** para sua equipe
5. **Considere backup em nuvem** para maior segurança

---

🛡️ **BACKUP É VIDA! Nunca perca dados importantes novamente.**