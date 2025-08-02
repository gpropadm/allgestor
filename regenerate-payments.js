const { PrismaClient } = require('@prisma/client');

// Configurar para usar SQLite local
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./prisma/dev.db"
    }
  }
});

/**
 * Função para adicionar um mês a uma data de forma segura
 */
function addOneMonth(date) {
  const newDate = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate());
  
  // Se houve overflow (ex: 31 de janeiro + 1 mês = 3 de março em vez de fevereiro)
  // Ajustar para o último dia do mês pretendido
  if (newDate.getMonth() !== (date.getMonth() + 1) % 12) {
    // Overflow detectado, usar o último dia do mês pretendido
    newDate.setDate(0); // Vai para o último dia do mês anterior (o mês pretendido)
  }
  
  return newDate;
}

/**
 * Gera pagamentos para um contrato específico
 */
async function generatePaymentsForContract(contractId) {
  console.log('🔄 Gerando pagamentos para contrato:', contractId);
  
  try {
    // Buscar o contrato
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { 
        tenant: { select: { name: true } },
        property: { select: { title: true } }
      }
    });
    
    if (!contract || contract.status !== 'ACTIVE') {
      console.log('❌ Contrato não encontrado ou não ativo');
      return;
    }
    
    console.log('📋 Contrato:', contract.property?.title, '- Inquilino:', contract.tenant?.name);
    
    // Verificar se já tem pagamentos
    const existingPayments = await prisma.payment.count({
      where: { contractId }
    });
    
    if (existingPayments > 0) {
      console.log(`⚠️  Já existem ${existingPayments} pagamentos. Removendo...`);
      await prisma.payment.deleteMany({
        where: { contractId }
      });
    }
    
    const startDate = new Date(contract.startDate);
    const endDate = new Date(contract.endDate);
    const dayOfMonth = startDate.getDate();
    
    console.log(`📅 Período: ${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`);
    console.log(`💰 Valor: R$ ${contract.rentAmount.toFixed(2)} - Dia: ${dayOfMonth}`);
    
    // Gerar pagamentos para todo o período do contrato
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Primeiro pagamento: usar o dia do mês de início
    let paymentDate = new Date(startDate);
    paymentDate.setDate(dayOfMonth);
    
    // Se o dia do pagamento já passou no mês de início, usar o próximo mês
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
        // Meses anteriores ao atual = EM ABERTO (OVERDUE)
        status = 'OVERDUE';
      } else {
        // Mês atual e futuros = A VENCER (PENDING)
        status = 'PENDING';
      }
      
      console.log(`  📅 ${paymentDate.toLocaleDateString('pt-BR')} - Status: ${status}`);
      
      const payment = await prisma.payment.create({
        data: {
          contractId,
          amount: contract.rentAmount,
          dueDate: paymentDate,
          status
        }
      });
      
      payments.push(payment);
      count++;
      
      // Próximo mês
      paymentDate = addOneMonth(paymentDate);
    }
    
    console.log(`✅ ${payments.length} pagamentos gerados para ${contract.tenant?.name}!`);
    return payments;
    
  } catch (error) {
    console.error('❌ Erro ao gerar pagamentos:', error);
    throw error;
  }
}

/**
 * Regenera pagamentos para todos os contratos ativos
 */
async function regenerateAllPayments() {
  console.log('🚀 Iniciando regeneração de pagamentos...\n');
  
  try {
    // Buscar todos os contratos ativos
    const activeContracts = await prisma.contract.findMany({
      where: { status: 'ACTIVE' },
      include: {
        tenant: { select: { name: true } },
        property: { select: { title: true } }
      }
    });
    
    console.log(`📊 Encontrados ${activeContracts.length} contratos ativos\n`);
    
    if (activeContracts.length === 0) {
      console.log('❌ Nenhum contrato ativo encontrado');
      return;
    }
    
    let totalPayments = 0;
    
    for (const contract of activeContracts) {
      const payments = await generatePaymentsForContract(contract.id);
      totalPayments += payments?.length || 0;
      console.log(''); // Linha em branco para separar
    }
    
    console.log(`🎉 CONCLUÍDO! ${totalPayments} pagamentos gerados para ${activeContracts.length} contratos!`);
    
    // Verificar totais
    const finalPaymentCount = await prisma.payment.count();
    console.log(`📊 Total de pagamentos no sistema: ${finalPaymentCount}`);
    
  } catch (error) {
    console.error('❌ Erro na regeneração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
regenerateAllPayments();