# 🏦 Plano de Migração para Gateway de Pagamento

## 📊 Status Atual
- ✅ Sistema funcionando SEM gateway
- ✅ Pagamentos básicos criados e funcionais
- ✅ Campos de gateway comentados no schema

## 🎯 Quando Implementar Gateway

### 1. Migração do Banco de Dados
```sql
-- Adicionar campos necessários para gateway
ALTER TABLE payments ADD COLUMN "gatewayPaymentId" VARCHAR;
ALTER TABLE payments ADD COLUMN "pixQrCode" TEXT;
ALTER TABLE payments ADD COLUMN "ownerAmount" DECIMAL(10,2);
ALTER TABLE payments ADD COLUMN "companyAmount" DECIMAL(10,2);
ALTER TABLE payments ADD COLUMN "gatewayFee" DECIMAL(10,2);
ALTER TABLE payments ADD COLUMN "splitData" TEXT;
ALTER TABLE payments ADD COLUMN "webhookReceived" BOOLEAN DEFAULT false;
ALTER TABLE payments ADD COLUMN "lastWebhookAt" TIMESTAMP;
```

### 2. Atualizar Schema Prisma
Descomentar os campos no `prisma/schema.prisma`:
```prisma
model Payment {
  // ... campos existentes ...
  
  // Gateway fields - REATIVAR QUANDO IMPLEMENTAR
  gatewayPaymentId  String?       // ID do pagamento no gateway
  pixQrCode         String?       // QR Code PIX
  ownerAmount       Float?        // Valor que vai para o proprietário
  companyAmount     Float?        // Valor que fica com a imobiliária
  gatewayFee        Float?        // Taxa cobrada pelo gateway
  splitData         String?       // JSON com dados completos do split
  webhookReceived   Boolean       @default(false)
  lastWebhookAt     DateTime?
  
  // ... resto do modelo
}
```

### 3. Atualizar APIs
- `fix-payments-now` - Incluir campos de gateway quando necessário
- `payments/route.ts` - Mapear novos campos
- Criar APIs específicas para gateway (Asaas, PJBank, etc.)

### 4. Compatibilidade
- ✅ Pagamentos existentes continuarão funcionando (campos NULL)
- ✅ Novos pagamentos podem usar gateway ou não
- ✅ Sistema híbrido (manual + gateway)

## 🚀 Vantagens da Abordagem Atual
1. **Sistema funcional agora** - Não dependemos do gateway
2. **Migração incremental** - Podemos adicionar gateway gradualmente  
3. **Sem breaking changes** - Pagamentos existentes não serão afetados
4. **Flexibilidade** - Suporte a pagamentos manuais + gateway

## 📝 Notas Importantes
- Todos os campos de gateway são OPCIONAIS (nullable)
- Sistema atual funciona perfeitamente sem gateway
- Quando gateway for implementado, será apenas uma adição, não substituição
- Pagamentos manuais continuarão funcionando normalmente

---
*Criado em: $(date)*
*Status: Sistema básico funcional, pronto para expansão com gateway*