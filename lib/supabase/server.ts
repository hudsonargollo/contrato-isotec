/**
 * Supabase client for server-side operations
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function createClient() {
  // Check if we're in a server environment (allow test environment)
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
    throw new Error('createClient should only be used on the server side');
  }

  // In test environment, return a mock client if available
  if (process.env.NODE_ENV === 'test' && typeof window !== 'undefined') {
    // This will be mocked in tests
    const mockClient = (global as any).__MOCK_SUPABASE_CLIENT__;
    if (mockClient) {
      return mockClient;
    }
  }

  // Dynamic import to avoid issues with pages directory
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
