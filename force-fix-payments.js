// SCRIPT SIMPLES PARA FORÇAR GERAÇÃO DE PAGAMENTOS
// Execute: node force-fix-payments.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Função para adicionar mês de forma segura
function addOneMonth(date) {
  const newDate = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate());
  if (newDate.getMonth() !== (date.getMonth() + 1) % 12) {
    newDate.setDate(0);
  }
  return newDate;
}

async function forceGeneratePayments() {
  console.log('🔍 INVESTIGANDO PROBLEMA DOS PAGAMENTOS...\n');
  
  try {
    // 1. Verificar contratos ativos
    console.log('📋 1. VERIFICANDO CONTRATOS ATIVOS:');
    const contracts = await prisma.contract.findMany({
      where: { status: 'ACTIVE' },
      include: {
        tenant: { select: { name: true } },
        property: { select: { title: true } },
        user: { select: { email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   ✅ ${contracts.length} contratos ativos encontrados\n`);
    
    if (contracts.length === 0) {
      console.log('❌ PROBLEMA: Não há contratos ativos no sistema!');
      return;
    }
    
    // 2. Verificar pagamentos existentes
    console.log('💰 2. VERIFICANDO PAGAMENTOS EXISTENTES:');
    const totalPayments = await prisma.payment.count();
    console.log(`   ✅ ${totalPayments} pagamentos existem no sistema\n`);
    
    // 3. Analisar cada contrato
    console.log('🔍 3. ANALISANDO CADA CONTRATO:');
    let contractsWithoutPayments = [];
    
    for (const contract of contracts) {
      const paymentCount = await prisma.payment.count({
        where: { contractId: contract.id }
      });
      
      console.log(`   📝 ${contract.tenant?.name} (${contract.property?.title})`);
      console.log(`      Usuário: ${contract.user?.email}`);
      console.log(`      Período: ${contract.startDate.toISOString().split('T')[0]} até ${contract.endDate.toISOString().split('T')[0]}`);
      console.log(`      Valor: R$ ${contract.rentAmount}`);
      console.log(`      Pagamentos: ${paymentCount}`);
      
      if (paymentCount === 0) {
        contractsWithoutPayments.push(contract);
        console.log(`      🚨 SEM PAGAMENTOS!`);
      } else {
        console.log(`      ✅ Tem pagamentos`);
      }
      console.log('');
    }
    
    // 4. GERAR PAGAMENTOS PARA CONTRATOS SEM PAGAMENTOS
    if (contractsWithoutPayments.length === 0) {
      console.log('✅ TODOS OS CONTRATOS JÁ TÊM PAGAMENTOS!');
      return;
    }
    
    console.log(`🚀 4. GERANDO PAGAMENTOS PARA ${contractsWithoutPayments.length} CONTRATOS SEM PAGAMENTOS:\n`);
    
    for (const contract of contractsWithoutPayments) {
      console.log(`💰 Gerando pagamentos para: ${contract.tenant?.name}`);
      
      const startDate = new Date(contract.startDate);
      const endDate = new Date(contract.endDate);
      const dayOfMonth = startDate.getDate();
      
      // Data atual para determinar status
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Primeira data de pagamento
      let paymentDate = new Date(startDate);
      paymentDate.setDate(dayOfMonth);
      
      // Se o dia já passou no mês de início, usar próximo mês
      if (paymentDate < startDate) {
        paymentDate = addOneMonth(paymentDate);
      }
      
      const payments = [];
      let count = 0;
      
      while (paymentDate <= endDate && count < 60) { // Limite de segurança
        const paymentMonth = paymentDate.getMonth();
        const paymentYear = paymentDate.getFullYear();
        
        // Determinar status baseado na data atual
        let status = 'PENDING';
        
        if (paymentYear < currentYear || (paymentYear === currentYear && paymentMonth < currentMonth)) {
          status = 'OVERDUE';
        } else {
          status = 'PENDING';
        }
        
        console.log(`   📅 ${paymentDate.toLocaleDateString('pt-BR')} - R$ ${contract.rentAmount} - ${status}`);
        
        try {
          const payment = await prisma.payment.create({
            data: {
              contractId: contract.id,
              amount: contract.rentAmount,
              dueDate: paymentDate,
              status: status
            }
          });
          
          payments.push(payment);
        } catch (error) {
          console.error(`   ❌ Erro ao criar pagamento:`, error.message);
        }
        
        count++;
        paymentDate = addOneMonth(paymentDate);
      }
      
      console.log(`   ✅ ${payments.length} pagamentos criados para ${contract.tenant?.name}\n`);
    }
    
    // 5. VERIFICAÇÃO FINAL
    console.log('🎉 5. VERIFICAÇÃO FINAL:');
    const finalPaymentCount = await prisma.payment.count();
    console.log(`   💰 Total de pagamentos no sistema: ${finalPaymentCount}`);
    
    // Verificar pagamentos por contrato
    for (const contract of contracts) {
      const paymentCount = await prisma.payment.count({
        where: { contractId: contract.id }
      });
      console.log(`   📝 ${contract.tenant?.name}: ${paymentCount} pagamentos`);
    }
    
    console.log('\n✅ CONCLUÍDO! Os pagamentos devem aparecer em https://app.gprop.com.br/payments');
    
  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
forceGeneratePayments();