import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { DimobGenerator, ContractData, DimobRecord } from '@/lib/dimob-generator'
import { XMLProcessor, NFSeData } from '@/lib/xml-processor'

// GET - Buscar dados para DIMOB
export async function GET(request: NextRequest) {
  try {
    console.log('=== DIMOB GET API INICIADA ===')
    
    const user = await requireAuth(request)
    console.log('Usuário autenticado:', user.id)
    
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    console.log('Ano solicitado:', year)
    
    // Primeiro, tentar buscar dados reais dos XMLs processados
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
        console.log('Usando dados reais do banco:', nfseRecords.length, 'NFS-e encontradas')
      }
    } catch (dbError) {
      console.log('Tabela NFSe não existe ainda, usando dados de exemplo')
    }
    
    // Se não há dados reais, usar dados de exemplo baseados nos XMLs de teste
    if (nfseRecords.length === 0) {
      console.log('Usando dados de exemplo para demonstração')
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
    
    console.log('Contratos gerados:', contractData.length)

    // Dados da empresa (buscar do banco ou usar exemplo)
    let company
    try {
      company = await prisma.company.findUnique({
        where: { id: user.companyId }
      })
    } catch (error) {
      console.log('Erro ao buscar empresa, usando dados de exemplo')
    }
    
    if (!company) {
      company = {
        id: 'example-company',
        name: 'IMOBILIARIA TESTE LTDA',
        document: '12345678000199'
      }
    }

    // Converter NFS-e para formato NFSeData
    const nfseData: NFSeData[] = nfseRecords.map(nfse => ({
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
    const records = DimobGenerator.convertToRecords(
      contractData,
      nfseData,
      10 // 10% de taxa administrativa
    )

    // Filtrar apenas registros do ano solicitado
    const filteredRecords = records.filter(record => 
      record.month.startsWith(year.toString())
    )

    // Gerar resumo
    const summary = DimobGenerator.generateSummary(filteredRecords)

    console.log('Registros DIMOB gerados:', filteredRecords.length)
    console.log('Resumo:', summary)

    return NextResponse.json({
      success: true,
      data: {
        year,
        contracts: contractData,
        records: filteredRecords,
        summary,
        company: {
          cnpj: company.document,
          name: company.name
        },
        dataSource: usingRealData ? 'database' : 'example',
        nfseCount: nfseRecords.length
      }
    })

  } catch (error) {
    console.error('=== ERRO DIMOB GET API ===')
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

// POST - Processar XMLs e gerar DIMOB
export async function POST(request: NextRequest) {
  try {
    console.log('=== DIMOB POST API INICIADA ===')
    const user = await requireAuth(request)
    const body = await request.json()
    const { xmlFiles, year, generateFile } = body

    if (!Array.isArray(xmlFiles) || xmlFiles.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo XML fornecido' }, { status: 400 })
    }

    // Processar cada XML
    const processedNFSe: NFSeData[] = []
    const errors: string[] = []

    for (const xmlFile of xmlFiles) {
      try {
        const { fileName, content } = xmlFile
        
        // Validar se é XML de NFS-e
        if (!XMLProcessor.validateNFSeXML(content)) {
          errors.push(`${fileName}: Não é um XML de NFS-e válido`)
          continue
        }

        // Processar XML
        const nfseList = await XMLProcessor.processMultipleNFSe(content)
        
        // Tentar salvar cada NFS-e no banco de dados
        for (const nfse of nfseList) {
          try {
            await prisma.nFSe.create({
              data: {
                userId: user.id,
                numeroNota: nfse.numeroNota,
                dataEmissao: new Date(nfse.dataEmissao),
                competencia: new Date(nfse.competencia),
                valorServicos: nfse.valorServicos,
                valorLiquido: nfse.valorLiquido,
                valorIss: nfse.valorIss || 0,
                valorPis: nfse.valorPis || 0,
                valorCofins: nfse.valorCofins || 0,
                valorInss: nfse.valorInss || 0,
                valorIr: nfse.valorIr || 0,
                codigoServico: nfse.codigoServico,
                discriminacao: nfse.discriminacao,
                tomadorCnpjCpf: nfse.tomador.cnpjCpf,
                tomadorRazaoSocial: nfse.tomador.razaoSocial,
                tomadorEndereco: `${nfse.tomador.endereco.logradouro}, ${nfse.tomador.endereco.numero} - ${nfse.tomador.endereco.cidade}/${nfse.tomador.endereco.uf}`,
                prestadorCnpjCpf: nfse.prestador.cnpjCpf,
                prestadorRazaoSocial: nfse.prestador.razaoSocial,
                fileName: fileName
              }
            })
            console.log('NFS-e salva no banco:', nfse.numeroNota)
          } catch (dbError) {
            console.log('NFS-e já existe no banco ou tabela não criada:', nfse.numeroNota)
            // Continua processamento mesmo se não conseguir salvar
          }
        }
        
        processedNFSe.push(...nfseList)

      } catch (error) {
        errors.push(`${xmlFile.fileName}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      }
    }

    // Se solicitado, gerar arquivo DIMOB
    let dimobFile: { fileName: string; content: string } | null = null
    
    if (generateFile) {
      try {
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

        // Converter XMLs processados em registros DIMOB
        const contractData: ContractData[] = processedNFSe.map((nfse, index) => ({
          id: `contract-${index}`,
          propertyId: `property-${index}`,
          tenantId: `tenant-${index}`,
          ownerId: `owner-${index}`,
          startDate: new Date(`${year}-01-01`).toISOString(),
          endDate: new Date(`${year}-12-31`).toISOString(),
          rentAmount: nfse.valorServicos,
          property: {
            address: nfse.tomador.endereco.logradouro || `Imóvel ${index + 1}`,
            city: nfse.tomador.endereco.cidade || 'São Paulo',
            state: nfse.tomador.endereco.uf || 'SP',
            zipCode: nfse.tomador.endereco.cep || '01234567',
            type: 'RESIDENTIAL'
          },
          tenant: {
            name: `Inquilino ${index + 1}`,
            document: '11122233344',
            email: 'inquilino@teste.com'
          },
          owner: {
            name: nfse.tomador.razaoSocial,
            document: nfse.tomador.cnpjCpf,
            email: 'proprietario@teste.com'
          }
        }))

        // Gerar registros DIMOB
        const records = DimobGenerator.convertToRecords(contractData, processedNFSe, 10)
        const yearRecords = records.filter(r => r.month.startsWith(year.toString()))

        // Validar dados
        const companyData = {
          cnpj: company.document,
          name: company.name,
          year: parseInt(year)
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
        const fileName = DimobGenerator.generateFileName(company.document, parseInt(year))

        dimobFile = {
          fileName,
          content: txtContent
        }
      } catch (generateError) {
        console.error('Erro ao gerar arquivo DIMOB:', generateError)
        return NextResponse.json({
          error: 'Erro ao gerar arquivo DIMOB',
          details: generateError instanceof Error ? generateError.message : 'Erro desconhecido'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processedCount: processedNFSe.length,
        errorsCount: errors.length,
        nfseData: processedNFSe,
        errors,
        dimobFile
      }
    })

  } catch (error) {
    console.error('=== ERRO DIMOB POST API ===')
    console.error('Erro completo:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}