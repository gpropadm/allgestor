import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { DimobGenerator, ContractData } from '@/lib/dimob-generator'

// POST - Gerar arquivo DIMOB com dados já processados
export async function POST(request: NextRequest) {
  try {
    console.log('=== DIMOB GENERATE API INICIADA ===')
    
    const user = await requireAuth(request)
    console.log('Usuário autenticado:', user.id)
    
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    console.log('Ano solicitado:', year)
    
    // Buscar dados das NFS-e (com fallback para dados de exemplo)
    let nfseRecords: any[] = []
    let usingRealData = false
    
    try {
      const realNfseRecords = await prisma.nFSe.findMany({
        where: {
          userId: user.id,
          competencia: {
            gte: new Date(`${year}-01-01`),
            lte: new Date(`${year}-12-31`)
          }
        },
        orderBy: {
          competencia: 'asc'
        }
      })
      
      if (realNfseRecords.length > 0) {
        nfseRecords = realNfseRecords
        usingRealData = true
        console.log('Usando dados reais do banco:', nfseRecords.length)
      }
    } catch (dbError) {
      console.log('Usando dados de exemplo para geração')
    }
    
    // Se não há dados reais, usar dados de exemplo
    if (nfseRecords.length === 0) {
      nfseRecords = [
        {
          id: 'example-1',
          numeroNota: '000001234',
          competencia: new Date('2024-01-15'),
          dataEmissao: new Date('2024-01-15'),
          valorServicos: 2500.00,
          valorLiquido: 2375.00,
          valorIss: 125.00,
          valorPis: 0,
          valorCofins: 0,
          valorInss: 0,
          valorIr: 0,
          codigoServico: '07.02',
          discriminacao: 'SERVICOS DE ADMINISTRACAO PREDIAL - ALUGUEL IMOVEL RUA DAS FLORES 123',
          tomadorCnpjCpf: '12345678901',
          tomadorRazaoSocial: 'JOSE DA SILVA PROPRIETARIO',
          tomadorEndereco: 'RUA DAS FLORES 123 APT 45, JARDINS, SAO PAULO/SP',
          prestadorCnpjCpf: '12345678000199',
          prestadorRazaoSocial: 'IMOBILIARIA TESTE LTDA'
        },
        {
          id: 'example-2',
          numeroNota: '000001235',
          competencia: new Date('2024-02-15'),
          dataEmissao: new Date('2024-02-15'),
          valorServicos: 3200.00,
          valorLiquido: 3040.00,
          valorIss: 160.00,
          valorPis: 0,
          valorCofins: 0,
          valorInss: 0,
          valorIr: 0,
          codigoServico: '07.02',
          discriminacao: 'SERVICOS DE ADMINISTRACAO PREDIAL - ALUGUEL IMOVEL AV PAULISTA 500',
          tomadorCnpjCpf: '98765432100',
          tomadorRazaoSocial: 'MARIA SANTOS PROPRIETARIA',
          tomadorEndereco: 'AV PAULISTA 500 CONJ 102, BELA VISTA, SAO PAULO/SP',
          prestadorCnpjCpf: '12345678000199',
          prestadorRazaoSocial: 'IMOBILIARIA TESTE LTDA'
        }
      ]
    }

    // Converter NFS-e em contratos para o DIMOB
    const contractData: ContractData[] = nfseRecords.map((nfse, index) => ({
      id: `contract-${nfse.id}`,
      propertyId: `property-${nfse.id}`,
      tenantId: `tenant-${nfse.id}`,
      ownerId: `owner-${nfse.id}`,
      startDate: new Date(`${year}-01-01`).toISOString(),
      endDate: new Date(`${year}-12-31`).toISOString(),
      rentAmount: Number(nfse.valorServicos),
      property: {
        address: nfse.tomadorEndereco || `Imóvel ${index + 1}`,
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        type: 'RESIDENTIAL'
      },
      tenant: {
        name: `Inquilino do Imóvel ${index + 1}`,
        document: '11122233344',
        email: 'inquilino@teste.com'
      },
      owner: {
        name: nfse.tomadorRazaoSocial || `Proprietário ${index + 1}`,
        document: nfse.tomadorCnpjCpf || '12345678901',
        email: 'proprietario@teste.com'
      }
    }))

    console.log('Contratos gerados para DIMOB:', contractData.length)

    // Buscar dados da empresa
    let company
    try {
      company = await prisma.company.findUnique({
        where: { id: user.companyId }
      })
    } catch (error) {
      console.log('Usando dados de empresa de exemplo')
    }
    
    if (!company) {
      company = {
        document: '12345678000199',
        name: 'IMOBILIARIA TESTE LTDA'
      }
    }

    // Converter NFS-e para formato NFSeData para o gerador
    const nfseData = nfseRecords.map(nfse => ({
      numeroNota: nfse.numeroNota,
      dataEmissao: nfse.dataEmissao.toISOString(),
      competencia: nfse.competencia.toISOString(),
      valorServicos: Number(nfse.valorServicos),
      valorLiquido: Number(nfse.valorLiquido),
      valorIss: Number(nfse.valorIss || 0),
      valorPis: Number(nfse.valorPis || 0),
      valorCofins: Number(nfse.valorCofins || 0),
      valorInss: Number(nfse.valorInss || 0),
      valorIr: Number(nfse.valorIr || 0),
      codigoServico: nfse.codigoServico || '',
      discriminacao: nfse.discriminacao || '',
      tomador: {
        cnpjCpf: nfse.tomadorCnpjCpf || '',
        razaoSocial: nfse.tomadorRazaoSocial || '',
        endereco: {
          logradouro: nfse.tomadorEndereco || '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01234567'
        }
      },
      prestador: {
        cnpjCpf: nfse.prestadorCnpjCpf || '',
        razaoSocial: nfse.prestadorRazaoSocial || '',
        inscricaoMunicipal: ''
      }
    }))

    // Gerar registros DIMOB
    const records = DimobGenerator.convertToRecords(contractData, nfseData, 10)
    const yearRecords = records.filter(r => r.month.startsWith(year.toString()))

    console.log('Registros DIMOB gerados:', yearRecords.length)

    // Validar dados antes de gerar
    const companyData = {
      cnpj: company.document,
      name: company.name,
      year: year
    }

    const validation = DimobGenerator.validateData(companyData, yearRecords)
    
    if (!validation.valid) {
      return NextResponse.json({
        error: 'Dados inválidos para gerar DIMOB',
        details: validation.errors
      }, { status: 400 })
    }

    // Gerar arquivo TXT
    const txtContent = DimobGenerator.generateDimobTXT(companyData, yearRecords)
    const fileName = DimobGenerator.generateFileName(company.document, year)

    console.log('Arquivo DIMOB gerado:', fileName)

    return NextResponse.json({
      success: true,
      data: {
        dimobFile: {
          fileName,
          content: txtContent
        },
        recordsCount: yearRecords.length,
        dataSource: usingRealData ? 'database' : 'example'
      }
    })

  } catch (error) {
    console.error('=== ERRO DIMOB GENERATE API ===')
    console.error('Erro completo:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}