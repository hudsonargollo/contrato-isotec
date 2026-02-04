# Supabase Database Migrations

This directory contains the database schema migrations for the Photovoltaic Contract System.

## Overview

The database schema consists of four main tables:

1. **profiles** - Admin user information with role-based access control
2. **contracts** - Master contract records with geographic location support
3. **contract_items** - Dynamic equipment lists for contracts
4. **audit_logs** - Immutable audit trail for signature events

## Migration Files 

Migrations are numbered sequentially and should be applied in order:

- `20240101000001_create_profiles_table.sql` - Creates profiles table with RLS policies
- `20240101000002_create_contracts_table.sql` - Creates contracts table with location fields and Brazilian coordinate validation
- `20240101000003_create_contract_items_table.sql` - Creates contract_items table
- `20240101000004_create_audit_logs_table.sql` - Creates immutable audit_logs table

## Key Features

### Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Allow public read access to contracts via UUID (for contractor viewing)
- Restrict write operations to authenticated admin users
- Prevent modification of audit logs (immutable)
- Enforce role-based access control

### Geographic Location Support

The contracts table includes:
- `location_latitude` and `location_longitude` fields with 8 decimal places (~1mm precision)
- Validation constraint ensuring coordinates are within Brazil's geographic boundaries
- Spatial index for efficient location-based queries

### Data Integrity

- Foreign key relationships between tables
- Check constraints for data validation (CPF format, CEP format, positive values, etc.)
- Automatic timestamp updates via triggers
- JSONB validation for services structure

### Audit Trail

The audit_logs table:
- Is completely immutable (no updates or deletes allowed)
- Automatically creates logs for contract creation and signature events
- Stores SHA-256 hashes for contract integrity verification
- Records IP addresses and user agents for legal compliance

## Local Development Setup

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Docker Desktop running (for local Supabase instance)

### Initialize Local Supabase

```bash
# Initialize Supabase in the project
supabase init

# Start local Supabase instance
supabase start
```

This will start:
- PostgreSQL database on port 54322
- Supabase Studio on port 54323
- API server on port 54321

### Apply Migrations

```bash
# Apply all migrations to local database
supabase db reset

# Or apply migrations incrementally
supabase migration up
```

### Seed Database

```bash
# Apply seed data (after creating a test user in Supabase Auth)
supabase db seed
```

### Create New Migration

```bash
# Create a new migration file
supabase migration new <migration_name>
```

## Testing Migrations

### Verify Schema

```bash
# Generate TypeScript types from database schema
supabase gen types typescript --local > lib/types/database.types.ts

# Check migration status
supabase migration list
```

### Test RLS Policies

```bash
# Connect to local database
supabase db connect

# Test queries as different users
SET ROLE authenticated;
SELECT * FROM public.contracts;
```

### Validate Constraints

Test the following constraints:
- Brazilian coordinate boundaries
- CPF format validation (11 digits)
- CEP format validation (8 digits)
- Positive values for contract_value and project_kwp
- Valid status and payment_method enums
- Services JSONB structure validation

## Production Deployment

### Deploy to Supabase Cloud

```bash
# Link to your Supabase project
supabase link --project-ref <project-ref>

# Push migrations to production
supabase db push

# Or use the Supabase dashboard to run migrations
```

### Backup Strategy

- Enable Point-in-Time Recovery (PITR) in Supabase dashboard
- Regular automated backups are handled by Supabase
- Export schema periodically: `supabase db dump -f schema.sql`

## Environment Variables

Required environment variables (see `.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Security Considerations

1. **RLS Policies**: All tables have RLS enabled. Never disable RLS in production.
2. **Service Role Key**: Keep the service role key secure. Only use it server-side.
3. **Anon Key**: The anon key is safe to expose in client-side code.
4. **Audit Logs**: Immutable by design. Cannot be modified or deleted.
5. **Coordinate Validation**: Ensures location data is within Brazil's boundaries.

## Troubleshooting

### Migration Fails

```bash
# Check migration status
supabase migration list

# Repair migration history
supabase migration repair <version> --status applied

# Reset database (WARNING: destroys all data)
supabase db reset
```

### RLS Policy Issues

```bash
# Check current role
SELECT current_user, current_role;

# Test policy as specific user
SET ROLE authenticated;
SET request.jwt.claims.sub = '<user-id>';
```

### Connection Issues

```bash
# Check if Supabase is running
supabase status

# Restart Supabase
supabase stop
supabase start
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostGIS for Geographic Data](https://postgis.net/documentation/)

## Schema Diagram

```
┌─────────────┐
│  auth.users │
└──────┬──────┘
       │
       │ (1:1)
       ▼
┌─────────────┐
│  profiles   │
└──────┬──────┘
       │
       │ (1:N)
       ▼
┌─────────────┐      ┌──────────────────┐
│  contracts  │◄─────┤ contract_items   │
└──────┬──────┘ (1:N)└──────────────────┘
       │
       │ (1:N)
       ▼
┌─────────────┐
│ audit_logs  │
└─────────────┘
```

## License

This database schema is part of the ISOTEC Photovoltaic Contract System.
