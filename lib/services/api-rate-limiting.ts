/**
 * API Rate Limiting Service
 * 
 * Implements subscription-tier based rate limiting and API usage tracking
 * for the SolarCRM Pro platform with Redis-based storage.
 * 
 * Requirements: 10.4 - API rate limiting and usage tracking
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Redis client for rate limiting (fallback to in-memory if Redis not available)
let redis: any = null;
try {
  if (process.env.REDIS_URL && typeof window === 'undefined') {
    // Only import Redis on server side
    const { Redis } = require('ioredis');
    redis = new Redis(process.env.REDIS_URL);
  }
} catch (error) {
  console.warn('Redis not available, using in-memory rate limiting');
}

// In-memory fallback for rate limiting
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configurations by subscription tier
export const RATE_LIMITS = {
  starter: {
    requestsPerMinute: 100,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    burstLimit: 20
  },
  professional: {
    requestsPerMinute: 1000,
    requestsPerHour: 10000,
    requestsPerDay: 100000,
    burstLimit: 100
  },
  enterprise: {
    requestsPerMinute: 10000,
    requestsPerHour: 100000,
    requestsPerDay: 1000000,
    burstLimit: 500
  },
  free: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 1000,
    burstLimit: 5
  }
} as const;

export type SubscriptionTier = keyof typeof RATE_LIMITS;

// Rate limit result
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// API usage record
export interface APIUsageRecord {
  id: string;
  tenant_id: string;
  api_key_id?: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  request_size_bytes: number;
  response_size_bytes: number;
  user_agent?: string;
  ip_address?: string;
  timestamp: Date;
  subscription_tier: SubscriptionTier;
}

// Usage analytics
export interface UsageAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  requestsByHour: Array<{ hour: string; count: number }>;
  errorsByStatusCode: Record<number, number>;
}

export class APIRateLimitingService {
  /**
   * Check rate limit for a tenant/API key
   */
  async checkRateLimit(
    identifier: string,
    subscriptionTier: SubscriptionTier,
    window: 'minute' | 'hour' | 'day' = 'minute'
  ): Promise<RateLimitResult> {
    const limits = RATE_LIMITS[subscriptionTier];
    const limit = limits[`requestsPer${window.charAt(0).toUpperCase() + window.slice(1)}` as keyof typeof limits] as number;
    
    const windowSeconds = window === 'minute' ? 60 : window === 'hour' ? 3600 : 86400;
    const key = `rate_limit:${identifier}:${window}`;
    
    if (redis) {
      return await this.checkRateLimitRedis(key, limit, windowSeconds);
    } else {
      return await this.checkRateLimitMemory(key, limit, windowSeconds);
    }
  }

  /**
   * Check burst rate limit
   */
  async checkBurstLimit(
    identifier: string,
    subscriptionTier: SubscriptionTier
  ): Promise<RateLimitResult> {
    const limits = RATE_LIMITS[subscriptionTier];
    const key = `burst_limit:${identifier}`;
    const windowSeconds = 10; // 10 second burst window
    
    if (redis) {
      return await this.checkRateLimitRedis(key, limits.burstLimit, windowSeconds);
    } else {
      return await this.checkRateLimitMemory(key, limits.burstLimit, windowSeconds);
    }
  }

  /**
   * Redis-based rate limiting using sliding window
   */
  private async checkRateLimitRedis(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);
    
    const pipeline = redis!.pipeline();
    
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests in window
    pipeline.zcard(key);
    
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiration
    pipeline.expire(key, windowSeconds);
    
    const results = await pipeline.exec();
    const currentCount = (results![1][1] as number) || 0;
    
    const allowed = currentCount < limit;
    const remaining = Math.max(0, limit - currentCount - 1);
    const resetTime = now + (windowSeconds * 1000);
    
    if (!allowed) {
      // Remove the request we just added since it's not allowed
      await redis!.zrem(key, `${now}-${Math.random()}`);
      
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(windowSeconds)
      };
    }
    
    return {
      allowed: true,
      limit,
      remaining,
      resetTime
    };
  }

  /**
   * In-memory rate limiting fallback
   */
  private async checkRateLimitMemory(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    
    const current = inMemoryStore.get(key);
    
    if (!current || now > current.resetTime) {
      // New window
      inMemoryStore.set(key, { count: 1, resetTime: now + windowMs });
      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        resetTime: now + windowMs
      };
    }
    
    if (current.count >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetTime: current.resetTime,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      };
    }
    
    current.count++;
    inMemoryStore.set(key, current);
    
    return {
      allowed: true,
      limit,
      remaining: limit - current.count,
      resetTime: current.resetTime
    };
  }

  /**
   * Get tenant's subscription tier
   */
  async getTenantSubscriptionTier(tenantId: string): Promise<SubscriptionTier> {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('subscription')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      return 'free'; // Default to free tier
    }

    return (tenant.subscription?.tier as SubscriptionTier) || 'free';
  }

  /**
   * Get API key details and subscription tier
   */
  async getAPIKeyDetails(apiKey: string): Promise<{
    tenantId: string;
    subscriptionTier: SubscriptionTier;
    keyId: string;
    active: boolean;
  } | null> {
    const { data: apiKeyData, error } = await supabase
      .from('api_keys')
      .select(`
        id,
        tenant_id,
        active,
        tenant:tenants(subscription)
      `)
      .eq('key_hash', this.hashAPIKey(apiKey))
      .eq('active', true)
      .single();

    if (error || !apiKeyData) {
      return null;
    }

    const subscriptionTier = (apiKeyData.tenant as any)?.subscription?.tier || 'free';

    return {
      tenantId: apiKeyData.tenant_id,
      subscriptionTier,
      keyId: apiKeyData.id,
      active: apiKeyData.active
    };
  }

  /**
   * Record API usage
   */
  async recordAPIUsage(usage: Omit<APIUsageRecord, 'id' | 'timestamp'>): Promise<void> {
    try {
      await supabase
        .from('api_usage_logs')
        .insert({
          ...usage,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to record API usage:', error);
      // Don't throw error to avoid breaking API requests
    }
  }

  /**
   * Get usage analytics for a tenant
   */
  async getUsageAnalytics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageAnalytics> {
    const { data: usageLogs, error } = await supabase
      .from('api_usage_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (error || !usageLogs) {
      return this.getEmptyAnalytics();
    }

    const totalRequests = usageLogs.length;
    const successfulRequests = usageLogs.filter(log => log.status_code < 400).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const averageResponseTime = usageLogs.reduce((sum, log) => sum + log.response_time_ms, 0) / totalRequests || 0;

    // Top endpoints
    const endpointCounts = usageLogs.reduce((acc, log) => {
      const key = `${log.method} ${log.endpoint}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    // Requests by hour
    const hourCounts = usageLogs.reduce((acc, log) => {
      const hour = new Date(log.timestamp).toISOString().slice(0, 13) + ':00:00Z';
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestsByHour = Object.entries(hourCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, count]) => ({ hour, count }));

    // Errors by status code
    const errorsByStatusCode = usageLogs
      .filter(log => log.status_code >= 400)
      .reduce((acc, log) => {
        acc[log.status_code] = (acc[log.status_code] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      topEndpoints,
      requestsByHour,
      errorsByStatusCode
    };
  }

  /**
   * Get current usage for rate limit display
   */
  async getCurrentUsage(
    identifier: string,
    subscriptionTier: SubscriptionTier
  ): Promise<{
    minute: RateLimitResult;
    hour: RateLimitResult;
    day: RateLimitResult;
  }> {
    const [minute, hour, day] = await Promise.all([
      this.getCurrentUsageForWindow(identifier, subscriptionTier, 'minute'),
      this.getCurrentUsageForWindow(identifier, subscriptionTier, 'hour'),
      this.getCurrentUsageForWindow(identifier, subscriptionTier, 'day')
    ]);

    return { minute, hour, day };
  }

  /**
   * Get current usage for a specific window without incrementing
   */
  private async getCurrentUsageForWindow(
    identifier: string,
    subscriptionTier: SubscriptionTier,
    window: 'minute' | 'hour' | 'day'
  ): Promise<RateLimitResult> {
    const limits = RATE_LIMITS[subscriptionTier];
    const limit = limits[`requestsPer${window.charAt(0).toUpperCase() + window.slice(1)}` as keyof typeof limits] as number;
    
    const windowSeconds = window === 'minute' ? 60 : window === 'hour' ? 3600 : 86400;
    const key = `rate_limit:${identifier}:${window}`;
    
    if (redis) {
      const now = Date.now();
      const windowStart = now - (windowSeconds * 1000);
      
      await redis.zremrangebyscore(key, 0, windowStart);
      const currentCount = await redis.zcard(key);
      
      return {
        allowed: currentCount < limit,
        limit,
        remaining: Math.max(0, limit - currentCount),
        resetTime: now + (windowSeconds * 1000)
      };
    } else {
      const now = Date.now();
      const current = inMemoryStore.get(key);
      
      if (!current || now > current.resetTime) {
        return {
          allowed: true,
          limit,
          remaining: limit,
          resetTime: now + (windowSeconds * 1000)
        };
      }
      
      return {
        allowed: current.count < limit,
        limit,
        remaining: Math.max(0, limit - current.count),
        resetTime: current.resetTime
      };
    }
  }

  /**
   * Clean up expired rate limit data
   */
  async cleanup(): Promise<void> {
    if (redis) {
      // Redis handles expiration automatically
      return;
    }
    
    // Clean up in-memory store
    const now = Date.now();
    for (const [key, value] of inMemoryStore.entries()) {
      if (now > value.resetTime) {
        inMemoryStore.delete(key);
      }
    }
  }

  /**
   * Hash API key for storage
   */
  private hashAPIKey(apiKey: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Get empty analytics structure
   */
  private getEmptyAnalytics(): UsageAnalytics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      topEndpoints: [],
      requestsByHour: [],
      errorsByStatusCode: {}
    };
  }
}

// Singleton instance
let rateLimitingService: APIRateLimitingService;

export function getAPIRateLimitingService(): APIRateLimitingService {
  if (!rateLimitingService) {
    rateLimitingService = new APIRateLimitingService();
  }
  return rateLimitingService;
}

// Utility functions for middleware
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

export function createRateLimitError(result: RateLimitResult): {
  error: string;
  code: string;
  retryAfter?: number;
} {
  return {
    error: 'Rate limit exceeded',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: result.retryAfter
  };
}