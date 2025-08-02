import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 OWNERS SAFE: Starting safe query without bankAccounts...')
    
    const user = await requireAuth(request)
    console.log('✅ User authenticated:', { id: user.id, email: user.email })
    
    // Query owners WITHOUT including bankAccounts to avoid column error
    const owners = await prisma.owner.findMany({
      where: {
        userId: user.id
      },
      include: {
        properties: true
        // Temporarily exclude bankAccounts due to schema issue
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`✅ Found ${owners.length} owners for user ${user.id}`)
    
    // Add empty bankAccounts array to maintain frontend compatibility
    const ownersWithEmptyBanks = owners.map(owner => ({
      ...owner,
      bankAccounts: [] // Temporary empty array
    }))
    
    return NextResponse.json(ownersWithEmptyBanks)
    
  } catch (error) {
    console.error('❌ Error fetching owners (safe mode):', error)
    return NextResponse.json(
      { 
        error: 'Erro ao buscar proprietários (modo seguro)', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}