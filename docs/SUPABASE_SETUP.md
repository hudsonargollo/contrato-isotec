# Supabase Setup Guide

This guide explains how the Supabase client and authentication are configured for the Photovoltaic Contract System.

## Overview

The system uses Supabase for:
- **Authentication**: Email/password with MFA support
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Real-time**: Future feature for live updates
- **Storage**: Future feature for document storage

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
├─────────────────────────────────────────────────────────┤
│  Browser Client  │  Server Client  │  Admin Client      │
│  (client.ts)     │  (server.ts)    │  (admin.ts)        │
├─────────────────────────────────────────────────────────┤
│              Authentication Layer (auth.ts)              │
├─────────────────────────────────────────────────────────┤
│            Configuration Layer (config.ts)               │
├─────────────────────────────────────────────────────────┤
│                    Supabase Backend                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PostgreSQL  │  │  Auth Service │  │  RLS Policies │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Files Created

### Core Client Files

1. **`lib/supabase/client.ts`**
   - Browser-side Supabase client
   - Uses `@supabase/ssr` for cookie-based sessions
   - Safe for client components

2. **`lib/supabase/server.ts`**
   - Server-side Supabase client
   - Handles cookie management with Next.js
   - Used in Server Components and API routes

3. **`lib/supabase/admin.ts`**
   - Admin client with service role key
   - Bypasses RLS policies
   - **Only for secure server-side operations**

### Authentication Files

4. **`lib/supabase/auth.ts`**
   - Authentication helper functions
   - User management (sign in, sign out, sign up)
   - MFA enrollment and verification
   - Profile management

### Configuration Files

5. **`lib/supabase/config.ts`**
   - Environment variable validation
   - Configuration helpers
   - Error handling for missing variables

6. **`lib/supabase/types.ts`**
   - TypeScript type definitions
   - Database schema types
   - Type-safe database operations

7. **`lib/supabase/index.ts`**
   - Central export point
   - Convenient imports

### Middleware

8. **`middleware.ts`** (root level)
   - Session refresh
   - Route protection
   - Admin authentication
   - MFA enforcement

## Environment Variables

### Required Variables

```bash
# Public (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only (never exposed)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

### Current Configuration

The `.env.local` file is already configured with production Supabase credentials:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Set
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Set
- ✅ `DATABASE_URL` - Set

## Usage Examples

### Browser Client (Client Components)

```typescript
'use client';

import { createBrowserClient } from '@/lib/supabase';

export default function MyComponent() {
  const supabase = createBrowserClient();
  
  const fetchData = async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select('*');
  };
  
  return <div>...</div>;
}
```

### Server Client (Server Components)

```typescript
import { createServerClient } from '@/lib/supabase';

export default async function MyPage() {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('contracts')
    .select('*');
  
  return <div>...</div>;
}
```

### Admin Client (API Routes)

```typescript
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  const adminClient = createAdminClient();
  
  // Bypasses RLS - use carefully!
  const { data, error } = await adminClient
    .from('contracts')
    .select('*');
  
  return Response.json(data);
}
```

### Authentication

```typescript
import { 
  signInWithEmail, 
  getCurrentUser, 
  enrollMFA 
} from '@/lib/supabase';

// Sign in
const { data, error } = await signInWithEmail(
  'admin@isotec.com',
  'password'
);

// Get current user
const user = await getCurrentUser();

// Enroll MFA
const { data: mfaData } = await enrollMFA();
```

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies defined in migrations:

- **profiles**: Admins can view all, users can update own
- **contracts**: Public can view by UUID, admins can manage
- **contract_items**: Follows contract permissions
- **audit_logs**: Admins can view, system can insert, immutable

### Multi-Factor Authentication (MFA)

MFA is enforced for admin users (Requirement 11.2):

1. Admin signs in with email/password
2. System checks if MFA is enabled
3. If enabled, prompts for TOTP code
4. Verifies code before granting access

### Session Management

- Sessions stored in HTTP-only cookies
- Automatic refresh via middleware
- Secure cookie settings (SameSite, Secure)
- Short expiration times

## Testing

### Unit Tests

```bash
npm test tests/unit/supabase/config.test.ts
```

Tests cover:
- ✅ Configuration validation
- ✅ Environment variable checks
- ✅ Error handling

### Integration Tests

For integration tests, use Supabase local development:

```bash
# Start local Supabase
npx supabase start

# Run migrations
npx supabase db reset

# Run tests
npm test
```

## Troubleshooting

### Build Errors

**Error**: "Missing required Supabase environment variables"

**Solution**: 
1. Check `.env.local` exists
2. Verify all variables are set
3. Restart dev server: `npm run dev`

### Authentication Errors

**Error**: "Invalid JWT token"

**Solution**:
1. Clear browser cookies
2. Sign in again
3. Check anon key matches project

### RLS Policy Errors

**Error**: "Row Level Security policy violation"

**Solution**:
1. Verify user has correct role in `profiles` table
2. Check RLS policies in migrations
3. Use admin client for operations that need to bypass RLS

## Requirements Mapping

This implementation satisfies:

- ✅ **Requirement 11.1**: Row Level Security enforcement
  - All tables have RLS enabled
  - Policies defined in migrations
  - Admin client for privileged operations

- ✅ **Requirement 11.2**: Multi-factor authentication
  - MFA enrollment functions
  - TOTP verification
  - Profile tracking of MFA status
  - Middleware enforcement

## Next Steps

1. ✅ Supabase client configured
2. ✅ Authentication utilities created
3. ✅ Middleware for session management
4. ✅ Environment variables verified
5. ✅ Tests passing

**Ready for**: Task 2.1 - Create CPF validation module

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js App Router with Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [MFA Documentation](https://supabase.com/docs/guides/auth/auth-mfa)
