import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 RECOVERY: Starting data recovery...')
    
    // Test database connection first
    let dbStatus = 'unknown'
    let totalUsers = 0
    let totalOwners = 0
    let totalBankAccounts = 0
    let owners = []
    
    try {
      totalUsers = await prisma.user.count()
      dbStatus = 'connected'
      console.log('✅ Database connected, users:', totalUsers)
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown DB error',
        dbStatus: 'failed'
      }, { status: 500 })
    }
    
    try {
      totalOwners = await prisma.owner.count()
      console.log('👤 Total owners in database:', totalOwners)
      
      if (totalOwners > 0) {
        // Get all owners with their data
        const allOwners = await prisma.owner.findMany({
          include: {
            bankAccounts: true,
            properties: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
        
        owners = allOwners.map(owner => ({
          id: owner.id,
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
          document: owner.document,
          address: owner.address,
          city: owner.city,
          state: owner.state,
          zipCode: owner.zipCode,
          userId: owner.userId,
          companyId: owner.companyId,
          bankAccounts: owner.bankAccounts || [],
          properties: owner.properties || [],
          createdAt: owner.createdAt?.toISOString()
        }))
        
        console.log(`📊 Retrieved ${owners.length} owners with full data`)
      }
      
      totalBankAccounts = await prisma.bankAccounts.count()
      console.log('🏦 Total bank accounts:', totalBankAccounts)
      
    } catch (ownerError) {
      console.error('❌ Error fetching owners:', ownerError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch owners',
        details: ownerError instanceof Error ? ownerError.message : 'Unknown owners error',
        dbStatus,
        totalUsers
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Data recovery completed successfully',
      dbStatus,
      counts: {
        users: totalUsers,
        owners: totalOwners,
        bankAccounts: totalBankAccounts
      },
      owners: owners,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ RECOVERY Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Recovery failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 1000) : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}