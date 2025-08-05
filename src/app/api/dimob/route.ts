import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { DimobGenerator, ContractData, DimobRecord } from '@/lib/dimob-generator'
import { XMLProcessor, NFSeData } from '@/lib/xml-processor'

// GET - Buscar dados para DIMOB
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    
    // Buscar contratos do usuário
    const contracts = await prisma.contract.findMany({
      where: {
        userId: user.id,
        // Filtrar contratos que estiveram ativos no ano especificado
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
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    // Converter para formato usado pelo gerador DIMOB
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

    // Buscar dados da empresa
    const company = await prisma.company.findUnique({
      where: { id: user.companyId }
    })

    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    // Buscar XMLs de NFS-e processados (se houver tabela para isso)
    // Por enquanto, retorna array vazio - será implementado quando tivermos a tabela
    const nfseData: NFSeData[] = []

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
    console.error('Erro ao buscar dados DIMOB:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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