# Database Migration Instructions

## Required Migrations for Core Infrastructure

To complete the checkpoint validation, please run these migrations in order:

### 1. Core Foundation Migration
```bash
supabase migration new create_profiles_table
```
Copy the content from: `supabase/migrations/20240101000001_create_profiles_table.sql`

### 2. Tenant Management System
```bash
supabase migration new create_tenant_management_system
```
Copy the content from: `supabase/migrations/20240302000001_create_tenant_management_system.sql`

### 3. User Activity Audit System
```bash
supabase migration new create_user_activity_audit_system
```
Copy the content from: `supabase/migrations/20240305000001_create_user_activity_audit_system.sql`

### 4. Apply Migrations
```bash
supabase db push
```

## Alternative: Direct SQL Execution

If you prefer to run the SQL directly, you can execute these files in order:

1. `supabase/migrations/20240101000001_create_profiles_table.sql`
2. `supabase/migrations/20240302000001_create_tenant_management_system.sql` 
3. `supabase/migrations/20240305000001_create_user_activity_audit_system.sql`

## Key Tables That Will Be Created

- `profiles` - User profile information
- `tenants` - Multi-tenant organizations
- `tenant_users` - User-tenant relationships with roles
- `tenant_usage` - Usage metrics for billing
- `user_activity_logs` - Comprehensive audit trail
- `security_events` - Security-related events

## After Migration

Once the migrations are complete, I can re-run the tenant isolation validation script to verify:
- ✅ Tenant data isolation (RLS policies)
- ✅ User permission enforcement
- ✅ Audit trail functionality
- ✅ Multi-tenant architecture

Let me know when the migrations are complete and I'll validate the infrastructure!