import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/owners - Starting...')
    
    const user = await requireAuth(request)
    console.log('✅ User authenticated:', { id: user.id, email: user.email, companyId: user.companyId })
    
    console.log('📊 Fetching owners for user:', user.id)
    // Try with bankAccounts first, fallback without if column missing
    let owners
    try {
      owners = await prisma.owner.findMany({
        where: {
          userId: user.id
        },
        include: {
          properties: true,
          bankAccounts: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } catch (bankError) {
      console.warn('⚠️ Bank accounts query failed, trying without:', bankError)
      owners = await prisma.owner.findMany({
        where: {
          userId: user.id
        },
        include: {
          properties: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    console.log(`✅ Found ${owners.length} owners for user ${user.id}`)
    return NextResponse.json(owners)
    
  } catch (error) {
    console.error('❌ Error fetching owners:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack',
      name: error instanceof Error ? error.name : 'Unknown'
    })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { 
        error: 'Erro ao buscar proprietários', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  let user: Record<string, any> | null = null
  let data: Record<string, any> | null = null
  
  try {
    // Debug logs
    console.log('🔍 POST /api/owners - Starting...')
    
    // First, let's test if we can even access the database
    try {
      const userCount = await prisma.user.count()
      console.log('📊 Database accessible, user count:', userCount)
    } catch (dbError) {
      console.error('💥 Database not accessible:', dbError)
      return NextResponse.json({
        error: 'Banco de dados não acessível',
        details: dbError instanceof Error ? dbError.message : 'Unknown DB error'
      }, { status: 500 })
    }
    
    user = await requireAuth(request)
    console.log('✅ User authenticated:', { id: user.id, email: user.email, companyId: user.companyId })
    
    // Check if user has a company
    if (!user.companyId) {
      console.error('❌ User has no company')
      return NextResponse.json({
        error: 'Usuário não possui empresa associada',
        details: 'CompanyId is null'
      }, { status: 400 })
    }
    
    data = await request.json()
    console.log('📝 Request data:', data)
    
    // Validate required fields
    if (!data || !data.name || !data.email || !data.phone || !data.document) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, email, telefone e documento' },
        { status: 400 }
      )
    }
    
    // Check if email or document already exists
    try {
      const existingOwner = await prisma.owner.findFirst({
        where: {
          OR: [
            { email: data.email },
            { document: data.document }
          ]
        }
      })
      
      if (existingOwner) {
        console.log('❌ Owner already exists')
        return NextResponse.json({
          error: 'Email ou documento já está em uso',
          details: `Conflito com owner ID: ${existingOwner.id}`
        }, { status: 400 })
      }
    } catch (checkError) {
      console.error('❌ Error checking existing owner:', checkError)
      return NextResponse.json({
        error: 'Erro ao verificar duplicatas',
        details: checkError instanceof Error ? checkError.message : 'Unknown check error'
      }, { status: 500 })
    }
    
    console.log('🚀 Creating owner...')
    
    const ownerData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      document: data.document,
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      zipCode: data.zipCode || '',
      companyId: user.companyId,
      userId: user.id
    }
    
    console.log('📊 Owner data to create:', ownerData)
    
    const owner = await prisma.owner.create({
      data: ownerData
    })

    console.log('✅ Owner created successfully:', owner.id)
    
    // Create bank account in bank_accounts table
    if (data.bankAccount && data.bankAccount.bankName) {
      console.log('🏦 Creating bank account in bank_accounts table...')
      try {
        const bankAccount = await prisma.bankAccount.create({
          data: {
            ownerId: owner.id,
            bankName: data.bankAccount.bankName,
            bankCode: data.bankAccount.bankCode || '000',
            accountType: data.bankAccount.accountType || 'CORRENTE',
            agency: data.bankAccount.agency,
            account: data.bankAccount.account,
            accountDigit: data.bankAccount.accountDigit || '',
            pixKey: data.bankAccount.pixKey || '',
            isDefault: true,
            isActive: true
          }
        })
        console.log('✅ Bank account created:', bankAccount.id)
      } catch (bankError) {
        console.error('❌ Bank account creation failed:', bankError)
        console.error('Bank error details:', {
          message: bankError instanceof Error ? bankError.message : 'Unknown error',
          data: data.bankAccount
        })
      }
    }
    
    // Fetch the complete owner with bank accounts
    const completeOwner = await prisma.owner.findUnique({
      where: { id: owner.id },
      include: {
        properties: true,
        bankAccounts: true
      }
    })

    return NextResponse.json(completeOwner, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating owner:', error)
    if (user) console.error('👤 User data:', { id: user.id, companyId: user.companyId })
    if (data) console.error('📝 Request data:', data)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      console.error('🚫 Unauthorized error')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Handle database constraint errors
    if (error instanceof Error) {
      console.error('💥 Error message:', error.message)
      console.error('📚 Error stack:', error.stack)
      console.error('🔍 Error name:', error.name)
      
      if (error.message.includes('Unique constraint')) {
        console.error('🔄 Unique constraint violation')
        return NextResponse.json(
          { error: 'Email ou documento já está em uso', details: error.message },
          { status: 400 }
        )
      }
      if (error.message.includes('Foreign key constraint')) {
        console.error('🔗 Foreign key constraint violation')
        return NextResponse.json(
          { error: 'Dados de usuário ou empresa inválidos', details: error.message },
          { status: 400 }
        )
      }
      if (error.message.includes('does not exist') || error.message.includes('no such table')) {
        console.error('🗃️ Table/column does not exist')
        return NextResponse.json(
          { error: 'Tabela ou coluna não existe no banco de dados', details: error.message },
          { status: 500 }
        )
      }
      if (error.message.includes('SQLITE_')) {
        console.error('💾 SQLite specific error')
        return NextResponse.json(
          { error: 'Erro no banco de dados SQLite', details: error.message },
          { status: 500 }
        )
      }
    }
    
    console.error('❓ Unknown error type:', typeof error)
    
    return NextResponse.json(
      { 
        error: 'Erro ao criar proprietário', 
        details: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.name : typeof error,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}