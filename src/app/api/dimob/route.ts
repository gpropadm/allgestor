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
    
    // Buscar XMLs de NFS-e processados do banco de dados
    console.log('Buscando NFS-e do banco de dados...')
    const nfseRecords = await prisma.nFSe.findMany({
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
    
    console.log('NFS-e encontradas:', nfseRecords.length)
    
    // Converter NFS-e em contratos simulados para o DIMOB
    const contractData: ContractData[] = nfseRecords.map((nfse, index) => {
      const monthYear = nfse.competencia.toISOString().substring(0, 7) // YYYY-MM
      
      return {
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
      }
    })
    
    console.log('Dados dos contratos mapeados:', contractData.length)

    // Dados da empresa de exemplo
    const company = {
      id: 'test-company',
      name: 'IMOBILIARIA TESTE LTDA',
      document: '12345678000199'
    }

    // Buscar XMLs de NFS-e processados e converter para formato NFSeData
    const nfseData: NFSeData[] = nfseRecords.map(nfse => ({
      numeroNota: nfse.numeroNota,
      dataEmissao: nfse.dataEmissao.toISOString(),
      competencia: nfse.competencia.toISOString(),
      valorServicos: Number(nfse.valorServicos),
      valorLiquido: Number(nfse.valorLiquido),
      valorIss: Number(nfse.valorIss),
      valorPis: Number(nfse.valorPis),
      valorCofins: Number(nfse.valorCofins),
      valorInss: Number(nfse.valorInss),
      valorIr: Number(nfse.valorIr),
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
      10 // 10% de taxa administrativa padrão
    )

    // Filtrar apenas registros do ano solicitado
    const filteredRecords = records.filter(record => 
      record.month.startsWith(year.toString())
    )

    // Gerar resumo
    const summary = DimobGenerator.generateSummary(filteredRecords)

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
        }
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
        
        // Salvar cada NFS-e no banco de dados
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
                valorIss: nfse.valorIss,
                valorPis: nfse.valorPis,
                valorCofins: nfse.valorCofins,
                valorInss: nfse.valorInss,
                valorIr: nfse.valorIr,
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
            console.log('NFS-e salva:', nfse.numeroNota)
          } catch (dbError) {
            console.log('NFS-e já existe ou erro ao salvar:', nfse.numeroNota, dbError)
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
      // Buscar contratos e empresa
      const contracts = await prisma.contract.findMany({
        where: {
          userId: user.id,
          OR: [
            {
              startDate: {
                lte: new Date(`${year}-12-31`)
              },
              endDate: {
                gte: new Date(`${year}-01-01`)
              }
            }
          ]
        },
        include: {
          property: true,
          tenant: true,
          owner: true
        }
      })

      const company = await prisma.company.findUnique({
        where: { id: user.companyId }
      })

      if (company && contracts.length > 0) {
        // Converter contratos
        const contractData: ContractData[] = contracts.map(contract => ({
          id: contract.id,
          propertyId: contract.propertyId,
          tenantId: contract.tenantId,
          ownerId: contract.property.ownerId,
          startDate: contract.startDate.toISOString(),
          endDate: contract.endDate.toISOString(),
          rentAmount: contract.rentAmount,
          property: {
            address: contract.property.address,
            city: contract.property.city,
            state: contract.property.state,
            zipCode: contract.property.zipCode,
            type: contract.property.type === 'RESIDENTIAL' ? 'RESIDENTIAL' : 'COMMERCIAL'
          },
          tenant: {
            name: contract.tenant.name,
            document: contract.tenant.document,
            email: contract.tenant.email
          },
          owner: {
            name: contract.owner?.name || '',
            document: contract.owner?.document || '',
            email: contract.owner?.email || ''
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
    console.error('Erro ao processar XMLs:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}