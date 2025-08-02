const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkContracts() {
  try {
    console.log('🔍 Verificando contratos no banco...');
    
    // Contar todos os registros importantes
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.company.count(), 
      prisma.owner.count(),
      prisma.tenant.count(),
      prisma.property.count(),
      prisma.contract.count(),
      prisma.payment.count()
    ]);
    
    console.log('📊 Contagem atual:');
    console.log(`👥 Usuários: ${counts[0]}`);
    console.log(`🏢 Empresas: ${counts[1]}`);
    console.log(`🏠 Proprietários: ${counts[2]}`);
    console.log(`👤 Inquilinos: ${counts[3]}`);
    console.log(`🏡 Propriedades: ${counts[4]}`);
    console.log(`📋 Contratos: ${counts[5]}`);
    console.log(`💰 Pagamentos: ${counts[6]}`);
    
    if (counts[5] > 0) {
      console.log('\n✅ CONTRATOS ENCONTRADOS! Os dados estão seguros.');
      
      const contracts = await prisma.contract.findMany({
        include: {
          tenant: true,
          property: {
            include: {
              owner: true
            }
          },
          payments: true
        },
        take: 3
      });
      
      console.log('\n📋 Primeiros contratos:');
      contracts.forEach((contract, i) => {
        console.log(`${i+1}. ${contract.tenant.name} - ${contract.property.title}`);
        console.log(`   Valor: R$ ${contract.rentAmount} - Status: ${contract.status}`);
        console.log(`   Pagamentos: ${contract.payments.length}`);
      });
      
    } else {
      console.log('\n❌ NENHUM CONTRATO ENCONTRADO! Dados podem ter sido perdidos.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkContracts();