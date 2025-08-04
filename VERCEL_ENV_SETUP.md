# 🔧 Configuração de Variáveis de Ambiente - Vercel

## 🚨 VARIÁVEIS CRÍTICAS PARA O SISTEMA DE IA

### 1. **Banco de Dados**
```
DATABASE_URL=postgresql://username:password@host:port/database
```

### 2. **Autenticação NextAuth**
```
NEXTAUTH_SECRET=chave-secreta-muito-longa-e-segura
NEXTAUTH_URL=https://ia-theta-hazel.vercel.app
```

### 3. **OpenAI (ESSENCIAL para Sub-Agentes)**
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. **Ambiente**
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://ia-theta-hazel.vercel.app
```

## 📋 COMO CONFIGURAR NA VERCEL:

### Via Dashboard:
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto "allgestor"
3. Vá em "Settings" → "Environment Variables"
4. Adicione cada variável acima

### Via CLI:
```bash
vercel env add OPENAI_API_KEY
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

## ⚠️ ERROS ATUAIS:

### 404 em `/api/debug/generate-payments`
- **Causa**: Falta configuração do banco de dados
- **Solução**: Configurar `DATABASE_URL`

### Sistema de IA não funciona
- **Causa**: Falta `OPENAI_API_KEY`
- **Solução**: Adicionar chave da OpenAI com créditos

## 🎯 ORDEM DE PRIORIDADE:
1. **OPENAI_API_KEY** (para sub-agentes funcionarem)
2. **DATABASE_URL** (para dados funcionarem)
3. **NEXTAUTH_SECRET** (para login funcionar)
4. **NEXTAUTH_URL** (para autenticação funcionar)

## 🔄 APÓS CONFIGURAR:
1. Fazer redeploy na Vercel
2. Testar login
3. Testar criação de assistentes IA
4. Testar conversas com sub-agentes