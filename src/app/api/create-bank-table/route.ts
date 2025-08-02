import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/db'

export async function POST(_request: NextRequest) {
  try {
    console.log('🔄 Creating bank_accounts table...')
    
    // Create the bank_accounts table with raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "bank_accounts" (
        "id" TEXT NOT NULL,
        "ownerId" TEXT NOT NULL,
        "bankName" TEXT NOT NULL,
        "bankCode" TEXT NOT NULL,
        "accountType" TEXT NOT NULL,
        "agency" TEXT NOT NULL,
        "account" TEXT NOT NULL,
        "accountDigit" TEXT,
        "pixKey" TEXT,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "asaasWalletId" TEXT,
        "pjbankAccountId" TEXT,
        "validated" BOOLEAN NOT NULL DEFAULT false,
        "validatedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
      );
    `
    
    // Add foreign key constraint
    await prisma.$executeRaw`
      ALTER TABLE "bank_accounts" 
      ADD CONSTRAINT "bank_accounts_ownerId_fkey" 
      FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `
    
    console.log('✅ Bank accounts table created successfully')
    
    return NextResponse.json({
      success: true,
      message: "Bank accounts table created successfully"
    })
    
  } catch (error) {
    console.error('❌ Failed to create bank table:', error)
    return NextResponse.json({
      success: false,
      error: "Failed to create bank table",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}