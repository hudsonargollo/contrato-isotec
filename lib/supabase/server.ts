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

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Check if we're in build mode (Next.js build process)
  const isBuildTime = process.env.NODE_ENV === 'production' && 
                     (process.env.CF_PAGES === '1' || process.env.VERCEL === '1' || process.env.NEXT_PHASE === 'phase-production-build');
  
  // If we're in build mode and env vars are missing, return a mock client
  if ((!supabaseUrl || !supabaseAnonKey) && isBuildTime) {
    // During build, return a comprehensive mock client
    return createMockSupabaseClient();
  }
  
  // If not in build mode and env vars are missing, throw error
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are required');
  }

  // Dynamic import to avoid issues with pages directory
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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

function createMockSupabaseClient() {
  const mockQuery = {
    select: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    delete: () => mockQuery,
    eq: () => mockQuery,
    neq: () => mockQuery,
    gt: () => mockQuery,
    gte: () => mockQuery,
    lt: () => mockQuery,
    lte: () => mockQuery,
    like: () => mockQuery,
    ilike: () => mockQuery,
    is: () => mockQuery,
    in: () => mockQuery,
    contains: () => mockQuery,
    containedBy: () => mockQuery,
    rangeGt: () => mockQuery,
    rangeGte: () => mockQuery,
    rangeLt: () => mockQuery,
    rangeLte: () => mockQuery,
    rangeAdjacent: () => mockQuery,
    overlaps: () => mockQuery,
    textSearch: () => mockQuery,
    match: () => mockQuery,
    not: () => mockQuery,
    or: () => mockQuery,
    filter: () => mockQuery,
    order: () => mockQuery,
    limit: () => mockQuery,
    range: () => mockQuery,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    csv: () => Promise.resolve({ data: '', error: null }),
    geojson: () => Promise.resolve({ data: null, error: null }),
    explain: () => Promise.resolve({ data: null, error: null }),
    then: () => Promise.resolve({ data: [], error: null }),
  };

  return {
    from: () => mockQuery,
    rpc: () => Promise.resolve({ data: null, error: null }),
    schema: () => ({ from: () => mockQuery }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signInWithOAuth: () => Promise.resolve({ data: null, error: null }),
      signUp: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: null }),
      updateUser: () => Promise.resolve({ data: null, error: null }),
      setSession: () => Promise.resolve({ data: null, error: null }),
      refreshSession: () => Promise.resolve({ data: null, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        list: () => Promise.resolve({ data: [], error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
        createSignedUrl: () => Promise.resolve({ data: null, error: null }),
        createSignedUrls: () => Promise.resolve({ data: [], error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    realtime: {
      channel: () => ({
        on: () => ({}),
        subscribe: () => Promise.resolve('SUBSCRIBED'),
        unsubscribe: () => Promise.resolve('UNSUBSCRIBED'),
      }),
    },
  } as any;
}
