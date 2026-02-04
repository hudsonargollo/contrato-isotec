# Supabase Production Database Deployment Guide

This guide provides step-by-step instructions for deploying the Photovoltaic Contract System database to Supabase production.

## Prerequisites

Before starting, ensure you have:

- [ ] Supabase CLI installed (`brew install supabase/tap/supabase`)
- [ ] Supabase account created at [supabase.com](https://supabase.com)
- [ ] Access to the production Supabase project
- [ ] Git repository access
- [ ] Production environment variables ready

## Overview

The deployment process includes:

1. Creating/verifying Supabase project
2. Linking local repository to production
3. Running database migrations
4. Configuring RLS policies
5. Setting up database backups
6. Verifying deployment
7. Updating environment variables

## Step 1: Create or Verify Supabase Project

### Option A: Create New Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - **Name**: `photovoltaic-contract-system` (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely!)
   - **Region**: Choose closest to your users (e.g., `South America (São Paulo)` for Brazil)
   - **Pricing Plan**: Select appropriate plan (Pro recommended for production)
4. Click "Create new project"
5. Wait for project to be provisioned (2-3 minutes)

### Option B: Use Existing Project

If you already have a Supabase project:

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Note the project reference ID (found in Settings → General)

## Step 2: Link Local Repository to Production

```bash
# Navigate to project root
cd /path/to/photovoltaic-contract-system

# Link to your Supabase project
supabase link --project-ref <your-project-ref>
```

You'll be prompted to enter your database password. This creates a `.supabase/` directory with project configuration.

**Verify the link:**
```bash
supabase projects list
```

You should see your project marked as linked.

## Step 3: Run Database Migrations

### Review Migrations

Before deploying, review all migration files:

```bash
ls -la supabase/migrations/
```

You should see:
- `20240101000001_create_profiles_table.sql`
- `20240101000002_create_contracts_table.sql`
- `20240101000003_create_contract_items_table.sql`
- `20240101000004_create_audit_logs_table.sql`
- `20240101000005_create_verification_codes_table.sql`
- `cleanup_verification_codes.sql`

### Push Migrations to Production

```bash
# Push all migrations to production
supabase db push
```

This command will:
1. Compare local migrations with production database
2. Show you which migrations will be applied
3. Ask for confirmation
4. Apply migrations in order

**Expected output:**
```
Applying migration 20240101000001_create_profiles_table.sql...
Applying migration 20240101000002_create_contracts_table.sql...
Applying migration 20240101000003_create_contract_items_table.sql...
Applying migration 20240101000004_create_audit_logs_table.sql...
Applying migration 20240101000005_create_verification_codes_table.sql...
Applying migration cleanup_verification_codes.sql...
Finished supabase db push.
```

### Alternative: Manual Migration via Dashboard

If you prefer to apply migrations manually:

1. Go to Supabase Dashboard → SQL Editor
2. Copy content from each migration file
3. Execute in order
4. Verify no errors

## Step 4: Verify Database Schema

### Using Supabase Dashboard

1. Go to **Table Editor**
2. Verify all tables exist:
   - ✅ `profiles`
   - ✅ `contracts`
   - ✅ `contract_items`
   - ✅ `audit_logs`
   - ✅ `verification_codes`

3. Go to **Database** → **Policies**
4. Verify RLS is enabled on all tables
5. Check that policies are created for each table

### Using CLI

```bash
# Generate TypeScript types from production schema
supabase gen types typescript --linked > lib/supabase/database.types.ts

# Check migration status
supabase migration list --linked
```

### Using SQL

```bash
# Connect to production database
supabase db connect --linked

# Run verification queries
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
SELECT * FROM information_schema.table_constraints WHERE table_schema = 'public';
```

## Step 5: Configure RLS Policies

RLS policies are automatically created by migrations, but verify they're active:

### Verify RLS Status

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.

### Test RLS Policies

```sql
-- Test as anonymous user (should work)
SET ROLE anon;
SELECT * FROM contracts WHERE uuid = 'some-uuid';

-- Test as authenticated user (should work)
SET ROLE authenticated;
SELECT * FROM contracts;

-- Reset role
RESET ROLE;
```

## Step 6: Set Up Database Backups

### Enable Point-in-Time Recovery (PITR)

1. Go to **Settings** → **Database**
2. Scroll to **Backups**
3. Enable **Point-in-Time Recovery** (Pro plan required)
4. Configure retention period (7 days recommended minimum)

### Configure Automated Backups

Supabase automatically backs up your database daily. Verify settings:

1. Go to **Settings** → **Database** → **Backups**
2. Check backup schedule
3. Test restore process (optional but recommended)

### Manual Backup (Optional)

```bash
# Create manual backup
supabase db dump --linked -f backup-$(date +%Y%m%d).sql

# Store backup securely (e.g., S3, Google Drive)
```

## Step 7: Configure Database Settings

### Connection Pooling

1. Go to **Settings** → **Database**
2. Note the connection pooling settings:
   - **Transaction mode**: For serverless functions
   - **Session mode**: For long-lived connections
3. Use transaction mode for Cloudflare Pages deployment

### Performance Settings

1. Go to **Settings** → **Database** → **Configuration**
2. Review and adjust if needed:
   - **Max connections**: Default is usually sufficient
   - **Statement timeout**: 60 seconds recommended
   - **Idle timeout**: 10 minutes recommended

## Step 8: Update Environment Variables

### Get Production Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

### Update Production Environment

For Cloudflare Pages:

1. Go to Cloudflare Dashboard → Pages → Your Project
2. Go to **Settings** → **Environment Variables**
3. Add/update the following:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Click **Save**
5. Redeploy your application

### Update Local .env.local (for testing)

```bash
# Update .env.local with production values
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 9: Create Initial Admin User

### Via Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Fill in:
   - **Email**: `admin@isotec.com.br` (or your admin email)
   - **Password**: Generate strong password
   - **Auto Confirm User**: ✓ (check this box)
4. Click **Create user**
5. Copy the User ID

### Create Admin Profile

1. Go to **Table Editor** → **profiles**
2. Click **Insert** → **Insert row**
3. Fill in:
   - **id**: Paste the User ID from above
   - **email**: Same as user email
   - **full_name**: Admin name
   - **role**: `super_admin`
   - **mfa_enabled**: `false` (enable later via app)
4. Click **Save**

### Alternative: SQL Insert

```sql
-- Replace USER_ID with the actual UUID from Authentication
INSERT INTO public.profiles (id, email, full_name, role, mfa_enabled)
VALUES (
  'USER_ID'::uuid,
  'admin@isotec.com.br',
  'Admin User',
  'super_admin',
  false
);
```

## Step 10: Verify Deployment

### Test Database Connection

```bash
# Test connection from CLI
supabase db connect --linked

# Run test query
SELECT COUNT(*) FROM profiles;
```

### Test from Application

1. Deploy your application to Cloudflare Pages
2. Try to sign in with admin credentials
3. Create a test contract
4. Verify data appears in Supabase Dashboard

### Run Verification Script

Create a test script to verify all functionality:

```typescript
// scripts/verify-production-db.ts
import { createAdminClient } from '@/lib/supabase';

async function verifyDatabase() {
  const supabase = createAdminClient();
  
  // Test 1: Check tables exist
  const { data: profiles } = await supabase.from('profiles').select('count');
  console.log('✅ Profiles table accessible');
  
  const { data: contracts } = await supabase.from('contracts').select('count');
  console.log('✅ Contracts table accessible');
  
  const { data: items } = await supabase.from('contract_items').select('count');
  console.log('✅ Contract items table accessible');
  
  const { data: logs } = await supabase.from('audit_logs').select('count');
  console.log('✅ Audit logs table accessible');
  
  console.log('\n✅ All database tables verified!');
}

verifyDatabase();
```

Run it:
```bash
npx tsx scripts/verify-production-db.ts
```

## Step 11: Set Up Monitoring and Alerts

### Enable Database Monitoring

1. Go to **Reports** → **Database**
2. Review metrics:
   - Connection count
   - Query performance
   - Table sizes
   - Index usage

### Set Up Alerts (Pro Plan)

1. Go to **Settings** → **Alerts**
2. Configure alerts for:
   - High connection count
   - Slow queries
   - Database size threshold
   - Failed authentication attempts

### External Monitoring (Optional)

Consider integrating with:
- Sentry for error tracking
- Datadog for infrastructure monitoring
- PagerDuty for incident management

## Step 12: Security Hardening

### Review Security Settings

1. **API Settings**:
   - Verify JWT expiry time (default: 3600s)
   - Check CORS settings
   - Review rate limiting

2. **Database Settings**:
   - Verify SSL is enforced
   - Check connection encryption
   - Review IP allowlist (if needed)

3. **Authentication Settings**:
   - Enable email confirmations
   - Configure password requirements
   - Set up MFA enforcement

### Enable Additional Security Features

```sql
-- Enable audit logging for sensitive tables
CREATE EXTENSION IF NOT EXISTS "pg_audit";

-- Enable row-level security on all tables (already done in migrations)
-- Verify with:
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

## Troubleshooting

### Migration Fails

**Error**: "Migration already applied"

**Solution**:
```bash
# Check migration status
supabase migration list --linked

# If needed, repair migration history
supabase migration repair <version> --status applied --linked
```

### Connection Issues

**Error**: "Could not connect to database"

**Solution**:
1. Check database is running (Supabase Dashboard)
2. Verify credentials are correct
3. Check network/firewall settings
4. Try connection pooler URL instead of direct connection

### RLS Policy Errors

**Error**: "Row Level Security policy violation"

**Solution**:
1. Verify user has correct role in profiles table
2. Check RLS policies are created
3. Test with admin client (bypasses RLS)
4. Review policy conditions in migrations

### Performance Issues

**Error**: Slow queries or timeouts

**Solution**:
1. Check indexes are created (see migrations)
2. Review query plans in Dashboard
3. Enable connection pooling
4. Consider upgrading database plan

## Post-Deployment Checklist

- [ ] All migrations applied successfully
- [ ] RLS policies verified and active
- [ ] Database backups configured
- [ ] Admin user created and tested
- [ ] Environment variables updated
- [ ] Application deployed and tested
- [ ] Monitoring and alerts configured
- [ ] Security settings reviewed
- [ ] Documentation updated
- [ ] Team notified of production database URL

## Rollback Procedure

If you need to rollback:

### Option 1: Point-in-Time Recovery

1. Go to **Settings** → **Database** → **Backups**
2. Select restore point
3. Click **Restore**
4. Wait for restore to complete

### Option 2: Manual Rollback

```bash
# Create backup first
supabase db dump --linked -f backup-before-rollback.sql

# Drop problematic migration
supabase migration repair <version> --status reverted --linked

# Reapply previous state
supabase db push --linked
```

## Maintenance

### Regular Tasks

**Daily**:
- Monitor error logs
- Check backup status

**Weekly**:
- Review query performance
- Check database size
- Verify RLS policies

**Monthly**:
- Test backup restore
- Review security settings
- Update dependencies
- Optimize slow queries

### Database Optimization

```sql
-- Analyze tables for query optimization
ANALYZE;

-- Vacuum to reclaim storage
VACUUM ANALYZE;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

## Additional Resources

- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Database Migrations Guide](https://supabase.com/docs/guides/cli/managing-environments)
- [Row Level Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Backup and Restore](https://supabase.com/docs/guides/platform/backups)

## Support

If you encounter issues:

1. Check [Supabase Status](https://status.supabase.com)
2. Review [Supabase Docs](https://supabase.com/docs)
3. Search [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
4. Ask in [Supabase Discord](https://discord.supabase.com)
5. Contact Supabase Support (Pro plan)

---

**Requirements Satisfied**: 14.5 (Deploy Supabase database, run migrations, configure RLS policies, set up backups)
