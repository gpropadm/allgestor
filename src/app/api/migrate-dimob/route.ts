import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Iniciando migração do campo includeInDimob...')
    
    const user = await requireAuth(request)
    console.log('✅ Usuário autenticado:', user.email)
    
    // Tentar adicionar o campo usando SQL raw
    try {
      await prisma.$executeRaw`
        ALTER TABLE "contracts" 
        ADD COLUMN IF NOT EXISTS "includeInDimob" BOOLEAN DEFAULT true;
      `
      console.log('✅ Campo includeInDimob adicionado/verificado')
    } catch (error) {
      console.log('⚠️ Campo provavelmente já existe:', error)
    }
    
    // Atualizar registros existentes que podem ter NULL
    const updateResult = await prisma.$executeRaw`
      UPDATE "contracts" 
      SET "includeInDimob" = true 
      WHERE "includeInDimob" IS NULL;
    `
    console.log('✅ Registros atualizados:', updateResult)
    
    // Verificar resultado
    const contracts = await prisma.contract.findMany({
      select: {
        id: true,
        includeInDimob: true,
        property: {
          select: {
            address: true,
            owner: {
              select: {
                name: true
              }
            }
          }
        }
      },
      take: 5
    })
    
    console.log('📋 Contratos verificados:', contracts)
    
    return NextResponse.json({
      success: true,
      message: 'Campo includeInDimob configurado com sucesso!',
      contracts: contracts
    })
    
  } catch (error) {
    console.error('❌ Erro na migração:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}