/**
 * Unit tests for Supabase configuration
 * 
 * Tests configuration validation and environment variable checks
 * 
 * Requirements: 11.1
 */
import {
  validateSupabaseConfig,
  validateServiceRoleKey,
  getSupabaseConfig,
  isSupabaseConfigured,
} from '@/lib/supabase/config';

describe('Supabase Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateSupabaseConfig', () => {
    it('should not throw when all required variables are set', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      expect(() => validateSupabaseConfig()).not.toThrow();
    });

    it('should throw when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      expect(() => validateSupabaseConfig()).toThrow(
        /Missing required Supabase environment variables/
      );
    });

    it('should throw when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => validateSupabaseConfig()).toThrow(
        /Missing required Supabase environment variables/
      );
    });

    it('should throw when both variables are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => validateSupabaseConfig()).toThrow(
        /Missing required Supabase environment variables/
      );
    });
  });

  describe('validateServiceRoleKey', () => {
    it('should not throw when service role key is set', () => {
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

      expect(() => validateServiceRoleKey()).not.toThrow();
    });

    it('should throw when service role key is missing', () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => validateServiceRoleKey()).toThrow(
        /Missing SUPABASE_SERVICE_ROLE_KEY/
      );
    });
  });

  describe('getSupabaseConfig', () => {
    it('should return configuration object when all variables are set', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

      const config = getSupabaseConfig();

      expect(config).toEqual({
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key',
        serviceRoleKey: 'test-service-role-key',
      });
    });

    it('should throw when required variables are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      expect(() => getSupabaseConfig()).toThrow();
    });
  });

  describe('isSupabaseConfigured', () => {
    it('should return true when configuration is valid', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      expect(isSupabaseConfigured()).toBe(true);
    });

    it('should return false when configuration is invalid', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      expect(isSupabaseConfigured()).toBe(false);
    });
  });
});
