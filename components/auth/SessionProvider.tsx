/**
 * Session Provider Component
 * 
 * Provides authentication session management with tenant context integration.
 * Handles session refresh, tenant switching, and authentication state management.
 * 
 * Requirements: 8.1, 12.2 - User Management and Authentication
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { getCurrentUserProfile } from '@/lib/supabase/auth';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  mfa_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

interface SessionContextValue {
  // Authentication state
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  
  // Loading states
  loading: boolean;
  initialLoading: boolean;
  
  // Actions
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Utilities
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasMFA: boolean;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

interface SessionProviderProps {
  children: React.ReactNode;
  initialSession?: Session | null;
}

export function SessionProvider({ children, initialSession }: SessionProviderProps) {
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [session, setSession] = useState<Session | null>(initialSession ?? null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!initialSession);
  
  const supabase = createClient();

  // Load user profile data
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const profileData = await getCurrentUserProfile();
      if (profileData) {
        setProfile({
          ...profileData,
          created_at: new Date(profileData.created_at),
          updated_at: new Date(profileData.updated_at)
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setProfile(null);
    }
  }, []);

  // Refresh session and profile data
  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session: newSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        setUser(null);
        setSession(null);
        setProfile(null);
        return;
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase.auth, loadProfile]);

  // Sign out user
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      
      // Clear state regardless of error
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase.auth]);

  // Initialize session on mount
  useEffect(() => {
    if (!initialSession) {
      refreshSession().finally(() => setInitialLoading(false));
    } else if (initialSession.user) {
      loadProfile(initialSession.user.id).finally(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, [initialSession, refreshSession, loadProfile]);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event, newSession?.user?.id);
      
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN' && newSession?.user) {
        await loadProfile(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      } else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
        await loadProfile(newSession.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, loadProfile]);

  // Computed values
  const isAuthenticated = !!user && !!session;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isSuperAdmin = profile?.role === 'super_admin';
  const hasMFA = profile?.mfa_enabled ?? false;

  const value: SessionContextValue = {
    user,
    session,
    profile,
    loading,
    initialLoading,
    refreshSession,
    signOut,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    hasMFA
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

// Hook to use session context
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

// Hook to require authentication
export function useRequireAuth() {
  const { isAuthenticated, initialLoading } = useSession();
  
  useEffect(() => {
    if (!initialLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated, initialLoading]);

  return { isAuthenticated, loading: initialLoading };
}

// Hook to require admin role
export function useRequireAdmin() {
  const { isAdmin, initialLoading, isAuthenticated } = useSession();
  
  useEffect(() => {
    if (!initialLoading) {
      if (!isAuthenticated) {
        window.location.href = '/login';
      } else if (!isAdmin) {
        window.location.href = '/login?error=unauthorized';
      }
    }
  }, [isAdmin, initialLoading, isAuthenticated]);

  return { isAdmin, loading: initialLoading };
}

// Hook to check specific permissions
export function usePermissions() {
  const { profile, isAuthenticated } = useSession();
  
  const hasRole = useCallback((role: string) => {
    return profile?.role === role;
  }, [profile]);

  const hasAnyRole = useCallback((roles: string[]) => {
    return roles.includes(profile?.role || '');
  }, [profile]);

  return {
    hasRole,
    hasAnyRole,
    isAuthenticated,
    role: profile?.role
  };
}