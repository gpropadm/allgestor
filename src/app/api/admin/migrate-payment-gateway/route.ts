import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isUserAdmin } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const userIsAdmin = await isUserAdmin(user.id)
    
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    console.log('=== MIGRATING PAYMENT GATEWAY FIELDS ===')
    console.log('👤 Admin user:', user.email)
    
    // Import prisma dynamically to avoid issues
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    try {
      // Check if gateway column exists
      const result = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'gateway'
      `
      
      if (Array.isArray(result) && result.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Gateway field already exists in database',
          alreadyExists: true
        })
      }
      
      // Add gateway column with enum constraint
      await prisma.$executeRaw`
        DO $$ 
        BEGIN
          -- Create enum if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentGateway') THEN
            CREATE TYPE "PaymentGateway" AS ENUM ('ASAAS', 'PJBANK', 'MANUAL');
          END IF;
          
          -- Add gateway column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payments' AND column_name = 'gateway'
          ) THEN
            ALTER TABLE "payments" ADD COLUMN "gateway" "PaymentGateway" DEFAULT 'MANUAL';
          END IF;
          
          -- Add gatewayPaymentId column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payments' AND column_name = 'gatewayPaymentId'
          ) THEN
            ALTER TABLE "payments" ADD COLUMN "gatewayPaymentId" TEXT;
          END IF;
          
          -- Add boletoUrl column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payments' AND column_name = 'boletoUrl'
          ) THEN
            ALTER TABLE "payments" ADD COLUMN "boletoUrl" TEXT;
          END IF;
          
          -- Add boletoCode column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payments' AND column_name = 'boletoCode'
          ) THEN
            ALTER TABLE "payments" ADD COLUMN "boletoCode" TEXT;
          END IF;
          
          -- Add pixQrCode column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payments' AND column_name = 'pixQrCode'
          ) THEN
            ALTER TABLE "payments" ADD COLUMN "pixQrCode" TEXT;
          END IF;
          
          -- Add webhook fields if they don't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payments' AND column_name = 'webhookReceived'
          ) THEN
            ALTER TABLE "payments" ADD COLUMN "webhookReceived" BOOLEAN DEFAULT false;
          END IF;
          
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payments' AND column_name = 'lastWebhookAt'
          ) THEN
            ALTER TABLE "payments" ADD COLUMN "lastWebhookAt" TIMESTAMP;
          END IF;
          
        END $$;
      `
      
      // Update existing payments to have MANUAL gateway
      await prisma.$executeRaw`
        UPDATE "payments" 
        SET "gateway" = 'MANUAL' 
        WHERE "gateway" IS NULL
      `
      
      console.log('✅ Payment gateway fields migrated successfully')
      
      return NextResponse.json({
        success: true,
        message: 'Payment gateway fields added successfully',
        fieldsAdded: [
          'gateway (PaymentGateway enum)',
          'gatewayPaymentId (TEXT)',
          'boletoUrl (TEXT)',
          'boletoCode (TEXT)',
          'pixQrCode (TEXT)',
          'webhookReceived (BOOLEAN)',
          'lastWebhookAt (TIMESTAMP)'
        ]
      })
      
    } finally {
      await prisma.$disconnect()
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}