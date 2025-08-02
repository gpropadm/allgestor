const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreData() {
  try {
    console.log('🔄 Iniciando restauração de dados...');
    
    // Ler backup
    const backupData = JSON.parse(fs.readFileSync('./backup-data.json', 'utf8'));
    
    console.log('📊 Dados do backup:');
    console.log('👥 Usuários:', backupData.users.length);
    console.log('🏠 Proprietários:', backupData.owners.length);
    console.log('🏢 Propriedades:', backupData.properties.length);
    
    // Restaurar Companies primeiro
    const companies = backupData.users.filter(u => u.company).map(u => u.company);
    const uniqueCompanies = companies.filter((company, index, self) => 
      index === self.findIndex(c => c.id === company.id)
    );
    
    for (const company of uniqueCompanies) {
      await prisma.company.upsert({
        where: { id: company.id },
        update: company,
        create: company
      });
    }
    console.log('✅ Companies restauradas');
    
    // Restaurar Users
    for (const user of backupData.users) {
      const userData = { ...user };
      delete userData.company; // Remove nested company
      
      await prisma.user.upsert({
        where: { id: user.id },
        update: userData,
        create: userData
      });
    }
    console.log('✅ Users restaurados');
    
    // Restaurar Owners
    for (const owner of backupData.owners) {
      const ownerData = { ...owner };
      delete ownerData.properties;
      delete ownerData.bankAccounts;
      
      await prisma.owner.upsert({
        where: { id: owner.id },
        update: ownerData,
        create: ownerData
      });
      
      // Restaurar Bank Accounts
      for (const bankAccount of owner.bankAccounts || []) {
        await prisma.bankAccounts.upsert({
          where: { id: bankAccount.id },
          update: bankAccount,
          create: bankAccount
        });
      }
    }
    console.log('✅ Owners e Bank Accounts restaurados');
    
    // Restaurar Properties
    for (const property of backupData.properties) {
      const propertyData = { ...property };
      delete propertyData.owner;
      
      await prisma.property.upsert({
        where: { id: property.id },
        update: propertyData,
        create: propertyData
      });
    }
    console.log('✅ Properties restauradas');
    
    // Verificar restauração
    const userCount = await prisma.user.count();
    const ownerCount = await prisma.owner.count();
    const propertyCount = await prisma.property.count();
    
    console.log('🎉 RESTAURAÇÃO CONCLUÍDA!');
    console.log('👥 Usuários:', userCount);
    console.log('🏠 Proprietários:', ownerCount);
    console.log('🏢 Propriedades:', propertyCount);
    
  } catch (error) {
    console.error('❌ Erro na restauração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData();