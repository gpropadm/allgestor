// Script para atualizar dados da empresa BS EMPREENDIMENTOS IMOBILIARIOS
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateBsCompanyData() {
  try {
    console.log('🏢 Atualizando dados da BS EMPREENDIMENTOS IMOBILIARIOS...')

    // Buscar empresa com CNPJ da BS
    const company = await prisma.company.findFirst({
      where: {
        OR: [
          { document: '44984782000116' },
          { document: '44.984.782/0001-16' },
          { name: { contains: 'BS EMPREENDIMENTOS', mode: 'insensitive' } }
        ]
      }
    })

    if (!company) {
      console.log('❌ Empresa BS não encontrada. Criando nova empresa...')
      
      const newCompany = await prisma.company.create({
        data: {
          name: 'BS EMPREENDIMENTOS IMOBILIARIOS',
          document: '44.984.782/0001-16',
          inscricaoMunicipal: '0811036800194',
          email: 'bsimoveisdf@gmail.com',
          phone: '(61)3328-6980',
          address: 'QR 218 Conjunto O LT 30',
          city: 'Santa Maria',
          state: 'DF',
          zipCode: '72548-515',
          active: true,
          subscription: 'PREMIUM'
        }
      })
      
      console.log('✅ Nova empresa criada:', newCompany.name)
      console.log(`📧 Email: ${newCompany.email}`)
      console.log(`📞 Telefone: ${newCompany.phone}`)
      console.log(`🏢 CNPJ: ${newCompany.document}`)
      console.log(`🆔 Inscrição Municipal: ${newCompany.inscricaoMunicipal}`)
      
    } else {
      console.log('🔄 Empresa encontrada. Atualizando dados...')
      
      const updatedCompany = await prisma.company.update({
        where: { id: company.id },
        data: {
          name: 'BS EMPREENDIMENTOS IMOBILIARIOS',
          document: '44.984.782/0001-16',
          inscricaoMunicipal: '0811036800194',
          email: 'bsimoveisdf@gmail.com',
          phone: '(61)3328-6980',
          address: 'QR 218 Conjunto O LT 30',
          city: 'Santa Maria',
          state: 'DF',
          zipCode: '72548-515',
          active: true,
          subscription: 'PREMIUM'
        }
      })
      
      console.log('✅ Empresa atualizada:', updatedCompany.name)
      console.log(`📧 Email: ${updatedCompany.email}`)
      console.log(`📞 Telefone: ${updatedCompany.phone}`)
      console.log(`🏢 CNPJ: ${updatedCompany.document}`)
      console.log(`🆔 Inscrição Municipal: ${updatedCompany.inscricaoMunicipal}`)
    }

    console.log('\n🎉 Dados da BS EMPREENDIMENTOS atualizados com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro ao atualizar dados da empresa:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateBsCompanyData()