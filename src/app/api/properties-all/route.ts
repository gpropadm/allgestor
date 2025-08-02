import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('🏠 GET /api/properties-all - Getting ALL properties...')
    const user = await requireAuth(request)
    console.log('✅ User authenticated:', { id: user.id, email: user.email })
    
    // Get ALL properties first to debug
    const allProperties = await prisma.property.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`✅ Found ${allProperties.length} total properties`)
    console.log('👤 Current user ID:', user.id)
    console.log('📊 Property userIds:', allProperties.map(p => ({ title: p.title, userId: p.userId })))

    // Parse JSON strings back to arrays
    const formattedProperties = allProperties.map(property => ({
      ...property,
      images: property.images ? JSON.parse(property.images) : [],
      amenities: property.amenities ? JSON.parse(property.amenities) : [],
      availableFor: property.availableFor ? JSON.parse(property.availableFor) : ['RENT']
    }))

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      properties: formattedProperties,
      total: formattedProperties.length
    })
  } catch (error) {
    console.error('❌ Error fetching all properties:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao buscar imóveis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}