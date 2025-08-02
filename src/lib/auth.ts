import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "nX2n69Lw+LgxBsMwY7AB8wvoRX5cPnELy6lZV6UCC+k=",
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔍 Auth attempt:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          console.log('🔍 User found:', !!user, user?.email)

          if (!user) {
            console.log('❌ User not found')
            return null
          }

        // Verificar se usuário está bloqueado ou inativo (campos opcionais)
        if (user.isBlocked === true) {
          throw new Error('Usuário bloqueado. Entre em contato com o administrador.')
        }

        if (user.isActive === false) {
          throw new Error('Usuário inativo. Entre em contato com o administrador.')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        console.log('🔍 Password valid:', isPasswordValid)

        if (!isPasswordValid) {
          console.log('❌ Invalid password')
          return null
        }

        // Atualizar último login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        })

        // Auto-fix missing company association
        let finalCompanyId = user.companyId
        if (!user.companyId) {
          console.log('⚠️ User has no company, attempting auto-fix...')
          try {
            // Find the first available company or create a default one
            let defaultCompany = await prisma.company.findFirst()
            
            if (!defaultCompany) {
              console.log('Creating default company for user...')
              defaultCompany = await prisma.company.create({
                data: {
                  name: 'Imobiliária Principal',
                  tradeName: 'Imobiliária Principal',
                  document: '00.000.000/0001-00',
                  email: 'contato@imobiliaria.com',
                  phone: '(11) 0000-0000',
                  address: 'Endereço principal, 123',
                  city: 'São Paulo',
                  state: 'SP',
                  zipCode: '00000-000',
                  subscription: 'BASIC'
                }
              })
            }
            
            // Associate user with company
            await prisma.user.update({
              where: { id: user.id },
              data: { companyId: defaultCompany.id }
            })
            
            finalCompanyId = defaultCompany.id
            console.log(`✅ Auto-fixed: Associated ${user.email} with ${defaultCompany.name}`)
          } catch (error) {
            console.error('❌ Failed to auto-fix company association:', error)
          }
        }

        console.log('✅ Login successful for:', user.email)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: finalCompanyId || undefined,
          companyName: undefined
        }
        } catch (error) {
          console.log('❌ Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.companyId = user.companyId
        token.companyName = user.companyName
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.companyId = token.companyId
        session.user.companyName = token.companyName
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/login'
  }
}