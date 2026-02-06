/**
 * Admin Authentication Wrapper
 * Provides authentication checking and loading states for admin pages
 * 
 * Features:
 * - Checks user authentication status
 * - Verifies admin role permissions
 * - Shows loading states during auth checks
 * - Redirects unauthorized users
 * - Provides user info to child components
 * 
 * Requirements: 7.1, 7.6
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { AdminLayout } from './admin-layout';

interface User {
  id: string;
  email?: string;
}

interface Profile {
  id: string;
  full_name?: string;
  role: string;
  mfa_enabled?: boolean;
}

interface AdminAuthWrapperProps {
  children: React.ReactNode;
}

export function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Auth error:', userError);
        setError('Erro de autenticação');
        router.push('/login?error=auth_error');
        return;
      }

      if (!user) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }

      setUser(user);

      // Get user profile and check admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role, mfa_enabled')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        setError('Erro ao carregar perfil');
        return;
      }

      if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        router.push('/login?error=unauthorized');
        return;
      }

      setProfile(profile);
    } catch (err) {
      console.error('Unexpected auth error:', err);
      setError('Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-ocean-900 flex items-center justify-center">
        <div className="text-center">
          {/* Logo */}
          <div className="mb-8">
            <Image
              src="/isotec-logo.webp"
              alt="ISOTEC - Verificando Autenticação"
              width={120}
              height={120}
              priority
              sizes="120px"
              className="mx-auto opacity-90"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
          </div>

          {/* Loading spinner */}
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-neutral-700 border-t-solar-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-solar-400 rounded-full animate-spin mx-auto opacity-50" style={{ animationDelay: '0.1s' }}></div>
          </div>

          {/* Loading text */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">
              Verificando Autenticação
            </h2>
            <p className="text-neutral-400">
              Aguarde enquanto validamos suas credenciais...
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1 mt-6">
            <div className="w-2 h-2 bg-solar-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-solar-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-solar-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-ocean-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          {/* Logo */}
          <div className="mb-8">
            <Image
              src="/isotec-logo.webp"
              alt="ISOTEC - Erro de Autenticação"
              width={120}
              height={120}
              priority
              sizes="120px"
              className="mx-auto opacity-90"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
          </div>

          {/* Error icon */}
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Error message */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              Erro de Autenticação
            </h2>
            <p className="text-neutral-400">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-solar-500 hover:bg-solar-600 text-neutral-900 font-semibold rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - render admin layout with user info
  if (user && profile) {
    const userInfo = {
      name: profile.full_name || user.email?.split('@')[0] || 'Administrador',
      email: user.email,
      role: profile.role === 'super_admin' ? 'Super Admin' : 'Admin'
    };

    return (
      <AdminLayout userInfo={userInfo}>
        {children}
      </AdminLayout>
    );
  }

  // Fallback - should not reach here
  return null;
}

export default AdminAuthWrapper;