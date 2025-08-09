import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isUserAdmin } from '@/lib/auth-middleware'
import { generatePaymentsForContract } from '@/lib/payment-generator'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const status = searchParams.get('status')
    const withPayments = searchParams.get('withPayments') === 'true'
    const ownerId = searchParams.get('ownerId')
    const includeInDimob = searchParams.get('includeInDimob')
    
    // Build where condition
    const where: any = {
      userId: user.id
    }
    
    // Filter by status if provided
    if (status) {
      where.status = status
    }
    
    // Filter by includeInDimob if provided
    if (includeInDimob === 'true') {
      where.includeInDimob = true
    } else if (includeInDimob === 'false') {
      where.includeInDimob = false
    }
    
    // Filter by property owner if provided
    if (ownerId) {
      where.property = {
        ownerId: ownerId
      }
    }
    
    // Get contracts with include for related data
    const includeOptions: any = {
      property: {
        include: {
          owner: true
        }
      },
      tenant: true
    }
    
    // Include payments if requested, with year filter
    if (withPayments) {
      includeOptions.payments = {
        where: year ? {
          dueDate: {
            gte: new Date(`${year}-01-01`),
            lte: new Date(`${year}-12-31`)
          }
        } : {},
        orderBy: { dueDate: 'asc' }
      }
    }
    
    const contracts = await prisma.contract.findMany({
      where,
      include: includeOptions,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Return contracts with the new structure that includes filters
    return NextResponse.json({ 
      contracts,
      total: contracts.length,
      filters: { year, status, withPayments, ownerId, includeInDimob }
    })
  } catch (error) {
    console.error('Error fetching contracts:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar contratos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📋 POST /api/contracts - Starting contract creation...')
    const user = await requireAuth(request)
    console.log('✅ User authenticated:', { id: user.id, email: user.email })
    
    // Check if user is admin
    const userIsAdmin = await isUserAdmin(user.id)
    console.log('🔐 User is admin:', userIsAdmin)
    
    const data = await request.json()
    console.log('📝 Contract data received:', data)
    
    // Get property to access companyId and verify ownership
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Verify that the property belongs to the current user (unless admin)
    if (!userIsAdmin && property.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to property' }, { status: 403 })
    }

    // Verify that the tenant exists and belongs to the current user (unless admin)
    console.log('🔍 Looking for tenant with ID:', data.tenantId)
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: data.tenantId }
    })

    console.log('🔍 Tenant found:', tenant ? `Yes - ${tenant.name} (${tenant.email})` : 'No')

    if (!tenant) {
      // Let's also check what tenants are available
      const allTenants = await prisma.tenant.findMany({
        select: { id: true, name: true, email: true }
      })
      console.log('📋 Available tenants:', allTenants)
      
      return NextResponse.json({ 
        error: 'Tenant not found',
        requestedId: data.tenantId,
        availableTenants: allTenants
      }, { status: 404 })
    }

    if (!userIsAdmin && tenant.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to tenant' }, { status: 403 })
    }

    console.log('🚀 Creating contract with data:', {
      propertyId: data.propertyId,
      tenantId: data.tenantId,
      companyId: property.companyId,
      userId: user.id,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      rentAmount: data.rentAmount,
      depositAmount: data.depositAmount
    })
    
    const contract = await prisma.contract.create({
      data: {
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        companyId: property.companyId,
        userId: user.id,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        rentAmount: data.rentAmount,
        depositAmount: data.depositAmount,
        administrationFeePercentage: data.administrationFeePercentage || 10.0,
        includeInDimob: data.includeInDimob !== undefined ? data.includeInDimob : true,
        terms: data.terms || null,
        status: data.status || 'ACTIVE'
      },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        tenant: true
        // payments: true // Desabilitado temporariamente devido a problemas de schema
      }
    })

    // 🚀 GERAR PAGAMENTOS AUTOMATICAMENTE
    console.log('💰 Gerando pagamentos automaticamente para o contrato:', contract.id)
    console.log('📋 Dados do contrato:', {
      id: contract.id,
      startDate: contract.startDate,
      endDate: contract.endDate,
      rentAmount: contract.rentAmount,
      status: contract.status
    })
    try {
      const generatedPayments = await generatePaymentsForContract(contract.id)
      console.log('✅ Pagamentos gerados com sucesso!', generatedPayments?.length || 0, 'pagamentos')
    } catch (error) {
      console.error('❌ Erro DETALHADO ao gerar pagamentos:', error)
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack')
      // Não falhar a criação do contrato por causa dos pagamentos
    }

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating contract:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 1000) : 'No stack'
    })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { 
        error: 'Erro ao criar contrato', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}