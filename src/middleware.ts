import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // URLs públicas que não precisam de autenticação
  const publicPaths = [
    '/',
    '/login',
    '/api/', // APIs podem ter sua própria auth
    '/_next/',
    '/favicon.ico',
    '/fonts/',
    '/images/'
  ]

  // Verificar se é uma rota pública
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Verificar se já está no dashboard
  if (pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  // Rotas protegidas que ficam fora do dashboard mas precisam de auth
  const protectedPaths = ['/recibos']
  
  if (protectedPaths.includes(pathname)) {
    // Verificar se tem token de sessão
    const sessionToken = request.cookies.get('next-auth.session-token')?.value || 
                         request.cookies.get('__Secure-next-auth.session-token')?.value
    
    if (!sessionToken) {
      // Não autenticado - redirecionar para login
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Autenticado - permitir acesso
    return NextResponse.next()
  }

  // REDIRECIONAR todas as outras rotas para dashboard equivalente
  const routeMap: { [key: string]: string } = {
    '/payments': '/dashboard/payments',
    '/properties': '/dashboard/properties', 
    '/contracts': '/dashboard/contracts',
    '/owners': '/dashboard/owners',
    '/tenants': '/dashboard/tenants',
    '/financial': '/dashboard/financial',
    '/expenses': '/dashboard/expenses',
    '/analytics': '/dashboard/analytics',
    '/settings': '/dashboard/settings',
    '/ai-assistants': '/dashboard/ai-assistants',
    '/ai-assistant': '/dashboard/ai-assistant',
    '/leads': '/dashboard/leads',
    '/sales-pipeline': '/dashboard/sales-pipeline',
    '/whatsapp': '/dashboard/whatsapp'
  }

  // Se há um mapeamento específico, redirecionar
  if (routeMap[pathname]) {
    return NextResponse.redirect(new URL(routeMap[pathname], request.url))
  }

  // Para qualquer outra rota não mapeada, redirecionar para dashboard principal
  return NextResponse.redirect(new URL('/dashboard', request.url))
}

export const config = {
  matcher: [
    /*
     * Aplicar middleware a todas as rotas exceto:
     * - api (handled by api routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}