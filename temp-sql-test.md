# TESTE SQL DIRETO

Execute este SQL direto no banco para testar:

```sql
-- Ver estrutura da tabela
\d payments;

-- Inserir um pagamento de teste
INSERT INTO payments (
  id, 
  "contractId", 
  amount, 
  "dueDate", 
  status,
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'ID_DO_CONTRATO_AQUI',
  1500.00,
  '2025-07-15',
  'PENDING',
  NOW(),
  NOW()
);
```

Substitua ID_DO_CONTRATO_AQUI pelo ID real de um contrato ativo.