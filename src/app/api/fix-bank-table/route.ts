import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/db'

export async function POST(_request: NextRequest) {
  try {
    console.log('🔄 Adding missing columns to bank_accounts table...')
    
    // Add missing columns one by one
    const alterCommands = [
      'ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "bankCode" TEXT NOT NULL DEFAULT \'000\'',
      'ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "accountDigit" TEXT',
      'ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false',
      'ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true',
      'ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "asaasWalletId" TEXT',
      'ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "pjbankAccountId" TEXT',
      'ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "validated" BOOLEAN NOT NULL DEFAULT false',
      'ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "validatedAt" TIMESTAMP(3)',
      'ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP',
      'ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP'
    ]
    
    for (const command of alterCommands) {
      try {
        await prisma.$executeRawUnsafe(command)
        console.log('✅ Executed:', command)
      } catch (e) {
        console.log('⚠️ Skipped (already exists):', command, e instanceof Error ? e.message : 'Unknown')
      }
    }
    
    console.log('✅ Bank accounts table structure updated')
    
    return NextResponse.json({
      success: true,
      message: "Bank accounts table structure updated successfully"
    })
    
  } catch (error) {
    console.error('❌ Failed to fix bank table:', error)
    return NextResponse.json({
      success: false,
      error: "Failed to fix bank table",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}