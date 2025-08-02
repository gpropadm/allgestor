import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 SIMPLE CREATE: Starting...')
    
    // Test auth
    const user = await requireAuth(request)
    console.log('✅ User authenticated:', { id: user.id, companyId: user.companyId })
    
    const data = await request.json()
    console.log('📝 Request data:', data)
    
    // Create owner without bank account first (simpler)
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
    
    console.log('👤 Creating owner only (no bank account):', ownerData)
    
    const owner = await prisma.owner.create({
      data: ownerData
    })
    
    console.log('✅ Owner created successfully:', owner.id)
    
    // Try to create bank account separately if provided
    if (data.bankAccount && data.bankAccount.bankName) {
      console.log('🏦 Creating bank account separately...')
      
      try {
        // Use direct query to avoid schema issues
        const bankAccountQuery = `
          INSERT INTO "BankAccount" (
            id, "ownerId", "bankName", "bankCode", "accountType", 
            agency, account, "accountDigit", "pixKey", "isDefault", "isActive"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          )
        `
        
        const bankId = 'ba_' + Math.random().toString(36).substring(2)
        
        await prisma.$executeRawUnsafe(
          bankAccountQuery,
          bankId,
          owner.id,
          data.bankAccount.bankName,
          data.bankAccount.bankCode || '',
          data.bankAccount.accountType,
          data.bankAccount.agency,
          data.bankAccount.account,
          data.bankAccount.accountDigit || null,
          data.bankAccount.pixKey || null,
          true,
          true
        )
        
        console.log('✅ Bank account created with raw query')
        
      } catch (bankError) {
        console.error('⚠️ Bank account creation failed, but owner was created:', bankError)
      }
    }
    
    // Fetch the complete owner without includes that might cause issues
    const completeOwner = await prisma.owner.findUnique({
      where: { id: owner.id }
    })

    return NextResponse.json(completeOwner, { status: 201 })
    
  } catch (error) {
    console.error('❌ SIMPLE CREATE Error:', error)
    return NextResponse.json({
      error: 'Erro ao criar proprietário',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 1000) : undefined
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Simple query without includes that might cause schema issues
    const owners = await prisma.owner.findMany({
      where: {
        companyId: user.companyId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(owners)
  } catch (error) {
    console.error('❌ SIMPLE GET Error:', error)
    return NextResponse.json({
      error: 'Erro ao buscar proprietários',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}