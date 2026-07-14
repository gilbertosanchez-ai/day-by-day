import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas siempre públicas
  const publicPaths = ['/landing', '/login', '/registro']
  const isPublic = publicPaths.some(p => pathname.startsWith(p))

  // Archivos estáticos
  const isStatic = /\.(png|jpg|svg|ico|json|js|css|woff|ttf)$/.test(pathname)

  if (isPublic || isStatic) {
    return NextResponse.next()
  }

  // Verificar cookie de sesión de Supabase
  const hasSession = request.cookies.getAll().some(c => 
    c.name.includes('auth-token') || 
    c.name.includes('sb-') ||
    c.name.includes('supabase')
  )

  if (!hasSession && pathname !== '/') {
    return NextResponse.redirect(new URL('/landing', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}