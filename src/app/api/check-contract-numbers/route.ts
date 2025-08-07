import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log('🔍 Verificando números de contrato para user:', user.id)
    
    // Buscar contratos do usuário com raw query para evitar erro de TypeScript
    const contracts = await prisma.$queryRaw`
      SELECT id, "contractNumber", "createdAt"
      FROM "Contract" 
      WHERE "userId" = ${user.id}
      ORDER BY "createdAt" DESC
      LIMIT 10
    ` as Array<{
      id: string
      contractNumber: string | null
      createdAt: Date
    }>
    
    const withNumber = contracts.filter(c => c.contractNumber).length
    const withoutNumber = contracts.filter(c => !c.contractNumber).length
    
    return NextResponse.json({
      success: true,
      userId: user.id,
      totalContracts: contracts.length,
      withNumber,
      withoutNumber,
      contracts: contracts.map(c => ({
        id: c.id,
        contractNumber: c.contractNumber || 'NULL',
        createdAt: c.createdAt.toISOString(),
        displayNumber: c.contractNumber || c.id
      })),
      needsMigration: withoutNumber > 0,
      message: withoutNumber > 0 
        ? `${withoutNumber} contratos precisam de migração`
        : 'Todos os contratos têm números amigáveis'
    })
    
  } catch (error: any) {
    console.error('❌ Erro ao verificar contratos:', error)
    
    if (error.message?.includes('contractNumber')) {
      return NextResponse.json({
        error: 'Campo contractNumber não existe no banco',
        message: 'Execute: npx prisma db push',
        needsSchemaUpdate: true
      }, { status: 500 })
    }
    
    return NextResponse.json({
      error: 'Erro ao verificar contratos',
      details: error.message
    }, { status: 500 })
  }
}