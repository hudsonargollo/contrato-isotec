/**
 * Unit Tests: API Rate Limiting and Usage Tracking
 * 
 * Tests for API rate limiting service, API key management,
 * and usage tracking functionality.
 * 
 * Requirements: 10.4 - API rate limiting and usage tracking
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { APIRateLimitingService, RATE_LIMITS } from '@/lib/services/api-rate-limiting';
import { APIKeyManagementService, API_SCOPES } from '@/lib/services/api-key-management';

// Mock Redis for testing
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    pipeline: jest.fn().mockReturnValue({
      zremrangebyscore: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([[null, 0], [null, 5], [null, 'OK'], [null, 1]])
    }),
    zrem: jest.fn().mockResolvedValue(1),
    zremrangebyscore: jest.fn().mockResolvedValue(1),
    zcard: jest.fn().mockResolvedValue(5)
  }));
});

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: {
        id: 'test-id',
        tenant_id: 'test-tenant',
        subscription: { tier: 'professional' }
      },
      error: null
    })
  })),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null })
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

describe('API Rate Limiting Service', () => {
  let rateLimitingService: APIRateLimitingService;

  beforeEach(() => {
    rateLimitingService = new APIRateLimitingService();
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'test-id',
          tenant_id: 'test-tenant',
          subscription: { tier: 'professional' }
        },
        error: null
      })
    });
  });

  describe('Rate Limit Configuration', () => {
    it('should have correct rate limits for each subscription tier', () => {
      expect(RATE_LIMITS.free.requestsPerMinute).toBe(10);
      expect(RATE_LIMITS.free.requestsPerHour).toBe(100);
      expect(RATE_LIMITS.free.requestsPerDay).toBe(1000);
      expect(RATE_LIMITS.free.burstLimit).toBe(5);

      expect(RATE_LIMITS.starter.requestsPerMinute).toBe(100);
      expect(RATE_LIMITS.starter.requestsPerHour).toBe(1000);
      expect(RATE_LIMITS.starter.requestsPerDay).toBe(10000);
      expect(RATE_LIMITS.starter.burstLimit).toBe(20);

      expect(RATE_LIMITS.professional.requestsPerMinute).toBe(1000);
      expect(RATE_LIMITS.professional.requestsPerHour).toBe(10000);
      expect(RATE_LIMITS.professional.requestsPerDay).toBe(100000);
      expect(RATE_LIMITS.professional.burstLimit).toBe(100);

      expect(RATE_LIMITS.enterprise.requestsPerMinute).toBe(10000);
      expect(RATE_LIMITS.enterprise.requestsPerHour).toBe(100000);
      expect(RATE_LIMITS.enterprise.requestsPerDay).toBe(1000000);
      expect(RATE_LIMITS.enterprise.burstLimit).toBe(500);
    });

    it('should enforce tier hierarchy (higher tiers have higher limits)', () => {
      const tiers = ['free', 'starter', 'professional', 'enterprise'] as const;
      
      for (let i = 0; i < tiers.length - 1; i++) {
        const currentTier = tiers[i];
        const nextTier = tiers[i + 1];
        
        expect(RATE_LIMITS[nextTier].requestsPerMinute).toBeGreaterThanOrEqual(
          RATE_LIMITS[currentTier].requestsPerMinute
        );
        expect(RATE_LIMITS[nextTier].requestsPerHour).toBeGreaterThanOrEqual(
          RATE_LIMITS[currentTier].requestsPerHour
        );
        expect(RATE_LIMITS[nextTier].requestsPerDay).toBeGreaterThanOrEqual(
          RATE_LIMITS[currentTier].requestsPerDay
        );
        expect(RATE_LIMITS[nextTier].burstLimit).toBeGreaterThanOrEqual(
          RATE_LIMITS[currentTier].burstLimit
        );
      }
    });
  });

  describe('Rate Limit Checking', () => {
    it('should allow requests within rate limits', async () => {
      const result = await rateLimitingService.checkRateLimit(
        'test-identifier',
        'professional',
        'minute'
      );

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(RATE_LIMITS.professional.requestsPerMinute);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should deny requests when rate limit is exceeded', async () => {
      // Mock Redis to return count exceeding limit
      const mockRedis = require('ioredis');
      const mockInstance = new mockRedis();
      mockInstance.pipeline().exec.mockResolvedValueOnce([
        [null, 0], // zremrangebyscore
        [null, 1001], // zcard (exceeds professional limit of 1000)
        [null, 'OK'], // zadd
        [null, 1] // expire
      ]);

      const result = await rateLimitingService.checkRateLimit(
        'test-identifier',
        'professional',
        'minute'
      );

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('should handle different time windows correctly', async () => {
      const windows = ['minute', 'hour', 'day'] as const;
      
      for (const window of windows) {
        const result = await rateLimitingService.checkRateLimit(
          'test-identifier',
          'professional',
          window
        );

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(RATE_LIMITS.professional[`requestsPer${window.charAt(0).toUpperCase() + window.slice(1)}` as keyof typeof RATE_LIMITS.professional]);
      }
    });
  });

  describe('Burst Limit Checking', () => {
    it('should allow requests within burst limits', async () => {
      const result = await rateLimitingService.checkBurstLimit(
        'test-identifier',
        'professional'
      );

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(RATE_LIMITS.professional.burstLimit);
    });

    it('should deny requests when burst limit is exceeded', async () => {
      // Mock Redis to return count exceeding burst limit
      const mockRedis = require('ioredis');
      const mockInstance = new mockRedis();
      mockInstance.pipeline().exec.mockResolvedValueOnce([
        [null, 0], // zremrangebyscore
        [null, 101], // zcard (exceeds professional burst limit of 100)
        [null, 'OK'], // zadd
        [null, 1] // expire
      ]);

      const result = await rateLimitingService.checkBurstLimit(
        'test-identifier',
        'professional'
      );

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
    });
  });

  describe('Usage Analytics', () => {
    it('should record API usage correctly', async () => {
      const usageRecord = {
        tenant_id: 'test-tenant',
        api_key_id: 'test-key',
        endpoint: '/api/leads',
        method: 'GET',
        status_code: 200,
        response_time_ms: 150,
        request_size_bytes: 1024,
        response_size_bytes: 2048,
        user_agent: 'Test Agent',
        ip_address: '127.0.0.1',
        subscription_tier: 'professional' as const
      };

      // Should not throw error
      await expect(rateLimitingService.recordAPIUsage(usageRecord)).resolves.not.toThrow();
    });

    it('should generate usage analytics correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const analytics = await rateLimitingService.getUsageAnalytics(
        'test-tenant',
        startDate,
        endDate
      );

      expect(analytics).toHaveProperty('totalRequests');
      expect(analytics).toHaveProperty('successfulRequests');
      expect(analytics).toHaveProperty('failedRequests');
      expect(analytics).toHaveProperty('averageResponseTime');
      expect(analytics).toHaveProperty('topEndpoints');
      expect(analytics).toHaveProperty('requestsByHour');
      expect(analytics).toHaveProperty('errorsByStatusCode');

      expect(typeof analytics.totalRequests).toBe('number');
      expect(typeof analytics.successfulRequests).toBe('number');
      expect(typeof analytics.failedRequests).toBe('number');
      expect(typeof analytics.averageResponseTime).toBe('number');
      expect(Array.isArray(analytics.topEndpoints)).toBe(true);
      expect(Array.isArray(analytics.requestsByHour)).toBe(true);
      expect(typeof analytics.errorsByStatusCode).toBe('object');
    });

    it('should return empty analytics for no data', async () => {
      // Mock Supabase to return no data
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        mockResolvedValue: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      };
      
      mockSupabaseClient.from.mockReturnValueOnce(mockChain);
      mockChain.lte.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const analytics = await rateLimitingService.getUsageAnalytics(
        'test-tenant',
        new Date(),
        new Date()
      );

      expect(analytics.totalRequests).toBe(0);
      expect(analytics.successfulRequests).toBe(0);
      expect(analytics.failedRequests).toBe(0);
      expect(analytics.averageResponseTime).toBe(0);
      expect(analytics.topEndpoints).toEqual([]);
      expect(analytics.requestsByHour).toEqual([]);
      expect(analytics.errorsByStatusCode).toEqual({});
    });
  });

  describe('Tenant Subscription Tier', () => {
    it('should get tenant subscription tier correctly', async () => {
      const tier = await rateLimitingService.getTenantSubscriptionTier('test-tenant');
      expect(tier).toBe('professional');
    });

    it('should default to free tier for unknown tenant', async () => {
      // Mock Supabase to return error
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: new Error('Tenant not found')
      });

      const tier = await rateLimitingService.getTenantSubscriptionTier('unknown-tenant');
      expect(tier).toBe('free');
    });
  });

  describe('API Key Details', () => {
    it('should get API key details correctly', async () => {
      const details = await rateLimitingService.getAPIKeyDetails('test-api-key');
      
      expect(details).toHaveProperty('tenantId');
      expect(details).toHaveProperty('subscriptionTier');
      expect(details).toHaveProperty('keyId');
      expect(details).toHaveProperty('active');
    });

    it('should return null for invalid API key', async () => {
      // Mock Supabase to return no data
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: new Error('API key not found')
      });

      const details = await rateLimitingService.getAPIKeyDetails('invalid-key');
      expect(details).toBeNull();
    });
  });
});

describe('API Key Management Service', () => {
  let apiKeyService: APIKeyManagementService;

  beforeEach(() => {
    apiKeyService = new APIKeyManagementService();
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'test-key-id',
          tenant_id: 'test-tenant',
          name: 'Test Key',
          scopes: ['leads:read', 'leads:write'],
          key_prefix: 'sk_live_',
          expires_at: null,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total_requests: 0
        },
        error: null
      })
    });
  });

  describe('API Scopes', () => {
    it('should have all required API scopes defined', () => {
      const expectedScopes = [
        'leads:read', 'leads:write', 'leads:delete',
        'contracts:read', 'contracts:write', 'contracts:delete',
        'invoices:read', 'invoices:write', 'invoices:delete',
        'analytics:read', 'analytics:write',
        'whatsapp:read', 'whatsapp:write',
        'webhooks:read', 'webhooks:write',
        'integrations:read', 'integrations:write',
        'admin:all'
      ];

      expectedScopes.forEach(scope => {
        expect(API_SCOPES).toHaveProperty(scope);
        expect(typeof API_SCOPES[scope as keyof typeof API_SCOPES]).toBe('string');
      });
    });

    it('should have meaningful descriptions for all scopes', () => {
      Object.entries(API_SCOPES).forEach(([scope, description]) => {
        expect(description.length).toBeGreaterThan(5);
        expect(description).not.toBe(scope);
      });
    });
  });

  describe('API Key Creation', () => {
    it('should create API key with valid data', async () => {
      // Mock successful database insert
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: {
          id: 'test-key-id',
          name: 'Test Key',
          scopes: ['leads:read', 'leads:write'],
          key_prefix: 'sk_live_',
          expires_at: null
        },
        error: null
      });

      const createRequest = {
        tenant_id: 'test-tenant',
        name: 'Test API Key',
        description: 'Test description',
        scopes: ['leads:read', 'leads:write'],
        created_by: 'test-user'
      };

      const result = await apiKeyService.createAPIKey(createRequest);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('prefix');
      expect(result.name).toBe('Test API Key');
      expect(result.scopes).toEqual(['leads:read', 'leads:write']);
      expect(result.key).toMatch(/^sk_live_[a-f0-9]{64}$/);
    });

    it('should validate scopes during creation', async () => {
      const createRequest = {
        tenant_id: 'test-tenant',
        name: 'Test API Key',
        scopes: ['invalid:scope'],
        created_by: 'test-user'
      };

      await expect(apiKeyService.createAPIKey(createRequest)).rejects.toThrow('Invalid scopes');
    });

    it('should require at least one scope', async () => {
      const createRequest = {
        tenant_id: 'test-tenant',
        name: 'Test API Key',
        scopes: [],
        created_by: 'test-user'
      };

      await expect(apiKeyService.createAPIKey(createRequest)).rejects.toThrow('Invalid scopes');
    });
  });

  describe('API Key Validation', () => {
    it('should validate correct API key', async () => {
      // Mock successful database query
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'test-key-id',
          tenant_id: 'test-tenant',
          name: 'Test Key',
          scopes: ['leads:read'],
          active: true,
          expires_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total_requests: 0
        },
        error: null
      });

      const result = await apiKeyService.validateAPIKey('sk_live_test123456789');
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-key-id');
      expect(result?.tenant_id).toBe('test-tenant');
      expect(result?.active).toBe(true);
    });

    it('should reject expired API key', async () => {
      // Mock database query with expired key
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'test-key-id',
          tenant_id: 'test-tenant',
          name: 'Test Key',
          scopes: ['leads:read'],
          active: true,
          expires_at: new Date(Date.now() - 86400000).toISOString(), // Expired yesterday
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total_requests: 0
        },
        error: null
      });

      const result = await apiKeyService.validateAPIKey('sk_live_test123456789');
      expect(result).toBeNull();
    });

    it('should reject inactive API key', async () => {
      // Mock database query with inactive key
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: new Error('Not found')
      });

      const result = await apiKeyService.validateAPIKey('sk_live_invalid123456789');
      expect(result).toBeNull();
    });
  });

  describe('Scope and Permission Checking', () => {
    const mockApiKey = {
      id: 'test-key',
      tenant_id: 'test-tenant',
      name: 'Test Key',
      description: '',
      key_hash: 'hash',
      key_prefix: 'sk_live_',
      scopes: ['leads:read', 'contracts:write'],
      permissions: {},
      active: true,
      total_requests: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    it('should check scopes correctly', () => {
      expect(apiKeyService.hasScope(mockApiKey, 'leads:read')).toBe(true);
      expect(apiKeyService.hasScope(mockApiKey, 'contracts:write')).toBe(true);
      expect(apiKeyService.hasScope(mockApiKey, 'invoices:read')).toBe(false);
    });

    it('should grant all permissions for admin scope', () => {
      const adminKey = { ...mockApiKey, scopes: ['admin:all'] };
      
      expect(apiKeyService.hasScope(adminKey, 'leads:read')).toBe(true);
      expect(apiKeyService.hasScope(adminKey, 'contracts:write')).toBe(true);
      expect(apiKeyService.hasScope(adminKey, 'invoices:delete')).toBe(true);
    });

    it('should check permissions correctly', () => {
      const keyWithPermissions = {
        ...mockApiKey,
        permissions: { 'custom:action': true }
      };

      expect(apiKeyService.hasPermission(keyWithPermissions, 'custom:action')).toBe(true);
      expect(apiKeyService.hasPermission(keyWithPermissions, 'other:action')).toBe(false);
    });

    it('should grant all permissions for admin scope in permission check', () => {
      const adminKey = { ...mockApiKey, scopes: ['admin:all'] };
      
      expect(apiKeyService.hasPermission(adminKey, 'any:permission')).toBe(true);
    });
  });

  describe('API Key Rotation', () => {
    it('should rotate API key successfully', async () => {
      // Mock getting existing key
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      
      // First call for getting existing key
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'test-key-id',
          tenant_id: 'test-tenant',
          name: 'Test Key',
          scopes: ['leads:read'],
          active: true,
          expires_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total_requests: 0
        },
        error: null
      });

      // Second call for updating key
      mockSupabase.from().update().eq().select().single.mockResolvedValueOnce({
        data: {
          id: 'test-key-id',
          name: 'Test Key',
          scopes: ['leads:read'],
          key_prefix: 'sk_live_',
          expires_at: null
        },
        error: null
      });

      const result = await apiKeyService.rotateAPIKey('test-tenant', 'test-key-id');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('prefix');
      expect(result.id).toBe('test-key-id');
      expect(result.key).toMatch(/^sk_live_[a-f0-9]{64}$/);
    });

    it('should fail to rotate non-existent API key', async () => {
      // Mock getting non-existent key
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: new Error('Not found')
      });

      await expect(
        apiKeyService.rotateAPIKey('test-tenant', 'non-existent-key')
      ).rejects.toThrow('API key not found');
    });
  });

  describe('Usage Statistics', () => {
    it('should calculate usage statistics correctly', async () => {
      // Mock usage logs data
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      mockSupabase.from().select().eq().gte().lte().mockResolvedValueOnce({
        data: [
          {
            endpoint: '/api/leads',
            status_code: 200,
            response_time_ms: 150,
            timestamp: '2024-01-01T10:00:00Z'
          },
          {
            endpoint: '/api/contracts',
            status_code: 201,
            response_time_ms: 200,
            timestamp: '2024-01-01T11:00:00Z'
          },
          {
            endpoint: '/api/leads',
            status_code: 400,
            response_time_ms: 100,
            timestamp: '2024-01-01T12:00:00Z'
          }
        ],
        error: null
      });

      const usage = await apiKeyService.getAPIKeyUsage(
        'test-tenant',
        'test-key-id',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(usage.totalRequests).toBe(3);
      expect(usage.successfulRequests).toBe(2);
      expect(usage.failedRequests).toBe(1);
      expect(usage.averageResponseTime).toBe(150); // (150 + 200 + 100) / 3
      expect(usage.topEndpoints).toHaveLength(2);
      expect(usage.requestsByDay).toHaveLength(1);
    });

    it('should handle empty usage data', async () => {
      // Mock empty usage logs
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      mockSupabase.from().select().eq().gte().lte().mockResolvedValueOnce({
        data: [],
        error: null
      });

      const usage = await apiKeyService.getAPIKeyUsage(
        'test-tenant',
        'test-key-id',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(usage.totalRequests).toBe(0);
      expect(usage.successfulRequests).toBe(0);
      expect(usage.failedRequests).toBe(0);
      expect(usage.averageResponseTime).toBe(0);
      expect(usage.topEndpoints).toEqual([]);
      expect(usage.requestsByDay).toEqual([]);
    });
  });
});

describe('Rate Limiting Utility Functions', () => {
  it('should generate correct rate limit headers', () => {
    const { getRateLimitHeaders } = require('@/lib/services/api-rate-limiting');
    
    const rateLimitResult = {
      allowed: true,
      limit: 1000,
      remaining: 950,
      resetTime: 1640995200000 // 2022-01-01 00:00:00 UTC
    };

    const headers = getRateLimitHeaders(rateLimitResult);

    expect(headers['X-RateLimit-Limit']).toBe('1000');
    expect(headers['X-RateLimit-Remaining']).toBe('950');
    expect(headers['X-RateLimit-Reset']).toBe('1640995200');
    expect(headers['Retry-After']).toBeUndefined();
  });

  it('should include retry-after header when rate limited', () => {
    const { getRateLimitHeaders } = require('@/lib/services/api-rate-limiting');
    
    const rateLimitResult = {
      allowed: false,
      limit: 1000,
      remaining: 0,
      resetTime: 1640995200000,
      retryAfter: 60
    };

    const headers = getRateLimitHeaders(rateLimitResult);

    expect(headers['X-RateLimit-Limit']).toBe('1000');
    expect(headers['X-RateLimit-Remaining']).toBe('0');
    expect(headers['X-RateLimit-Reset']).toBe('1640995200');
    expect(headers['Retry-After']).toBe('60');
  });

  it('should create correct rate limit error', () => {
    const { createRateLimitError } = require('@/lib/services/api-rate-limiting');
    
    const rateLimitResult = {
      allowed: false,
      limit: 1000,
      remaining: 0,
      resetTime: 1640995200000,
      retryAfter: 60
    };

    const error = createRateLimitError(rateLimitResult);

    expect(error.error).toBe('Rate limit exceeded');
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(error.retryAfter).toBe(60);
  });
});

describe('Integration Tests', () => {
  it('should integrate rate limiting with API key validation', async () => {
    const rateLimitingService = new APIRateLimitingService();
    
    // Mock API key details
    const mockApiKeyDetails = {
      tenantId: 'test-tenant',
      subscriptionTier: 'professional' as const,
      keyId: 'test-key-id',
      active: true
    };

    // Mock the getAPIKeyDetails method
    jest.spyOn(rateLimitingService, 'getAPIKeyDetails').mockResolvedValue(mockApiKeyDetails);

    const details = await rateLimitingService.getAPIKeyDetails('test-api-key');
    expect(details).toEqual(mockApiKeyDetails);

    // Test rate limiting for the tenant
    const rateLimitResult = await rateLimitingService.checkRateLimit(
      'test-identifier',
      mockApiKeyDetails.subscriptionTier,
      'minute'
    );

    expect(rateLimitResult.allowed).toBe(true);
    expect(rateLimitResult.limit).toBe(RATE_LIMITS.professional.requestsPerMinute);
  });

  it('should handle rate limiting errors gracefully', async () => {
    const rateLimitingService = new APIRateLimitingService();
    
    // Mock Redis error
    const mockRedis = require('ioredis');
    const mockInstance = new mockRedis();
    mockInstance.pipeline().exec.mockRejectedValueOnce(new Error('Redis connection failed'));

    // Should not throw error, but should allow request
    const result = await rateLimitingService.checkRateLimit(
      'test-identifier',
      'professional',
      'minute'
    );

    // In case of Redis error, the service should fall back to in-memory limiting
    expect(result.allowed).toBe(true);
  });
});