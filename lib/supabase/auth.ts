/**
 * Authentication utilities for Supabase
 * 
 * Provides helper functions for:
 * - User authentication and session management
 * - Admin role verification
 * - MFA setup and verification
 * 
 * Requirements: 11.1, 11.2
 */
import { createClient as createServerClient } from './server';
import { createClient as createBrowserClient } from './client';

/**
 * Get the current authenticated user from server-side
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

/**
 * Get the current user's profile including role and MFA status
 * @returns Profile object or null if not found
 */
export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }
  
  const supabase = await createServerClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error || !profile) {
    return null;
  }
  
  return profile;
}

/**
 * Check if the current user is an admin
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin() {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'admin';
}

/**
 * Check if the current user has MFA enabled
 * @returns true if MFA is enabled, false otherwise
 */
export async function hasMFAEnabled() {
  const profile = await getCurrentUserProfile();
  return profile?.mfa_enabled === true;
}

/**
 * Sign in with email and password
 * @param email User email
 * @param password User password
 * @returns Auth response
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserClient();
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

/**
 * Sign out the current user
 * @returns Auth response
 */
export async function signOut() {
  const supabase = createBrowserClient();
  return await supabase.auth.signOut();
}

/**
 * Sign up a new tenant organization with owner user
 * @param email Owner email
 * @param password Owner password
 * @param fullName Owner's full name
 * @param tenantName Organization name
 * @param tenantDomain Organization subdomain (optional)
 * @returns Auth response with tenant creation
 */
export async function signUpWithTenant(
  email: string, 
  password: string, 
  fullName: string,
  tenantName: string,
  tenantDomain?: string
) {
  const supabase = createBrowserClient();
  
  // Sign up the user first
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        tenant_name: tenantName,
        tenant_domain: tenantDomain,
      },
    },
  });
  
  if (error || !data.user) {
    return { data: null, error };
  }
  
  // Create tenant organization
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: tenantName,
      subdomain: tenantDomain || tenantName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      status: 'active',
      subscription: {
        plan: 'starter',
        status: 'trial',
        limits: {
          users: 5,
          leads: 1000,
          contracts: 100,
          storage_gb: 10
        },
        features: ['crm', 'screening', 'invoices']
      },
      settings: {
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        language: 'pt-BR',
        date_format: 'DD/MM/YYYY',
        notifications: {
          email: true,
          whatsapp: false,
          sms: false
        }
      },
      branding: {
        logo_url: '',
        primary_color: '#2563eb',
        secondary_color: '#64748b',
        custom_css: '',
        white_label: false
      }
    })
    .select()
    .single();
  
  if (tenantError || !tenant) {
    return { data: null, error: tenantError };
  }
  
  // Add user as tenant owner
  const { error: tenantUserError } = await supabase
    .from('tenant_users')
    .insert({
      tenant_id: tenant.id,
      user_id: data.user.id,
      role: 'owner',
      permissions: ['*'], // Owner has all permissions
      status: 'active'
    });
  
  if (tenantUserError) {
    return { data: null, error: tenantUserError };
  }
  
  return { 
    data: {
      ...data,
      tenant
    }, 
    error: null 
  };
}

/**
 * Request password reset email
 * @param email User email
 * @returns Auth response
 */
export async function resetPassword(email: string) {
  const supabase = createBrowserClient();
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });
}

/**
 * Update user password
 * @param newPassword New password
 * @returns Auth response
 */
export async function updatePassword(newPassword: string) {
  const supabase = createBrowserClient();
  return await supabase.auth.updateUser({
    password: newPassword,
  });
}

/**
 * Enroll MFA for the current user
 * @returns MFA enrollment response with QR code
 */
export async function enrollMFA() {
  const supabase = createBrowserClient();
  
  // Enroll TOTP MFA
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
  });
  
  if (error || !data) {
    return { data: null, error };
  }
  
  return { data, error: null };
}

/**
 * Verify MFA enrollment with TOTP code
 * @param factorId MFA factor ID from enrollment
 * @param code TOTP code from authenticator app
 * @returns Verification response
 */
export async function verifyMFAEnrollment(factorId: string, code: string) {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase.auth.mfa.challenge({
    factorId,
  });
  
  if (error || !data) {
    return { data: null, error };
  }
  
  const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: data.id,
    code,
  });
  
  if (verifyError) {
    return { data: null, error: verifyError };
  }
  
  // Update profile to mark MFA as enabled
  const user = await getCurrentUser();
  if (user) {
    await supabase
      .from('profiles')
      .update({ mfa_enabled: true })
      .eq('id', user.id);
  }
  
  return { data: verifyData, error: null };
}

/**
 * Challenge MFA during sign-in
 * @param factorId MFA factor ID
 * @returns Challenge response
 */
export async function challengeMFA(factorId: string) {
  const supabase = createBrowserClient();
  return await supabase.auth.mfa.challenge({
    factorId,
  });
}

/**
 * Verify MFA challenge with TOTP code
 * @param factorId MFA factor ID
 * @param challengeId Challenge ID from challenge response
 * @param code TOTP code from authenticator app
 * @returns Verification response
 */
export async function verifyMFAChallenge(
  factorId: string,
  challengeId: string,
  code: string
) {
  const supabase = createBrowserClient();
  return await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });
}

/**
 * Get all MFA factors for the current user
 * @returns List of MFA factors
 */
export async function getMFAFactors() {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  
  if (error) {
    return { data: null, error };
  }
  
  return { data: data.totp || [], error: null };
}

/**
 * Unenroll MFA factor
 * @param factorId MFA factor ID to unenroll
 * @returns Unenroll response
 */
export async function unenrollMFA(factorId: string) {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase.auth.mfa.unenroll({
    factorId,
  });
  
  if (error) {
    return { data: null, error };
  }
  
  // Update profile to mark MFA as disabled
  const user = await getCurrentUser();
  if (user) {
    await supabase
      .from('profiles')
      .update({ mfa_enabled: false })
      .eq('id', user.id);
  }
  
  return { data, error: null };
}
