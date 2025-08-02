import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 OWNERS DEBUG: Starting...')
    
    // Get user info
    let user = null
    try {
      user = await requireAuth(request)
      console.log('✅ User authenticated:', { id: user.id, companyId: user.companyId })
    } catch (authError) {
      console.log('❌ Auth failed:', authError.message)
      return NextResponse.json({ error: 'Authentication failed', details: authError.message }, { status: 401 })
    }
    
    // Get owners for this user
    const ownersForUser = await prisma.owner.findMany({
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
    
    console.log(`👤 Found ${ownersForUser.length} owners for user ${user.id}`)
    
    // Also get total counts for debugging
    const totalOwners = await prisma.owner.count()
    const totalBankAccounts = await prisma.bankAccounts.count()
    
    // Get sample of all owners (to see if data exists but belongs to other users)
    const allOwnersSample = await prisma.owner.findMany({
      take: 5,
      include: {
        bankAccounts: true
      }
    })
    
    const result = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        companyId: user.companyId
      },
      counts: {
        ownersForThisUser: ownersForUser.length,
        totalOwners: totalOwners,
        totalBankAccounts: totalBankAccounts
      },
      ownersForUser: ownersForUser.map(owner => ({
        id: owner.id,
        name: owner.name,
        email: owner.email,
        userId: owner.userId,
        companyId: owner.companyId,
        bankAccountsCount: owner.bankAccounts?.length || 0,
        propertiesCount: owner.properties?.length || 0
      })),
      allOwnersSample: allOwnersSample.map(owner => ({
        id: owner.id,
        name: owner.name,
        userId: owner.userId,
        companyId: owner.companyId,
        bankAccountsCount: owner.bankAccounts?.length || 0
      }))
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ OWNERS DEBUG Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no debug de proprietários',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}