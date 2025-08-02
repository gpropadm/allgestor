import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting simple backup debug...')
    
    // 1. Testar autenticação
    let user
    try {
      user = await requireAuth(request)
      console.log('✅ Auth OK:', { id: user.id, email: user.email })
    } catch (authError) {
      console.error('❌ Auth failed:', authError)
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError instanceof Error ? authError.message : 'Unknown auth error'
      }, { status: 401 })
    }

    // 2. Testar conexão com banco
    try {
      const testConnection = await prisma.$queryRaw`SELECT 1 as test`
      console.log('✅ Database OK:', testConnection)
    } catch (dbError) {
      console.error('❌ Database failed:', dbError)
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: dbError instanceof Error ? dbError.message : 'Unknown db error'
      }, { status: 500 })
    }

    // 3. Testar busca simples
    let basicData = {
      users: 0,
      companies: 0,
      owners: 0,
      properties: 0,
      errors: []
    }

    // Testar users
    try {
      const userCount = await prisma.user.count()
      basicData.users = userCount
      console.log('✅ Users count:', userCount)
    } catch (error) {
      console.error('❌ Users error:', error)
      basicData.errors.push(`Users: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Testar companies
    try {
      const companyCount = await prisma.company.count()
      basicData.companies = companyCount
      console.log('✅ Companies count:', companyCount)
    } catch (error) {
      console.error('❌ Companies error:', error)
      basicData.errors.push(`Companies: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Testar owners
    try {
      const ownerCount = await prisma.owner.count()
      basicData.owners = ownerCount
      console.log('✅ Owners count:', ownerCount)
    } catch (error) {
      console.error('❌ Owners error:', error)
      basicData.errors.push(`Owners: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Testar properties
    try {
      const propertyCount = await prisma.property.count()
      basicData.properties = propertyCount
      console.log('✅ Properties count:', propertyCount)
    } catch (error) {
      console.error('❌ Properties error:', error)
      basicData.errors.push(`Properties: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // 4. Retornar diagnóstico
    const result = {
      status: 'debug_success',
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        companyId: user.companyId,
        role: user.role
      },
      data: basicData,
      prismaClient: {
        available: !!prisma,
        methods: {
          user: !!prisma.user,
          company: !!prisma.company,
          owner: !!prisma.owner,
          property: !!prisma.property
        }
      }
    }

    console.log('✅ Debug complete:', result)
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Critical error in simple backup:', error)
    
    return NextResponse.json({
      error: 'Critical error in backup debug',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}