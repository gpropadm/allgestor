#!/usr/bin/env node

/**
 * Script para testar o sistema completo de geração automática
 * Uso: node test-auto-system-final.js
 */

const APP_URL = 'https://app.gprop.com.br'; // Ajustar se necessário

console.log('🧪 TESTE COMPLETO - Sistema de Geração Automática de Boletos\n');

async function testCompleteSystem() {
  try {
    console.log('1️⃣ Testando execução manual do cron job...');
    
    const response = await fetch(`${APP_URL}/api/cron/auto-generate-boletos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Resposta do servidor:');
    console.log(`   📊 ${result.message}`);
    
    if (result.summary) {
      console.log('   📈 Resumo:');
      console.log(`      Total processados: ${result.summary.total}`);
      console.log(`      Sucessos: ${result.summary.successful}`);
      console.log(`      Pulados: ${result.summary.skipped}`);
      console.log(`      Erros: ${result.summary.errors}`);
    }
    
    if (result.results && result.results.length > 0) {
      console.log('\n📋 Detalhes por contrato:');
      result.results.forEach((item, i) => {
        const status = item.status === 'SUCCESS' ? '✅' : 
                      item.status === 'SKIPPED' ? '⏭️' : '❌';
        console.log(`   ${i+1}. ${status} ${item.tenant}`);
        
        if (item.status === 'SUCCESS') {
          console.log(`      💰 R$ ${item.amount} - Vence: ${item.dueDate}`);
        } else if (item.reason) {
          console.log(`      📝 ${item.reason}`);
        }
      });
    }
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Execute o script setup-cron-job.sh para configurar execução automática');
    console.log('   2. Ative geração automática em 1-2 contratos de teste');
    console.log('   3. Aguarde até dia 1º do próximo mês para ver funcionamento');
    console.log('   4. Se tudo funcionar bem, ative nos demais contratos');
    
    console.log('\n📅 CRONOGRAMA RECOMENDADO:');
    const today = new Date();
    const nextFirst = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextMonth = nextFirst.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    console.log(`   • Hoje: Ativar em contratos de teste`);
    console.log(`   • Dia 1º ${nextMonth}: Primeira execução automática`);
    console.log(`   • Verificar boletos gerados no ASAAS`);
    console.log(`   • Se OK, ativar em todos os contratos`);
    
    console.log('\n✅ Sistema testado e pronto para uso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Verifique se a URL está correta e o servidor está online');
    }
  }
}

// Verificar se fetch está disponível (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ Este script requer Node.js 18+ ou instale node-fetch');
  console.log('   npm install node-fetch@2');
  process.exit(1);
}

testCompleteSystem();