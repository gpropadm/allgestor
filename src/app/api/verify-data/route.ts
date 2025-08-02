import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 VERIFY DATA: Starting...')
    
    // Simple data verification without auth to check database connection
    const results = {
      timestamp: new Date().toISOString(),
      database: 'checking...',
      users: 0,
      owners: 0,
      bankAccounts: 0,
      error: null
    }
    
    try {
      // Test database connection
      const userCount = await prisma.user.count()
      results.users = userCount
      results.database = 'connected'
      console.log('✅ Database connected, users found:', userCount)
      
      // Count owners
      const ownerCount = await prisma.owner.count()
      results.owners = ownerCount
      console.log('👤 Owners found:', ownerCount)
      
      // Count bank accounts
      const bankCount = await prisma.bankAccounts.count()
      results.bankAccounts = bankCount
      console.log('🏦 Bank accounts found:', bankCount)
      
      // Get sample data (first 3 owners)
      const sampleOwners = await prisma.owner.findMany({
        take: 3,
        include: {
          bankAccounts: true
        }
      })
      
      results.sampleData = sampleOwners.map(owner => ({
        id: owner.id,
        name: owner.name,
        email: owner.email,
        bankAccountsCount: owner.bankAccounts?.length || 0,
        userId: owner.userId,
        companyId: owner.companyId
      }))
      
      console.log('📋 Sample owners:', results.sampleData)
      
    } catch (dbError) {
      console.error('❌ Database error:', dbError)
      results.error = dbError instanceof Error ? dbError.message : 'Database connection failed'
      results.database = 'failed'
    }
    
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('❌ VERIFY DATA Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro na verificação',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}