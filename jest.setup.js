// Jest setup file for environment variables and mocks
import '@testing-library/jest-dom';

// Set up environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test123';

// Mock fetch for Stripe
global.fetch = jest.fn();

// Mock Request and Response for Next.js API routes
global.Request = class Request {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || 'GET';
    this.headers = new Map(Object.entries(init?.headers || {}));
    this.body = init?.body;
  }
  
  async json() {
    return JSON.parse(this.body);
  }
  
  async text() {
    return this.body;
  }
};

global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Map(Object.entries(init?.headers || {}));
  }
  
  async json() {
    return JSON.parse(this.body);
  }
  
  async text() {
    return this.body;
  }
};

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

// Mock Supabase client with comprehensive query builder support
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => {
    const createQueryBuilder = () => ({
      select: jest.fn(() => createQueryBuilder()),
      insert: jest.fn(() => createQueryBuilder()),
      update: jest.fn(() => createQueryBuilder()),
      delete: jest.fn(() => createQueryBuilder()),
      eq: jest.fn(() => createQueryBuilder()),
      neq: jest.fn(() => createQueryBuilder()),
      gt: jest.fn(() => createQueryBuilder()),
      gte: jest.fn(() => createQueryBuilder()),
      lt: jest.fn(() => createQueryBuilder()),
      lte: jest.fn(() => createQueryBuilder()),
      like: jest.fn(() => createQueryBuilder()),
      ilike: jest.fn(() => createQueryBuilder()),
      is: jest.fn(() => createQueryBuilder()),
      in: jest.fn(() => createQueryBuilder()),
      contains: jest.fn(() => createQueryBuilder()),
      containedBy: jest.fn(() => createQueryBuilder()),
      rangeGt: jest.fn(() => createQueryBuilder()),
      rangeGte: jest.fn(() => createQueryBuilder()),
      rangeLt: jest.fn(() => createQueryBuilder()),
      rangeLte: jest.fn(() => createQueryBuilder()),
      rangeAdjacent: jest.fn(() => createQueryBuilder()),
      overlaps: jest.fn(() => createQueryBuilder()),
      textSearch: jest.fn(() => createQueryBuilder()),
      match: jest.fn(() => createQueryBuilder()),
      not: jest.fn(() => createQueryBuilder()),
      or: jest.fn(() => createQueryBuilder()),
      filter: jest.fn(() => createQueryBuilder()),
      order: jest.fn(() => createQueryBuilder()),
      limit: jest.fn(() => createQueryBuilder()),
      range: jest.fn(() => createQueryBuilder()),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
      then: jest.fn((resolve) => resolve({ data: [], error: null, count: 0 }))
    });

    return {
      from: jest.fn(() => createQueryBuilder()),
      rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
      auth: {
        getUser: jest.fn(() => Promise.resolve({
          data: { user: { id: 'test-user-id' } },
          error: null
        })),
        signUp: jest.fn(() => Promise.resolve({ data: null, error: null })),
        signInWithPassword: jest.fn(() => Promise.resolve({ data: null, error: null })),
        signOut: jest.fn(() => Promise.resolve({ error: null }))
      },
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
          download: jest.fn(() => Promise.resolve({ data: null, error: null })),
          remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
          list: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }
    };
  }
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => {
    const createQueryBuilder = () => ({
      select: jest.fn(() => createQueryBuilder()),
      insert: jest.fn(() => createQueryBuilder()),
      update: jest.fn(() => createQueryBuilder()),
      delete: jest.fn(() => createQueryBuilder()),
      eq: jest.fn(() => createQueryBuilder()),
      neq: jest.fn(() => createQueryBuilder()),
      gt: jest.fn(() => createQueryBuilder()),
      gte: jest.fn(() => createQueryBuilder()),
      lt: jest.fn(() => createQueryBuilder()),
      lte: jest.fn(() => createQueryBuilder()),
      like: jest.fn(() => createQueryBuilder()),
      ilike: jest.fn(() => createQueryBuilder()),
      is: jest.fn(() => createQueryBuilder()),
      in: jest.fn(() => createQueryBuilder()),
      contains: jest.fn(() => createQueryBuilder()),
      containedBy: jest.fn(() => createQueryBuilder()),
      rangeGt: jest.fn(() => createQueryBuilder()),
      rangeGte: jest.fn(() => createQueryBuilder()),
      rangeLt: jest.fn(() => createQueryBuilder()),
      rangeLte: jest.fn(() => createQueryBuilder()),
      rangeAdjacent: jest.fn(() => createQueryBuilder()),
      overlaps: jest.fn(() => createQueryBuilder()),
      textSearch: jest.fn(() => createQueryBuilder()),
      match: jest.fn(() => createQueryBuilder()),
      not: jest.fn(() => createQueryBuilder()),
      or: jest.fn(() => createQueryBuilder()),
      filter: jest.fn(() => createQueryBuilder()),
      order: jest.fn(() => createQueryBuilder()),
      limit: jest.fn(() => createQueryBuilder()),
      range: jest.fn(() => createQueryBuilder()),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
      then: jest.fn((resolve) => resolve({ data: [], error: null, count: 0 }))
    });

    return {
      from: jest.fn(() => createQueryBuilder()),
      rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
      auth: {
        getUser: jest.fn(() => Promise.resolve({
          data: { user: { id: 'test-user-id' } },
          error: null
        })),
        signUp: jest.fn(() => Promise.resolve({ data: null, error: null })),
        signInWithPassword: jest.fn(() => Promise.resolve({ data: null, error: null })),
        signOut: jest.fn(() => Promise.resolve({ error: null }))
      },
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
          download: jest.fn(() => Promise.resolve({ data: null, error: null })),
          remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
          list: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }
    };
  }
}));

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});