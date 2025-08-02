#!/bin/bash

# Script para configurar cron job de geração automática de boletos
# Execute: chmod +x setup-cron-job.sh && ./setup-cron-job.sh

echo "🚀 Configurando cron job para geração automática de boletos..."

# URL da aplicação (ajustar conforme necessário)
APP_URL="https://app.gprop.com.br"
CRON_COMMAND="0 6 1 * * curl -X POST -H 'Content-Type: application/json' $APP_URL/api/cron/auto-generate-boletos"

echo "📅 Agendamento: Todo dia 1º às 06:00 (horário do servidor)"
echo "🎯 Comando: $CRON_COMMAND"

# Verificar se já existe o cron job
if crontab -l 2>/dev/null | grep -q "auto-generate-boletos"; then
    echo "⚠️  Cron job já existe! Removendo o antigo..."
    crontab -l 2>/dev/null | grep -v "auto-generate-boletos" | crontab -
fi

# Adicionar novo cron job
echo "➕ Adicionando novo cron job..."
(crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -

# Verificar se foi adicionado
echo ""
echo "✅ Cron job configurado com sucesso!"
echo ""
echo "📋 Cron jobs ativos:"
crontab -l

echo ""
echo "🎯 FUNCIONAMENTO:"
echo "   • Todo dia 1º às 06:00 o sistema executará automaticamente"
echo "   • Buscará TODOS os contratos com autoGenerateBoletos = true"
echo "   • Gerará boletos do próximo mês com vencimento no dia configurado"
echo "   • Exemplo: Dia 1º agosto → Gera boletos vencimento setembro"
echo ""
echo "🧪 TESTAR MANUALMENTE:"
echo "   curl -X POST $APP_URL/api/cron/auto-generate-boletos"
echo ""
echo "📊 MONITORAR LOGS:"
echo "   tail -f /var/log/cron.log"
echo "   # ou verificar logs do Vercel/Railway"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   • Ative a geração automática apenas em contratos de teste primeiro"
echo "   • Monitore os primeiros execuções"
echo "   • Verifique se os proprietários têm wallets ASAAS configurados"
echo ""
echo "🎉 Sistema pronto para uso!"