/**
 * Supabase configuration validation
 * 
 * Validates that all required environment variables are set
 * and provides helpful error messages if they're missing.
 * 
 * Requirements: 11.1
 */

/**
 * Validates that required Supabase environment variables are set
 * @throws Error if required variables are missing
 */
export function validateSupabaseConfig() {
  const requiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Supabase environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all Supabase variables are set.'
    );
  }
}

/**
 * Validates that service role key is set (for server-side admin operations)
 * @throws Error if service role key is missing
 */
export function validateServiceRoleKey() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable.\n' +
      'This is required for server-side admin operations.'
    );
  }
}

/**
 * Get Supabase configuration
 * @returns Supabase configuration object
 */
export function getSupabaseConfig() {
  validateSupabaseConfig();

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/**
 * Check if Supabase is properly configured
 * @returns true if configured, false otherwise
 */
export function isSupabaseConfigured(): boolean {
  try {
    validateSupabaseConfig();
    return true;
  } catch {
    return false;
  }
}
