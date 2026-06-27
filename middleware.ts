// ============================================================
// Middleware — حماية المسارات
// يتحقق من أن المستخدم مسجّل الدخول وأن دوره وحالته صحيحتان
// يُنفَّذ تلقائياً قبل كل طلب صفحة أو API محمي
//
// ── مُصحَّح إضافياً: '/api/stats' كانت مقيَّدة بـ['admin'] فقط،
// رغم أنها نقطة تحليلات المعلم نفسه (تبويب "📊 تحليلات" في
// app/teacher/page.tsx يستدعيها بـteacherId الخاص بالمعلم الحالي،
// لا بصفته أدمن). هذا القيد كان يرفض كل استدعاء من معلم فعلي برسالة
// "غير مصرح: لا يمكن لهذا الحساب الوصول لهذا المسار"، فيفشل تحميل
// stats.summary بالكامل في الواجهة. أُضيف 'teacher' للقيد. ─────────
// ============================================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/landing',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/pending-approval',
  '/roles',
  '/activity',
];

const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/register',
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
];

const STATIC_FILE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.ico',
  '.css', '.js', '.map', '.woff', '.woff2', '.ttf', '.txt', '.json',
];

const ROUTE_USER_TYPES: Record<string, string[]> = {
  '/dashboard': ['teacher', 'admin'],
  '/admin': ['admin'],
  '/teacher': ['teacher', 'admin'],
  '/student': ['student'],
  '/history': ['teacher', 'admin'],
  '/api/users': ['admin'],
  '/api/roles': ['admin'],
  '/api/teachers': ['admin'],
  '/api/teacher-subjects': ['teacher', 'admin'],
  '/api/assignments': ['teacher', 'admin', 'student'],
  '/api/submissions': ['teacher', 'admin', 'student'],
  '/api/notifications': ['teacher', 'admin', 'student'],
  '/api/messages': ['teacher', 'admin', 'student'],
  '/api/groups': ['teacher', 'admin'],
  '/api/flashcards': ['teacher', 'admin', 'student'],
  '/api/history': ['teacher', 'admin'],
  '/api/generate': ['teacher', 'admin'],
  '/api/teacher-media': ['teacher', 'admin'],
  '/api/students': ['teacher', 'admin'],
  '/api/settings': ['admin'],
  // ── مُصحَّح: 'teacher' أُضيفت — نقطة تحليلات المعلم نفسه ────────
  '/api/stats': ['teacher', 'admin'],
  '/api/activity': ['admin'],
  '/api/exams': ['teacher', 'admin', 'student'],
};

const USER_TYPE_HOME: Record<string, string> = {
  admin: '/admin',
  teacher: '/dashboard',
  student: '/student',
};

function isAdminUser(role: string, userType: string | null): boolean {
  return role === 'admin';
}

function resolveUserType(role: string, userType: string | null): string {
  if (role === 'admin') return 'admin';
  return userType || role;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/_vercel') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    STATIC_FILE_EXTENSIONS.some((ext) => pathname.toLowerCase().endsWith(ext))
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'غير مصرح — يرجى تسجيل الدخول' },
          { status: 401 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role, user_type, status, full_name')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'بيانات المستخدم غير موجودة' },
          { status: 401 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    if (userData.status === 'pending' || userData.status === 'suspended') {
      if (pathname === '/pending-approval') {
        return NextResponse.next();
      }
      if (!pathname.startsWith('/api/')) {
        const url = request.nextUrl.clone();
        url.pathname = '/pending-approval';
        return NextResponse.redirect(url);
      }
      return NextResponse.json(
        {
          success: false,
          error:
            userData.status === 'pending'
              ? 'حسابك بانتظار موافقة المدير'
              : 'حسابك معلّق — تواصل مع الإدارة',
        },
        { status: 403 }
      );
    }

    const effectiveType = resolveUserType(userData.role, userData.user_type);

    let allowedTypes: string[] | null = null;
    for (const [routePrefix, types] of Object.entries(ROUTE_USER_TYPES)) {
      if (pathname === routePrefix || pathname.startsWith(routePrefix + '/')) {
        allowedTypes = types;
        break;
      }
    }

    if (allowedTypes && !allowedTypes.includes(effectiveType)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            success: false,
            error: `غير مصرح: لا يمكن لهذا الحساب الوصول لهذا المسار`,
          },
          { status: 403 }
        );
      }
      const homePage = USER_TYPE_HOME[effectiveType] || '/landing';
      const url = request.nextUrl.clone();
      url.pathname = homePage;
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|robots.txt|sitemap.xml).*)',
  ],
};