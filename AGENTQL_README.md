# 🤖 AgentQL Integration - CRM Imobiliário

## Visão Geral

O AgentQL foi integrado ao CRM Imobiliário para automatizar a captura de dados de portais imobiliários, cartórios e sistemas governamentais usando inteligência artificial. Esta integração permite:

- 🎯 **Captura automática de leads** de OLX, ZAP Imóveis, Viva Real
- 📋 **Extração de dados de cartórios** (matrículas, proprietários, ônus)
- 🏠 **Consulta automática de IPTU** (valores, parcelas, status)
- 📊 **Monitoramento inteligente de mercado** e concorrência
- 🔄 **Sincronização automática** entre portais
- 📢 **Publicação cruzada** em múltiplos portais

## 🚀 Como Usar

### 1. Configuração Inicial

1. Obtenha sua API key do AgentQL em [agentql.com](https://agentql.com)
2. Configure a variável de ambiente:
   ```bash
   AGENTQL_API_KEY="sua-chave-api-aqui"
   ```
3. Acesse o dashboard em `/agentql`

### 2. Captura de Leads

**Manual:**
1. Va para a aba "Captura de Leads"
2. Selecione o portal (OLX, ZAP, Viva Real)
3. Cole a URL de busca com filtros aplicados
4. Clique em "Capturar Leads"

**Automático:**
1. Va para a aba "Sincronização"
2. Configure os portais e intervalo
3. Ative a sincronização automática

### 3. Consultas de Cartório

1. Va para a aba "Dados Cartório" 
2. Digite o número da matrícula
3. Selecione a cidade
4. Clique em "Extrair Dados"

**Dados extraídos:**
- Nome do proprietário
- Endereço do imóvel
- Área total
- Data de registro
- Ônus e gravames
- Descrição completa

### 4. Consultas de IPTU

1. Va para a aba "Consulta IPTU"
2. Digite o código do imóvel
3. Selecione a cidade
4. Clique em "Consultar IPTU"

**Dados extraídos:**
- Valor anual do IPTU
- Parcelas e vencimentos
- Valor venal do imóvel
- Área construída
- Status de pagamento

### 5. Monitoramento de Mercado

1. Va para a aba "Monitor Mercado"
2. Configure tipo de imóvel e localização
3. Defina faixa de preços
4. Clique em "Analisar Mercado"

**Insights gerados:**
- Preço médio da região
- Quantidade de concorrentes
- Tendências de preços
- Recomendações estratégicas

### 6. Publicação Cruzada

1. Va para a aba "Publicar"
2. Preencha dados da propriedade
3. Selecione portais de destino
4. Clique em "Publicar"

## 🔧 APIs Disponíveis

### Captura de Leads
```bash
POST /api/agentql/leads/capture
{
  "portal": "olx|zapimoveis|vivareal",
  "searchUrl": "https://...",
  "filters": {}
}
```

### Extração de Cartório
```bash
POST /api/agentql/registry/extract
{
  "registryNumber": "123456",
  "city": "São Paulo"
}
```

### Consulta IPTU
```bash
POST /api/agentql/iptu/extract
{
  "propertyCode": "12345-6789",
  "city": "São Paulo"
}
```

### Monitoramento de Mercado
```bash
POST /api/agentql/market/monitor
{
  "propertyType": "APARTMENT",
  "location": "Vila Madalena, SP",
  "priceRange": { "min": 2000, "max": 5000 }
}
```

### Sincronização
```bash
POST /api/agentql/sync
{
  "action": "setup|start|stop|status",
  "config": {
    "enabled": true,
    "portals": ["olx", "zapimoveis"],
    "interval": 60
  }
}
```

### Publicação
```bash
POST /api/agentql/publish
{
  "propertyData": {
    "title": "Apartamento 2 quartos",
    "description": "...",
    "price": 2500,
    "type": "APARTMENT",
    "location": "Vila Madalena, SP"
  },
  "portals": ["olx", "zapimoveis", "vivareal"]
}
```

## 🏗️ Estrutura do Código

```
src/
├── lib/
│   ├── agentql-service.ts       # Serviço principal do AgentQL
│   └── agentql-sync-service.ts  # Serviço de sincronização
├── app/
│   ├── agentql/
│   │   └── page.tsx             # Dashboard AgentQL
│   └── api/agentql/
│       ├── leads/capture/       # API captura de leads
│       ├── registry/extract/    # API dados cartório
│       ├── iptu/extract/        # API consulta IPTU
│       ├── market/monitor/      # API análise mercado
│       ├── sync/                # API sincronização
│       └── publish/             # API publicação
└── prisma/
    └── schema.prisma            # Novos modelos de dados
```

## 📊 Modelos de Dados

### CapturedLead
```sql
- id, source, title, price, location
- description, contact, link, images
- status, companyId, userId, capturedAt
```

### RegistryData
```sql
- id, registryNumber, city, ownerName
- propertyAddress, area, registrationDate
- liens, description, status, propertyId
```

### IPTUData
```sql
- id, propertyCode, city, annualValue
- installments, dueDate, propertyValue
- area, status, propertyId
```

### MarketAnalysis
```sql
- id, location, propertyType, priceRange
- analysisDate, marketData, insights
- averagePrice, propertyCount
```

### ScrapingJob
```sql
- id, type, source, parameters
- status, results, error
- startedAt, completedAt
```

## ⚙️ Configurações

### Variáveis de Ambiente
```bash
# Obrigatórias
AGENTQL_API_KEY="sua-chave-api"

# Opcionais
ENABLE_AGENTQL_FEATURES=true
ENABLE_AUTO_SYNC=true
DEFAULT_SYNC_INTERVAL=60
MAX_CONCURRENT_SCRAPING_JOBS=3
SCRAPING_TIMEOUT=300000
AGENTQL_RATE_LIMIT_PER_MINUTE=10
PORTAL_REQUEST_DELAY=2000
```

### Cidades Suportadas

**Cartórios:**
- São Paulo (SP)
- Rio de Janeiro (RJ) 
- Belo Horizonte (MG)

**IPTU (47 cidades em todas as regiões):**

🌍 **Norte:** Manaus, Belém, Porto Velho, Boa Vista, Rio Branco, Macapá, Palmas
🏖️ **Nordeste:** Salvador, Fortaleza, Recife, São Luís, Maceió, João Pessoa, Natal, Teresina, Aracaju
🌾 **Centro-Oeste:** Brasília, Campo Grande, Cuiabá, Goiânia
🏙️ **Sudeste:** São Paulo, Rio de Janeiro, Belo Horizonte, Vitória, Campinas, Guarulhos, São Bernardo do Campo, Santo André, Osasco, Ribeirão Preto, Sorocaba, Niterói, Campos dos Goytacazes, Juiz de Fora, Contagem, Uberlândia
❄️ **Sul:** Curitiba, Porto Alegre, Florianópolis, Londrina, Caxias do Sul, Pelotas, Canoas, Santa Maria, Joinville, Blumenau, Maringá, Ponta Grossa, Cascavel

**Portais:**
- OLX (Nacional)
- ZAP Imóveis (Nacional)
- Viva Real (Nacional)

## 🔒 Segurança

- ✅ Autenticação obrigatória para todas as APIs
- ✅ Rate limiting para evitar sobrecarga
- ✅ Validação de dados de entrada
- ✅ Logs detalhados de todas as operações
- ✅ Tratamento de erros robusto
- ✅ Timeout configurável para operações longas

## 🚨 Limitações

- Rate limit da API AgentQL (depende do plano)
- Algumas consultas podem demorar 2-5 minutos
- Captcha pode bloquear algumas consultas
- Sites podem alterar estrutura e quebrar seletores
- Dados podem não estar sempre atualizados

## 🔍 Troubleshooting

### Erro "AgentQL API Key não configurada"
```bash
# Configure a variável de ambiente
AGENTQL_API_KEY="sua-chave-aqui"
```

### Erro de timeout
```bash
# Aumente o timeout (em ms)
SCRAPING_TIMEOUT=600000  # 10 minutos
```

### Rate limit excedido
```bash
# Reduza a frequência
AGENTQL_RATE_LIMIT_PER_MINUTE=5
PORTAL_REQUEST_DELAY=5000
```

### Falha na captura
- Verifique se a URL está correta
- Teste manualmente no portal
- Verifique logs para erros específicos
- Portais podem ter mudado estrutura

## 📈 Métricas e Monitoramento

O sistema coleta métricas sobre:
- Número de leads capturados por portal
- Taxa de sucesso das consultas
- Tempo médio de resposta
- Erros por tipo e frequência
- Usage da API AgentQL

## 🔄 Atualizações

Para manter o sistema funcionando:
1. Monitore logs regularmente
2. Atualize seletores quando portais mudarem
3. Teste funcionalidades periodicamente
4. Mantenha AgentQL atualizado
5. Verifique limites de API

## 💡 Próximas Funcionalidades

- [ ] Suporte a mais cidades/cartórios
- [ ] Integração com VivaReal API oficial
- [ ] OCR para documentos escaneados
- [ ] Análise de sentimento em comentários
- [ ] Predição de preços com ML
- [ ] Alertas inteligentes por WhatsApp
- [ ] Dashboard analytics avançado
- [ ] Integração com CRM externos

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este README primeiro
2. Consulte logs da aplicação
3. Teste em ambiente de desenvolvimento
4. Verifique documentação AgentQL oficial
5. Contate suporte técnico se necessário

---

**⚡ Powered by AgentQL - Making the Web AI-Ready**