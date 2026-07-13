import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/landing',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/pending-approval',
  '/roles',
  '/activity',
]

const PUBLIC_API_PATHS = ['/api/register', '/api/keep-alive']

const PUBLIC_API_PREFIXES = [
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/resolve-login',
  '/api/subject-packages',
  '/api/subjects',
  '/api/public-stats',
  '/api/quiz',
  '/api/lessons',
  '/api/units',
  '/api/materials',
  '/api/pptx',
  '/api/visual-card',
  '/api/feedback',
  '/api/platform-settings',
]

const STATIC_FILE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.ico',
  '.css', '.js', '.map', '.woff', '.woff2', '.ttf', '.txt', '.json',
]

function isPublicPage(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))
}

function isPublicApi(pathname: string) {
  if (PUBLIC_API_PATHS.includes(pathname)) return true
  return PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/_vercel') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    STATIC_FILE_EXTENSIONS.some(ext => pathname.toLowerCase().endsWith(ext))
  ) {
    return NextResponse.next()
  }

  if (isPublicPage(pathname) || isPublicApi(pathname)) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'غير مصرح — يرجى تسجيل الدخول' },
          { status: 401 }
        )
      }

      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    return response
  } catch (error) {
    console.error('Proxy error:', error)

    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'خطأ داخلي في التحقق من الجلسة' },
        { status: 500 }
      )
    }

    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|robots.txt|sitemap.xml).*)',
  ],
}