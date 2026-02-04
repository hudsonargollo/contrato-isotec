# Supabase Configuration

This directory contains all Supabase-related utilities for the Photovoltaic Contract System.

## Files

### `client.ts`
Browser-side Supabase client for client components and client-side operations.

**Usage:**
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase.from('contracts').select('*');
```

### `server.ts`
Server-side Supabase client for server components and API routes. Handles cookie-based session management.

**Usage:**
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data, error } = await supabase.from('contracts').select('*');
```

### `admin.ts`
Admin client with service role key that bypasses Row Level Security (RLS). **Use with caution!**

**Usage:**
```typescript
import { createAdminClient } from '@/lib/supabase/admin';

// Only use in secure server-side contexts
const adminClient = createAdminClient();
const { data, error } = await adminClient.from('contracts').select('*');
```

### `auth.ts`
Authentication helper functions for user management, sign-in/sign-out, and MFA operations.

**Usage:**
```typescript
import { signInWithEmail, getCurrentUser, enrollMFA } from '@/lib/supabase/auth';

// Sign in
const { data, error } = await signInWithEmail('user@example.com', 'password');

// Get current user
const user = await getCurrentUser();

// Enroll MFA
const { data: mfaData } = await enrollMFA();
```

### `config.ts`
Configuration validation utilities to ensure environment variables are properly set.

**Usage:**
```typescript
import { validateSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase/config';

// Validate configuration
validateSupabaseConfig(); // Throws error if missing vars

// Check if configured
if (isSupabaseConfigured()) {
  // Proceed with Supabase operations
}
```

### `types.ts`
TypeScript type definitions for the database schema. Provides type safety for all database operations.

**Usage:**
```typescript
import type { Database } from '@/lib/supabase/types';

type Contract = Database['public']['Tables']['contracts']['Row'];
type ContractInsert = Database['public']['Tables']['contracts']['Insert'];
```

### `index.ts`
Central export point for all Supabase utilities. Import from here for convenience.

**Usage:**
```typescript
import { 
  createBrowserClient, 
  createServerClient,
  getCurrentUser,
  isAdmin 
} from '@/lib/supabase';
```

## Environment Variables

Required environment variables (set in `.env.local`):

```bash
# Public variables (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only variables (never exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

## Security Best Practices

1. **Never use admin client in browser code** - The service role key bypasses all RLS policies
2. **Always use server client for API routes** - Ensures proper session management
3. **Use browser client for client components** - Respects RLS policies
4. **Validate user permissions** - Even with RLS, always verify user roles in your application logic
5. **Enable MFA for admin users** - Required by Requirement 11.2

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### `profiles` table
- Admins can view all profiles
- Users can update their own profile

### `contracts` table
- Public can view contracts by UUID (non-enumerable)
- Admins can insert contracts
- Admins can update pending contracts

### `contract_items` table
- Public can view items for public contracts
- Admins can insert/update/delete items for pending contracts

### `audit_logs` table
- Admins can view all audit logs
- System can insert audit logs
- No updates or deletes allowed (immutable)

## Authentication Flow

1. **Admin Login**
   - User enters email/password
   - System validates credentials
   - If MFA enabled, prompt for TOTP code
   - Create session with cookies

2. **Session Management**
   - Middleware refreshes sessions automatically
   - Sessions stored in HTTP-only cookies
   - Protected routes check for valid session

3. **MFA Setup**
   - Admin enrolls MFA via `enrollMFA()`
   - System generates QR code
   - Admin scans with authenticator app
   - Admin verifies with TOTP code
   - Profile updated with `mfa_enabled: true`

## Testing

When testing, use the following approach:

```typescript
// Mock Supabase client for unit tests
jest.mock('@/lib/supabase', () => ({
  createBrowserClient: jest.fn(),
  createServerClient: jest.fn(),
}));

// For integration tests, use Supabase local development
// Run: npx supabase start
```

## Troubleshooting

### "Missing required Supabase environment variables"
- Check that `.env.local` exists and contains all required variables
- Restart the development server after adding variables

### "Invalid JWT token"
- Clear browser cookies and sign in again
- Check that the anon key matches your Supabase project

### "Row Level Security policy violation"
- Verify the user has the correct role in the `profiles` table
- Check that RLS policies are properly configured in migrations

### "Service role key not found"
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Never commit this key to version control

## Requirements Mapping

- **Requirement 11.1**: Row Level Security enforcement via RLS policies
- **Requirement 11.2**: Multi-factor authentication via MFA functions
- **Requirement 14.1-14.4**: Database schema types and migrations
