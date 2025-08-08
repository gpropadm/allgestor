import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithCompany } from '@/lib/auth-middleware'
import { validateDimobData, formatValidationMessage } from '@/lib/dimob-validation'
import { prisma } from '@/lib/db'

// POST - Validar dados para DIMOB sem gerar arquivo
export async function POST(request: NextRequest) {
  try {
    console.log('=== DIMOB VALIDATION API ===')
    const user = await requireAuthWithCompany(request)
    console.log('User ID:', user.id)
    
    const { year, ownerId } = await request.json()
    console.log('Year requested:', year)
    console.log('Owner ID:', ownerId)
    
    if (!year || year < 2020 || year > 2030) {
      return NextResponse.json(
        { error: 'Ano inválido. Deve estar entre 2020 e 2030.' },
        { status: 400 }
      )
    }

    if (!ownerId) {
      return NextResponse.json(
        { error: 'ID do proprietário é obrigatório.' },
        { status: 400 }
      )
    }

    console.log(`🔍 Validando dados DIMOB para proprietário ${ownerId}, ano ${year}...`)
    
    // Buscar configurações da empresa
    const companySettings = await prisma.company.findFirst({
      where: { id: user.companyId },
      select: {
        name: true,
        responsibleCpf: true,
        municipalityCode: true
      }
    })
    
    if (!companySettings) {
      return NextResponse.json(
        { 
          isValid: false,
          error: 'Configurações da empresa não encontradas',
          errors: [{
            type: 'error',
            message: 'Configurações da empresa não encontradas. Configure os dados da empresa primeiro.',
            entity: 'Empresa'
          }],
          warnings: []
        },
        { status: 200 }
      )
    }
    
    // Buscar contratos do proprietário para o ano com todos os relacionamentos
    const contracts = await prisma.contract.findMany({
      where: {
        userId: user.id,
        property: {
          ownerId: ownerId
        },
        OR: [
          {
            startDate: {
              gte: new Date(`${year}-01-01`),
              lte: new Date(`${year}-12-31`)
            }
          },
          {
            endDate: {
              gte: new Date(`${year}-01-01`),
              lte: new Date(`${year}-12-31`)
            }
          },
          {
            AND: [
              { startDate: { lte: new Date(`${year}-01-01`) } },
              { endDate: { gte: new Date(`${year}-12-31`) } }
            ]
          }
        ]
      },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        tenant: true,
        payments: {
          where: {
            dueDate: {
              gte: new Date(`${year}-01-01`),
              lte: new Date(`${year}-12-31`)
            }
          },
          orderBy: { dueDate: 'asc' }
        }
      }
    })
    
    console.log(`📋 Encontrados ${contracts.length} contratos para validação`)
    
    // Filtrar apenas contratos marcados para inclusão no DIMOB
    const contractsForDimob = contracts.filter(contract => 
      contract.includeInDimob !== false && 
      contract.payments && 
      contract.payments.length > 0
    )
    
    console.log(`✅ ${contractsForDimob.length} contratos incluídos no DIMOB após filtros`)
    
    // Executar validações críticas
    console.log('🔎 Executando validações críticas...')
    const validationResult = validateDimobData(contractsForDimob, companySettings)
    
    console.log(`🎯 Validação concluída: ${validationResult.isValid ? 'SUCESSO' : 'ERRO'}`)
    console.log(`   - Erros: ${validationResult.errors.length}`)
    console.log(`   - Avisos: ${validationResult.warnings.length}`)
    
    // Retornar resultado estruturado
    return NextResponse.json({
      isValid: validationResult.isValid,
      summary: {
        totalContracts: contracts.length,
        contractsForDimob: contractsForDimob.length,
        totalErrors: validationResult.errors.length,
        totalWarnings: validationResult.warnings.length
      },
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      message: formatValidationMessage(validationResult),
      year,
      ownerId,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Erro ao validar dados DIMOB:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao validar dados'
    
    return NextResponse.json(
      { 
        isValid: false,
        error: errorMessage,
        type: 'validation_system_error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}