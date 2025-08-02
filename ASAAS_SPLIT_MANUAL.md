# 🏦 ASAAS Split de Pagamentos - Manual Completo

## 🎯 O que é o Split de Pagamentos?

O **Split de Pagamentos ASAAS** é um sistema que **automaticamente divide** o valor do aluguel entre o proprietário e a imobiliária quando o inquilino efetua o pagamento.

### ✨ Como Funciona:
1. **Inquilino** paga o boleto/PIX normalmente
2. **ASAAS** recebe o pagamento e **divide automaticamente**
3. **Proprietário** recebe o valor líquido (aluguel - comissão)
4. **Imobiliária** recebe a comissão configurada no contrato
5. **Tudo automático** - sem trabalho manual!

---

## 🚀 Configuração Inicial

### 1. **Configure sua conta ASAAS** (Imobiliária)

1. Acesse **Configurações** → **ASAAS Split**
2. Insira sua **API Key do ASAAS**
   - Obtenha em: Painel ASAAS → Minha Conta → Integrações → API
3. Clique em **"Testar Conexão"**
4. Quando conectar, o sistema estará pronto!

### 2. **Configure Webhook no ASAAS**

No painel do ASAAS, configure o webhook:
```
URL: https://app.gprop.com.br/api/asaas/webhook
Eventos: Todos os eventos de pagamento
```

---

## 👥 Configurando Proprietários

### 1. **Criar Subcontas para Proprietários**

Para cada proprietário, você precisa criar uma subconta ASAAS:

1. Vá em **Proprietários**
2. Selecione um proprietário
3. Clique em **"Configurar ASAAS"**
4. O sistema criará automaticamente uma subconta no ASAAS
5. O proprietário receberá as credenciais por email

### 2. **O que acontece:**
- ✅ Subconta ASAAS criada automaticamente
- ✅ Dados bancários vinculados
- ✅ Pronto para receber pagamentos via split

---

## 💰 Gerando Boletos com Split

### 1. **Novo Fluxo de Pagamentos:**

**Antes:** Boleto tradicional → Você recebe → Você repassa manualmente

**Agora:** Boleto com Split → ASAAS divide automaticamente → Todos recebem

### 2. **Como Gerar:**

1. Vá em **Contratos** → Selecione um contrato
2. Use **"Gerar Boleto com Split"** (novo botão)
3. Configure:
   - Valor do aluguel
   - Data de vencimento
   - Porcentagem de administração
4. O sistema criará automaticamente o split

### 3. **Exemplo Prático:**

```
Aluguel: R$ 2.000,00
Comissão Imobiliária: 10%

Split Automático:
→ Proprietário recebe: R$ 1.800,00
→ Imobiliária recebe: R$ 200,00
→ Taxa ASAAS: ~R$ 36,00 (descontada do total)
```

---

## 📊 Acompanhamento de Pagamentos

### 1. **Status dos Splits:**

- **PENDING**: Aguardando pagamento
- **DONE**: Split realizado com sucesso
- **FAILED**: Erro no split (raro)

### 2. **Relatórios:**

Acesse **Pagamentos** para ver:
- Status de cada split
- Valores divididos
- Datas de repasse
- Histórico completo

---

## ⚠️ Taxas e Custos

### 1. **Taxas ASAAS:**
- **Boleto:** ~1,8% + R$ 2,00
- **PIX:** R$ 2,00 por transação
- **Split:** GRATUITO (sem taxa adicional)

### 2. **Exemplo de Custo:**
```
Aluguel R$ 2.000,00 via boleto:
- Taxa ASAAS: R$ 36,00 + R$ 2,00 = R$ 38,00
- Líquido para dividir: R$ 1.962,00
- Proprietário: R$ 1.765,80 (90%)
- Imobiliária: R$ 196,20 (10%)
```

---

## 🔧 Configurações Avançadas

### 1. **Personalizar Porcentagens:**

No contrato, configure:
- **Taxa de Administração:** Sua comissão principal
- **Taxa de Gestão:** Comissão adicional (opcional)
- **Total:** Será descontado do proprietário automaticamente

### 2. **Múltiplos Proprietários:**

Para imóveis com múltiplos proprietários:
- Configure porcentagens individuais
- O split dividirá proporcionalmente
- Cada proprietário recebe em sua conta

---

## 🚨 Troubleshooting

### 1. **Problemas Comuns:**

**Split não funcionou:**
- ✅ Verifique se proprietário tem subconta ASAAS
- ✅ Confirme se webhook está configurado
- ✅ Verifique status da API Key

**Proprietário não recebeu:**
- ✅ Confirme dados bancários na subconta
- ✅ Verifique se conta está validada no ASAAS
- ✅ Aguarde até 2 dias úteis (prazo ASAAS)

### 2. **Contatos de Suporte:**

- **ASAAS:** suporte@asaas.com
- **G-PROP:** Via configurações do sistema

---

## 📋 Checklist de Implementação

### Para Começar:

- [ ] 1. Configurar API Key ASAAS na imobiliária
- [ ] 2. Testar conexão com ASAAS
- [ ] 3. Configurar webhook no painel ASAAS
- [ ] 4. Criar subcontas para proprietários existentes
- [ ] 5. Testar com um contrato piloto
- [ ] 6. Verificar se split foi realizado corretamente
- [ ] 7. Treinar equipe no novo fluxo
- [ ] 8. Implementar para todos os contratos

### Verificações Mensais:

- [ ] Conferir se todos os splits foram realizados
- [ ] Verificar status das subcontas de proprietários
- [ ] Acompanhar relatórios de taxas ASAAS
- [ ] Validar satisfação dos proprietários

---

## 💡 Benefícios do Sistema

### Para a Imobiliária:
- ✅ **Automatização total** - sem repasses manuais
- ✅ **Redução de erros** - sem cálculos manuais  
- ✅ **Economia de tempo** - sem transferências bancárias
- ✅ **Transparência** - proprietários veem tudo
- ✅ **Profissionalização** - sistema robusto

### Para os Proprietários:
- ✅ **Recebimento automático** - sem atrasos
- ✅ **Transparência total** - valores claros
- ✅ **Sem tarifas extras** - só a comissão acordada
- ✅ **Controle total** - painel próprio no ASAAS
- ✅ **Histórico completo** - todas as transações

---

## 🎉 Pronto para Usar!

Com o sistema configurado, você terá:

- 🏦 **Split automático** de todos os pagamentos
- 📊 **Relatórios completos** de transações
- 💰 **Gestão eficiente** do fluxo de caixa
- 😊 **Proprietários satisfeitos** com transparência
- ⚡ **Operação escalável** para crescer sem limites

**Importante:** Este sistema é uma solução profissional que eliminará 90% do trabalho manual com repasses, permitindo que você foque no crescimento da sua imobiliária!

---

*Desenvolvido para G-PROP CRM Imobiliário*  
*Versão 1.0 - Janeiro 2025*