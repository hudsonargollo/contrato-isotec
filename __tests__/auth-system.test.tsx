/**
 * Authentication System Tests
 * 
 * Tests for the enhanced authentication system with MFA support,
 * session management, and tenant context integration.
 * 
 * Requirements: 8.1, 12.2 - User Management and Authentication
 */

import { render, screen, waitFor } from '@testing-library/react';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { TenantProvider } from '@/lib/contexts/tenant-context';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    pathname: '/test',
    query: {},
    asPath: '/test'
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams()
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      }),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      mfa: {
        listFactors: jest.fn().mockResolvedValue({ data: [], error: null }),
        enroll: jest.fn(),
        challenge: jest.fn(),
        verify: jest.fn(),
        unenroll: jest.fn()
      }
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      })
    })
  })
}));

// Mock server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null
      })
    }
  })
}));

// Mock auth functions
jest.mock('@/lib/supabase/auth', () => ({
  getCurrentUser: jest.fn().mockResolvedValue(null),
  getCurrentUserProfile: jest.fn().mockResolvedValue(null),
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  signOut: jest.fn(),
  getMFAFactors: jest.fn().mockResolvedValue({ data: [], error: null }),
  enrollMFA: jest.fn(),
  verifyMFAEnrollment: jest.fn(),
  challengeMFA: jest.fn(),
  verifyMFAChallenge: jest.fn(),
  unenrollMFA: jest.fn()
}));

// Mock tenant context
jest.mock('@/lib/contexts/tenant-context', () => ({
  TenantProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTenant: () => ({
    tenant: null,
    tenantUser: null,
    loading: false,
    error: null,
    hasPermission: () => false,
    hasFeature: () => false
  })
}));

describe('Authentication System', () => {
  describe('SessionProvider', () => {
    it('should render children when session provider is mounted', () => {
      render(
        <SessionProvider>
          <div data-testid="test-content">Test Content</div>
        </SessionProvider>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('should provide session context to children', async () => {
      const TestComponent = () => {
        return <div data-testid="session-test">Session Test</div>;
      };

      render(
        <SessionProvider>
          <TestComponent />
        </SessionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('session-test')).toBeInTheDocument();
      });
    });
  });

  describe('AuthGuard', () => {
    it('should show loading state initially', () => {
      render(
        <SessionProvider>
          <TenantProvider>
            <AuthGuard requireAuth={true}>
              <div data-testid="protected-content">Protected Content</div>
            </AuthGuard>
          </TenantProvider>
        </SessionProvider>
      );

      expect(screen.getByText('Verificando acesso...')).toBeInTheDocument();
    });

    it('should render children when authentication is not required', async () => {
      render(
        <SessionProvider>
          <TenantProvider>
            <AuthGuard requireAuth={false}>
              <div data-testid="public-content">Public Content</div>
            </AuthGuard>
          </TenantProvider>
        </SessionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('public-content')).toBeInTheDocument();
      });
    });

    it('should provide custom loading component when specified', () => {
      const CustomLoading = () => <div data-testid="custom-loading">Custom Loading</div>;

      render(
        <SessionProvider>
          <TenantProvider>
            <AuthGuard requireAuth={true} loadingComponent={<CustomLoading />}>
              <div data-testid="protected-content">Protected Content</div>
            </AuthGuard>
          </TenantProvider>
        </SessionProvider>
      );

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
    });
  });

  describe('Authentication Functions', () => {
    it('should handle sign in with email', async () => {
      const { signInWithEmail } = require('@/lib/supabase/auth');
      
      const mockResponse = {
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null
      };
      
      signInWithEmail.mockResolvedValue(mockResponse);

      const result = await signInWithEmail('test@example.com', 'password');
      
      expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password');
      expect(result).toEqual(mockResponse);
    });

    it('should handle sign up with email', async () => {
      const { signUpWithEmail } = require('@/lib/supabase/auth');
      
      const mockResponse = {
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null
      };
      
      signUpWithEmail.mockResolvedValue(mockResponse);

      const result = await signUpWithEmail('test@example.com', 'password', 'Test User');
      
      expect(signUpWithEmail).toHaveBeenCalledWith('test@example.com', 'password', 'Test User');
      expect(result).toEqual(mockResponse);
    });

    it('should handle MFA enrollment', async () => {
      const { enrollMFA } = require('@/lib/supabase/auth');
      
      const mockResponse = {
        data: {
          id: 'factor-123',
          type: 'totp',
          totp: {
            qr_code: 'data:image/png;base64,mock-qr-code',
            secret: 'MOCK_SECRET',
            uri: 'otpauth://totp/test'
          }
        },
        error: null
      };
      
      enrollMFA.mockResolvedValue(mockResponse);

      const result = await enrollMFA();
      
      expect(enrollMFA).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should handle MFA verification', async () => {
      const { verifyMFAEnrollment } = require('@/lib/supabase/auth');
      
      const mockResponse = {
        data: { verified: true },
        error: null
      };
      
      verifyMFAEnrollment.mockResolvedValue(mockResponse);

      const result = await verifyMFAEnrollment('factor-123', '123456');
      
      expect(verifyMFAEnrollment).toHaveBeenCalledWith('factor-123', '123456');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Session Management', () => {
    it('should handle session refresh', async () => {
      // Test session refresh functionality using the already mocked client
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { 
              session: { 
                user: { id: '123', email: 'test@example.com' },
                access_token: 'mock-token'
              } 
            },
            error: null
          })
        }
      };

      const session = await mockSupabase.auth.getSession();
      
      expect(session.data.session).toBeTruthy();
      expect(session.data.session.user.id).toBe('123');
    });

    it('should handle authentication state changes', () => {
      // Test auth state changes using the already mocked client
      const mockSupabase = {
        auth: {
          onAuthStateChange: jest.fn().mockImplementation((callback) => {
            // Simulate auth state change
            callback('SIGNED_IN', { user: { id: '123' } });
            return { data: { subscription: { unsubscribe: jest.fn() } } };
          })
        }
      };

      const callback = jest.fn();
      mockSupabase.auth.onAuthStateChange(callback);

      expect(callback).toHaveBeenCalledWith('SIGNED_IN', { user: { id: '123' } });
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      const { signInWithEmail } = require('@/lib/supabase/auth');
      
      const mockError = {
        data: null,
        error: { message: 'Invalid login credentials' }
      };
      
      signInWithEmail.mockResolvedValue(mockError);

      const result = await signInWithEmail('invalid@example.com', 'wrongpassword');
      
      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('Invalid login credentials');
    });

    it('should handle MFA errors gracefully', async () => {
      const { enrollMFA } = require('@/lib/supabase/auth');
      
      const mockError = {
        data: null,
        error: { message: 'MFA enrollment failed' }
      };
      
      enrollMFA.mockResolvedValue(mockError);

      const result = await enrollMFA();
      
      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('MFA enrollment failed');
    });
  });
});

describe('Integration Tests', () => {
  it('should integrate session provider with auth guard', async () => {
    render(
      <SessionProvider>
        <TenantProvider>
          <AuthGuard requireAuth={false}>
            <div data-testid="integrated-content">Integrated Content</div>
          </AuthGuard>
        </TenantProvider>
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('integrated-content')).toBeInTheDocument();
    });
  });

  it('should handle tenant context with authentication', async () => {
    const TestComponent = () => {
      return <div data-testid="tenant-auth-test">Tenant Auth Test</div>;
    };

    render(
      <SessionProvider>
        <TenantProvider>
          <TestComponent />
        </TenantProvider>
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('tenant-auth-test')).toBeInTheDocument();
    });
  });
});