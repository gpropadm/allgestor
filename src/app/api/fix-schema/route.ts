import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 FIX SCHEMA: Starting database schema fix...')
    
    // Check if bankCode column exists
    const checkColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bank_accounts' 
      AND column_name = 'bankCode'
    `
    
    console.log('📊 BankCode column check:', checkColumn)
    
    if (Array.isArray(checkColumn) && checkColumn.length === 0) {
      console.log('🔧 Adding missing bankCode column...')
      
      // Add bankCode column
      await prisma.$executeRaw`
        ALTER TABLE "bank_accounts" 
        ADD COLUMN IF NOT EXISTS "bankCode" VARCHAR(10) DEFAULT '000'
      `
      
      console.log('✅ BankCode column added')
    } else {
      console.log('✅ BankCode column already exists')
    }
    
    // Check if accountDigit column exists
    const checkDigit = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bank_accounts' 
      AND column_name = 'accountDigit'
    `
    
    if (Array.isArray(checkDigit) && checkDigit.length === 0) {
      console.log('🔧 Adding missing accountDigit column...')
      
      // Add accountDigit column
      await prisma.$executeRaw`
        ALTER TABLE "bank_accounts" 
        ADD COLUMN IF NOT EXISTS "accountDigit" VARCHAR(2)
      `
      
      console.log('✅ AccountDigit column added')
    } else {
      console.log('✅ AccountDigit column already exists')
    }
    
    // Update existing records with default bankCode if null
    await prisma.$executeRaw`
      UPDATE "bank_accounts" 
      SET "bankCode" = '000' 
      WHERE "bankCode" IS NULL
    `
    
    console.log('✅ Updated existing records with default bankCode')
    
    // Test a simple query to make sure everything works
    const count = await prisma.bankAccounts.count()
    console.log('🏦 Bank accounts count after fix:', count)
    
    // Test include query that was failing
    const testOwner = await prisma.owner.findFirst({
      include: {
        bankAccounts: true
      }
    })
    
    console.log('✅ Test query successful, found owner:', testOwner?.name || 'None')
    
    return NextResponse.json({
      success: true,
      message: 'Database schema fixed successfully',
      changes: [
        'Added bankCode column to bank_accounts',
        'Added accountDigit column to bank_accounts', 
        'Updated existing records with default values'
      ],
      bankAccountsCount: count,
      testQuery: 'successful'
    })
    
  } catch (error) {
    console.error('❌ FIX SCHEMA Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fix schema',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 1000) : undefined
    }, { status: 500 })
  }
}