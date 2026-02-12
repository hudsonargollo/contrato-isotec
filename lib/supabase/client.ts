/**
 * Supabase client for client-side operations
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // During build time, environment variables might not be available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // If environment variables are missing, always return mock client during build
  // This handles all build environments (Cloudflare, Vercel, local, etc.)
  if (!supabaseUrl || !supabaseAnonKey) {
    // During any build process, return a comprehensive mock client
    return createMockSupabaseClient();
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
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
