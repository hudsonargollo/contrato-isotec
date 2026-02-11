/**
 * Server-side Authentication Utilities
 * 
 * Wrapper utilities for server-side authentication and authorization
 * used in API routes and server components.
 */

export { getCurrentUser, getCurrentUserProfile } from '@/lib/supabase/auth';
export { getTenantContext } from '@/lib/utils/tenant-context';
export { hasPermission } from '@/lib/types/tenant';