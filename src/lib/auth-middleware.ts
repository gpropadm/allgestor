import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './db'

export async function getUserFromRequest(_request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }
  
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    companyId: session.user.companyId
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await getUserFromRequest(request)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

export async function requireAuthWithCompany(request: NextRequest) {
  const user = await requireAuth(request)
  
  if (!user.companyId) {
    // Try to auto-fix by checking if user exists in database with companyId
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { companyId: true }
      })
      
      if (dbUser?.companyId) {
        // User has company in database but not in session
        // This might be a session cache issue
        user.companyId = dbUser.companyId
      } else {
        throw new Error('Usuário não está associado a uma empresa. Por favor, entre em contato com o administrador para associar sua conta a uma empresa.')
      }
    } catch (dbError) {
      console.error('Error checking user company association:', dbError)
      throw new Error('Usuário não está associado a uma empresa')
    }
  }
  
  return user
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    })
    
    if (!user) return false
    
    // Check explicit admin role
    const isExplicitAdmin = user.role === 'ADMIN'
    
    // Check fallback admin criteria (ID = 1 or email contains admin)
    const isFallbackAdmin = user.id === '1' || user.email?.toLowerCase().includes('admin')
    
    return isExplicitAdmin || isFallbackAdmin
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}