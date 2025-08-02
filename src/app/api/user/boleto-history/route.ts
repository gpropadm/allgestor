import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    console.log('📋 Loading boleto history for company:', session.user.companyId)
    
    // Por enquanto retornar dados mock até implementarmos a persistência de boletos
    // TODO: Implementar tabela de boletos gerados pelos usuários
    const mockHistory = [
      {
        id: '1',
        amount: 1200.00,
        dueDate: '2025-01-15',
        status: 'PENDING',
        customer: 'João Silva',
        boletoUrl: 'https://example.com/boleto1',
        createdAt: '2025-01-01T10:00:00Z'
      },
      {
        id: '2',
        amount: 850.50,
        dueDate: '2025-01-10',
        status: 'PAID',
        customer: 'Maria Santos',
        boletoUrl: 'https://example.com/boleto2',
        createdAt: '2024-12-28T14:30:00Z'
      }
    ]
    
    return NextResponse.json({
      success: true,
      history: mockHistory
    })
    
  } catch (error) {
    console.error('❌ Error loading boleto history:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to load boleto history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}