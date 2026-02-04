/**
 * Next.js Middleware for Supabase Auth Session Management
 * 
 * This middleware:
 * - Refreshes Supabase auth sessions automatically
 * - Ensures auth cookies are properly managed
 * - Protects admin routes requiring authentication
 * 
 * Requirements: 11.1, 11.2
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for auth to work
  const { data: { user } } = await supabase.auth.getUser();

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      // Redirect to login if not authenticated
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, mfa_enabled')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      // Redirect to unauthorized page if not admin
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Enforce MFA for admin users (Requirement 11.2)
    // Note: MFA verification is handled in the login flow
    // This middleware just ensures the session is valid
  }

  // Protect contract listing API (GET /api/contracts) but allow public contract creation (POST /api/contracts)
  if (request.nextUrl.pathname === '/api/contracts' && request.method === 'GET') {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - contracts/[uuid] (public contract view)
     * - api routes (handled separately in middleware logic)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|contracts/|api/).*)',
    '/api/contracts',
  ],
};
