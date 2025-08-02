# Fix para Erro "Usuário não está associado a uma empresa"

## Problema
Usuários podem receber o erro "Usuário não está associado a uma empresa" ao tentar acessar configurações ou outras funcionalidades que exigem associação com uma empresa.

## Causa
Este erro ocorre quando:
1. O campo `companyId` no modelo `User` está `null`
2. A sessão do usuário não contém informações da empresa
3. A empresa associada foi removida ou desativada

## Soluções Implementadas

### 1. Auto-correção no Login (`/src/lib/auth.ts`)
- Durante o login, o sistema agora verifica se o usuário tem uma empresa associada
- Se não tiver, automaticamente:
  - Procura uma empresa existente no sistema
  - Se não encontrar nenhuma, cria uma empresa padrão
  - Associa o usuário à empresa

### 2. Middleware Aprimorado (`/src/lib/auth-middleware.ts`)
- Nova função `requireAuthWithCompany()` que:
  - Verifica se o usuário tem companyId na sessão
  - Se não tiver, consulta o banco de dados
  - Atualiza a sessão se necessário
  - Fornece erro mais específico

### 3. API de Correção (`/api/fix-user-company`)
- **GET**: Verifica status atual de usuários e empresas
- **POST**: Corrige automaticamente associações ausentes

### 4. API de Diagnóstico (`/api/debug-user-company`)
- Análise completa do sistema
- Identifica problemas e sugere soluções
- Relatório detalhado de usuários e empresas

### 5. API de Status do Usuário (`/api/user-status`)
- Verifica status específico do usuário logado
- Compara dados da sessão com o banco
- Lista problemas e soluções

### 6. Página de Diagnóstico (`/debug-auth`)
- Interface visual para diagnóstico
- Botões para correção automática
- Status em tempo real

## Como Usar

### Para Usuários Finais
1. Se receber o erro, tente fazer logout e login novamente
2. Se persistir, acesse `/debug-auth` para diagnóstico
3. Use o botão "Corrigir Associações" na página de diagnóstico

### Para Administradores

#### Verificar Status
```bash
curl GET /api/debug-user-company
```

#### Corrigir Automaticamente
```bash
curl -X POST /api/fix-user-company
```

#### Verificar Status Específico
```bash
curl GET /api/user-status
```

### Para Desenvolvedores

#### Usar novo middleware
```typescript
import { requireAuthWithCompany } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  const user = await requireAuthWithCompany(request)
  // user.companyId está garantido
}
```

#### Verificar associações
```javascript
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Usuários sem empresa
const orphanUsers = await prisma.user.findMany({
  where: { companyId: null }
})

// Empresas ativas
const activeCompanies = await prisma.company.findMany({
  where: { active: true }
})
```

## Estrutura de Dados

### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  companyId String?  // Pode ser null - causa do problema
  company   Company? @relation(fields: [companyId], references: [id])
}
```

### Company Model
```prisma
model Company {
  id     String  @id @default(cuid())
  name   String
  active Boolean @default(true)
  users  User[]
}
```

## Logs de Depuração

O sistema registra logs detalhados:
- ✅ Login bem-sucedido
- ⚠️ Usuário sem empresa (tentativa de correção)
- ❌ Falha na correção automática
- 🔧 Correção manual aplicada

## Monitoramento

### Métricas Importantes
- Número de usuários sem empresa: `SELECT COUNT(*) FROM users WHERE companyId IS NULL`
- Empresas ativas: `SELECT COUNT(*) FROM companies WHERE active = true`
- Logins com correção automática: logs da aplicação

### Alertas Recomendados
1. Mais de 5 usuários sem empresa
2. Nenhuma empresa ativa no sistema
3. Falhas recorrentes na correção automática

## Prevenção

### Ao Criar Usuários
```typescript
// Sempre associar a uma empresa
const user = await prisma.user.create({
  data: {
    email,
    name,
    password,
    companyId: defaultCompany.id // Sempre definir
  }
})
```

### Ao Remover Empresas
```typescript
// Verificar dependências primeiro
const userCount = await prisma.user.count({
  where: { companyId: companyToDelete.id }
})

if (userCount > 0) {
  throw new Error('Não é possível remover empresa com usuários associados')
}
```

## Rollback

Se necessário reverter as mudanças:

1. Restaurar `requireAuth` no lugar de `requireAuthWithCompany`
2. Remover auto-correção do `auth.ts`
3. Remover APIs de diagnóstico
4. Remover página de debug

## Testes

Para testar a correção:

1. Criar usuário sem empresa: `UPDATE users SET companyId = NULL WHERE email = 'test@test.com'`
2. Tentar fazer login
3. Verificar se empresa foi associada automaticamente
4. Testar acesso às configurações

## Suporte

Em caso de problemas:
1. Verificar logs da aplicação
2. Acessar `/debug-auth` para diagnóstico
3. Executar correção automática via API
4. Se necessário, associar manualmente no banco de dados