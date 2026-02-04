/**
 * Supabase utilities index
 * 
 * Central export point for all Supabase-related utilities:
 * - Client creation for browser and server
 * - Authentication helpers
 * - Admin client with service role
 * - Configuration validation
 * - Type definitions
 * 
 * Requirements: 11.1, 11.2
 */

// Client exports
export { createClient as createBrowserClient } from './client';
export { createClient as createServerClient } from './server';

// Admin client exports
export { createAdminClient, withAdminClient } from './admin';

// Auth exports
export {
  getCurrentUser,
  getCurrentUserProfile,
  isAdmin,
  hasMFAEnabled,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  resetPassword,
  updatePassword,
  enrollMFA,
  verifyMFAEnrollment,
  challengeMFA,
  verifyMFAChallenge,
  getMFAFactors,
  unenrollMFA,
} from './auth';

// Config exports
export {
  validateSupabaseConfig,
  validateServiceRoleKey,
  getSupabaseConfig,
  isSupabaseConfigured,
} from './config';

// Type exports
export type { Database } from './types';
