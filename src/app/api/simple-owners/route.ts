import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 SIMPLE OWNERS: Starting...')
    
    // Simple query without auth to test database
    const totalOwners = await prisma.owner.count()
    console.log('👤 Total owners in database:', totalOwners)
    
    if (totalOwners === 0) {
      return NextResponse.json({
        success: true,
        message: 'No owners found in database',
        data: [],
        count: 0
      })
    }
    
    // Get all owners without filtering by user
    const allOwners = await prisma.owner.findMany({
      include: {
        bankAccounts: true,
        properties: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`📊 Found ${allOwners.length} owners total`)
    
    const result = allOwners.map(owner => ({
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
      createdAt: owner.createdAt
    }))
    
    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
      message: `Found ${result.length} owners`
    })
    
  } catch (error) {
    console.error('❌ SIMPLE OWNERS Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 1000) : undefined
    }, { status: 500 })
  }
}