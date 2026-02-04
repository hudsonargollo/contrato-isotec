/**
 * Supabase admin client with service role key
 * 
 * This client bypasses Row Level Security (RLS) policies
 * and should ONLY be used in secure server-side contexts
 * for administrative operations.
 * 
 * WARNING: Never expose this client to the browser!
 * 
 * Requirements: 11.1
 */
import { createClient } from '@supabase/supabase-js';
import { validateServiceRoleKey } from './config';
import type { Database } from './types';

/**
 * Creates a Supabase admin client with service role privileges
 * 
 * This client bypasses RLS and should only be used for:
 * - System-level operations
 * - Admin dashboard queries
 * - Batch operations
 * - Operations that need to access data across all users
 * 
 * @returns Supabase client with admin privileges
 * @throws Error if service role key is not configured
 */
export function createAdminClient() {
  validateServiceRoleKey();

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Helper function to execute admin operations safely
 * 
 * @param operation Function that receives admin client and performs operations
 * @returns Result of the operation
 */
export async function withAdminClient<T>(
  operation: (client: ReturnType<typeof createAdminClient>) => Promise<T>
): Promise<T> {
  const adminClient = createAdminClient();
  return await operation(adminClient);
}
