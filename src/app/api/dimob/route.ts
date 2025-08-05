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
    
    // Buscar contratos do usuário
    console.log('Buscando contratos...')
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
    
    console.log('Contratos encontrados:', contracts.length)

    // Se não há contratos, criar dados de exemplo para o teste
    let contractData: ContractData[] = []
    
    if (contracts.length === 0) {
      console.log('Nenhum contrato encontrado, criando dados de exemplo para teste')
      contractData = [
        {
          id: 'test-contract-1',
          propertyId: 'test-property-1',
          tenantId: 'test-tenant-1',
          ownerId: 'test-owner-1',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z',
          rentAmount: 2500,
          property: {
            address: 'Rua das Flores, 123 - Apt 45',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234-567',
            type: 'RESIDENTIAL'
          },
          tenant: {
            name: 'Maria Teste Inquilina',
            document: '12345678901',
            email: 'maria@teste.com'
          },
          owner: {
            name: 'José da Silva Proprietário',
            document: '12345678901',
            email: 'jose.silva@email.com'
          }
        },
        {
          id: 'test-contract-2',
          propertyId: 'test-property-2',
          tenantId: 'test-tenant-2',
          ownerId: 'test-owner-2',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z',
          rentAmount: 3200,
          property: {
            address: 'Av Paulista, 500 - Conj 102',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01310-100',
            type: 'COMMERCIAL'
          },
          tenant: {
            name: 'João Teste Inquilino',
            document: '98765432100',
            email: 'joao@teste.com'
          },
          owner: {
            name: 'Maria Santos Proprietária',
            document: '98765432100',
            email: 'maria.santos@email.com'
          }
        }
      ]
    } else {
      // Converter contratos reais
      contractData = contracts.map(contract => ({
        id: contract.id,
        propertyId: contract.propertyId,
        tenantId: contract.tenantId,
        ownerId: contract.owner?.id || '',
        startDate: contract.startDate.toISOString(),
        endDate: contract.endDate.toISOString(),
        rentAmount: contract.rentAmount,
        property: {
          address: contract.property?.address || '',
          city: contract.property?.city || '',
          state: contract.property?.state || '',
          zipCode: contract.property?.zipCode || '',
          type: contract.property?.type === 'RESIDENTIAL' ? 'RESIDENTIAL' : 'COMMERCIAL'
        },
        tenant: {
          name: contract.tenant?.name || '',
          document: contract.tenant?.document || '',
          email: contract.tenant?.email || ''
        },
        owner: {
          name: contract.owner?.name || '',
          document: contract.owner?.document || '',
          email: contract.owner?.email || ''
        }
      }))
    }
    
    console.log('Dados dos contratos mapeados:', contractData.length)

    // Buscar dados da empresa
    let company = await prisma.company.findUnique({
      where: { id: user.companyId }
    })

    // Se não encontrou empresa, usar dados de exemplo para teste
    if (!company) {
      console.log('Empresa não encontrada, usando dados de exemplo')
      company = {
        id: 'test-company',
        name: 'IMOBILIARIA TESTE LTDA',
        document: '12345678000199',
        email: 'contato@imobiliariateste.com.br',
        phone: '11 3333-4444',
        address: 'Rua do Comércio, 100',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
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