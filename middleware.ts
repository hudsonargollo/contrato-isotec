/**
 * Next.js Middleware for Multi-Tenant Auth and Context Management
 * 
 * This middleware:
 * - Refreshes Supabase auth sessions automatically
 * - Ensures auth cookies are properly managed
 * - Handles tenant context based on domain/subdomain
 * - Protects admin routes requiring authentication
 * - Enforces tenant-specific access controls
 * 
 * Requirements: 1.1, 1.2, 1.5, 11.1, 11.2 - Multi-Tenant Architecture
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

  // Extract tenant information from domain/subdomain
  const host = request.headers.get('host') || '';
  const url = new URL(request.url);
  let tenantId: string | null = null;
  let tenantSubdomain: string | null = null;

  // Check if this is a tenant-specific domain or subdomain
  if (host.includes('.solarcrm.clubemkt.digital')) {
    // Extract subdomain (e.g., isotec.solarcrm.clubemkt.digital -> isotec)
    const parts = host.split('.');
    if (parts.length >= 4) {
      tenantSubdomain = parts[0];
    }
  } else if (host !== 'solarcrm.clubemkt.digital' && host !== 'localhost:3000') {
    // Custom domain - look up tenant by domain
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, subdomain')
      .eq('domain', host)
      .single();
    
    if (tenant) {
      tenantId = tenant.id;
      tenantSubdomain = tenant.subdomain;
    }
  }

  // If we have a tenant subdomain, get the tenant ID
  if (tenantSubdomain && !tenantId) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', tenantSubdomain)
      .single();
    
    if (tenant) {
      tenantId = tenant.id;
    }
  }

  // Set tenant context in headers for the application to use
  if (tenantId) {
    response.headers.set('x-tenant-id', tenantId);
    response.headers.set('x-tenant-subdomain', tenantSubdomain || '');
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      // Redirect to login if not authenticated
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user has admin role or tenant access
    let hasAccess = false;

    // Check global admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, mfa_enabled')
      .eq('id', user.id)
      .single();

    if (profile && ['admin', 'super_admin'].includes(profile.role)) {
      hasAccess = true;
    }

    // If not global admin, check tenant-specific access
    if (!hasAccess && tenantId) {
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('role, status')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (tenantUser && ['owner', 'admin', 'manager'].includes(tenantUser.role)) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      // Redirect to unauthorized page if no access
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }

    // Enforce MFA for admin users (Requirement 11.2)
    // Note: MFA verification is handled in the login flow
    // This middleware just ensures the session is valid
  }

  // Protect tenant-specific routes
  if (tenantId && user) {
    // Check if user has access to this tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role, status')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    // If user doesn't have access to this tenant and it's not a public route
    if (!tenantUser && !isPublicRoute(request.nextUrl.pathname)) {
      // Check if user is a super admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'super_admin') {
        return NextResponse.redirect(new URL('/login?error=no_tenant_access', request.url));
      }
    }
  }

  // Protect contract listing API (GET /api/contracts) but allow public contract creation (POST /api/contracts)
  if (request.nextUrl.pathname === '/api/contracts' && request.method === 'GET') {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role or tenant access
    let hasAccess = false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile && ['admin', 'super_admin'].includes(profile.role)) {
      hasAccess = true;
    }

    // Check tenant access if tenant context exists
    if (!hasAccess && tenantId) {
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('role, status')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (tenantUser && ['owner', 'admin', 'manager', 'user'].includes(tenantUser.role)) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return response;
}

// Helper function to check if a route is public
function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/privacy',
    '/terms',
    '/questionnaire',
    '/api/questionnaires',
    '/api/setup'
  ];

  return publicRoutes.some(route => 
    pathname === route || 
    pathname.startsWith(route + '/') ||
    pathname.startsWith('/questionnaire/') ||
    pathname.startsWith('/contracts/') // Public contract view
  );
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
