# 📋 Atualização: Números de Contrato Amigáveis

## 🎯 Objetivo

Substituir os IDs longos dos contratos (ex: `cme0d74r50001il04b31e0owh`) por números amigáveis e sequenciais (ex: `CTR-2024-001`).

## 🔄 Mudanças Implementadas

### 1. Schema do Banco (Prisma)
- ✅ Adicionado campo `contractNumber` na tabela `Contract`
- ✅ Campo único e opcional para compatibilidade com contratos existentes
- ✅ Formato: `CTR-YYYY-NNN` (ex: CTR-2024-001, CTR-2024-002)

### 2. Geração de Comprovantes
- ✅ Atualizado `comprovante-rendimentos.ts` para usar `contractNumber` quando disponível
- ✅ Fallback para `contract.id` se `contractNumber` for null (compatibilidade)

### 3. Scripts de Migração
- ✅ `migrate-contract-number.js` - Migra contratos existentes
- ✅ `prisma/migrations/add_contract_number.sql` - SQL para produção

## 🚀 Como Aplicar as Mudanças

### 1. Desenvolvimento Local (com banco rodando)
```bash
# Aplicar mudanças no schema
npx prisma db push

# Migrar contratos existentes
node migrate-contract-number.js
```

### 2. Produção (Vercel/Neon)
```bash
# Aplicar via Prisma
npx prisma db push --accept-data-loss

# Executar script de migração
node migrate-contract-number.js
```

### 3. Alternativa SQL Direta
Execute o arquivo `prisma/migrations/add_contract_number.sql` diretamente no banco.

## 📊 Formato dos Números

| Formato | Exemplo | Descrição |
|---------|---------|-----------|
| `CTR-YYYY-NNN` | `CTR-2024-001` | Contrato 1 de 2024 |
| `CTR-YYYY-NNN` | `CTR-2024-025` | Contrato 25 de 2024 |
| `CTR-YYYY-NNN` | `CTR-2025-001` | Contrato 1 de 2025 |

## 🔧 Funcionalidades

### Geração Automática
- ✅ Novos contratos recebem números automaticamente
- ✅ Sequencial por usuário e ano
- ✅ Zero-padding para 3 dígitos (001, 002, 003...)

### Compatibilidade
- ✅ Contratos antigos mantêm funcionamento
- ✅ PDF mostra `contractNumber` se disponível, senão `id`
- ✅ Migração não quebra funcionalidades existentes

## 🧪 Teste

Para testar se está funcionando:

1. Crie um novo contrato
2. Verifique se recebeu `contractNumber` (ex: CTR-2024-001)
3. Gere um comprovante de rendimentos
4. Verifique se o PDF mostra o número amigável

## ⚠️ Importante

- **Backup**: Sempre faça backup antes de aplicar em produção
- **Testes**: Teste em ambiente de desenvolvimento primeiro
- **Reversão**: Para reverter, simplesmente ignore o campo `contractNumber`

## 🔄 Status da Implementação

- ✅ Schema atualizado
- ✅ Lógica de comprovantes atualizada  
- ✅ Scripts de migração criados
- ✅ Prisma client regenerado
- ⏳ **Aguardando**: Aplicação no banco de dados
- ⏳ **Aguardando**: Teste em produção

## 📱 Impacto Visual

**Antes:**
```
Contrato nº: cme0d74r50001il04b31e0owh
```

**Depois:**
```
Contrato nº: CTR-2024-001
```

Muito mais limpo e profissional! 🎉