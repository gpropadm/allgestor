import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    // Find the first user (usually the initial user who registered)
    const firstUser = await prisma.user.findFirst({
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (!firstUser) {
      return NextResponse.json(
        { error: 'No users found' },
        { status: 404 }
      )
    }

    // Update the first user to be admin
    const updatedUser = await prisma.user.update({
      where: {
        id: firstUser.id
      },
      data: {
        role: 'ADMIN'
      }
    })

    // Show all users and their roles for verification
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.email} (${updatedUser.name}) has been set as ADMIN`,
      adminUser: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      },
      allUsers: allUsers.map(user => ({
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      }))
    })
    
  } catch (error) {
    console.error('Error setting admin:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Show current users and their roles
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      users: allUsers.map(user => ({
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      })),
      adminCount: allUsers.filter(user => user.role === 'ADMIN').length,
      totalUsers: allUsers.length
    })
    
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}