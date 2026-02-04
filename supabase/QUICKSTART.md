# Quick Start Guide - Database Migrations

This guide will help you set up and test the Supabase database migrations locally.

## Prerequisites

1. **Install Supabase CLI**
   ```bash
   # macOS
   brew install supabase/tap/supabase
   
   # Windows (via Scoop)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   
   # Linux
   brew install supabase/tap/supabase
   ```

2. **Install Docker Desktop**
   - Download from [docker.com](https://www.docker.com/products/docker-desktop)
   - Make sure Docker is running before proceeding

## Step 1: Initialize Supabase

```bash
# Navigate to project root
cd /path/to/photovoltaic-contract-system

# Start Supabase local instance
supabase start
```

This will:
- Pull the necessary Docker images
- Start PostgreSQL, PostgREST, GoTrue, and other services
- Display connection details and credentials

**Save the output!** It contains important information:
- API URL: `http://localhost:54321`
- DB URL: `postgresql://postgres:postgres@localhost:54322/postgres`
- Studio URL: `http://localhost:54323`
- Anon key and Service role key

## Step 2: Apply Migrations

```bash
# Apply all migrations
supabase db reset
```

This command will:
1. Drop the existing database (if any)
2. Create a fresh database
3. Apply all migrations in order
4. Run the seed file (if uncommented)

## Step 3: Verify Migrations

### Option A: Run Test Script

```bash
# Connect to the database and run tests
supabase db execute -f supabase/test-migrations.sql
```

You should see output like:
```
NOTICE:  Test 1 PASSED: All tables exist
NOTICE:  Test 2 PASSED: RLS enabled on all tables
NOTICE:  Test 3 PASSED: 18 indexes created
...
NOTICE:  All migration tests completed successfully!
```

### Option B: Use Supabase Studio

1. Open http://localhost:54323 in your browser
2. Navigate to "Table Editor"
3. Verify all tables exist:
   - profiles
   - contracts
   - contract_items
   - audit_logs
4. Check the "Policies" tab to verify RLS policies

### Option C: Manual SQL Queries

```bash
# Connect to database
supabase db connect

# Run queries
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
SELECT * FROM information_schema.table_constraints WHERE table_schema = 'public';
```

## Step 4: Test with Sample Data

### Create a Test Admin User

1. Open Supabase Studio: http://localhost:54323
2. Go to "Authentication" → "Users"
3. Click "Add user"
4. Fill in:
   - Email: `admin@isotec.com.br`
   - Password: `test123456`
   - Auto Confirm User: ✓
5. Copy the User ID

### Insert Test Profile

```bash
# Connect to database
supabase db connect

# Insert profile (replace USER_ID with the copied ID)
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  'USER_ID'::uuid,
  'admin@isotec.com.br',
  'Test Admin',
  'super_admin'
);
```

### Create Test Contract

```sql
-- Insert test contract
INSERT INTO public.contracts (
  contractor_name,
  contractor_cpf,
  contractor_email,
  contractor_phone,
  address_cep,
  address_street,
  address_number,
  address_neighborhood,
  address_city,
  address_state,
  location_latitude,
  location_longitude,
  project_kwp,
  installation_date,
  services,
  contract_value,
  payment_method,
  created_by
) VALUES (
  'João da Silva',
  '12345678901',
  'joao.silva@example.com',
  '11987654321',
  '01310100',
  'Avenida Paulista',
  '1578',
  'Bela Vista',
  'São Paulo',
  'SP',
  -23.5613,
  -46.6565,
  10.50,
  '2024-06-15',
  '[
    {"description": "Instalação de painéis solares", "included": true},
    {"description": "Instalação de inversor", "included": true},
    {"description": "Conexão à rede elétrica", "included": true}
  ]'::jsonb,
  85000.00,
  'pix',
  'USER_ID'::uuid
);

-- Get the contract ID
SELECT id, uuid FROM public.contracts WHERE contractor_cpf = '12345678901';

-- Insert contract items (replace CONTRACT_ID)
INSERT INTO public.contract_items (contract_id, item_name, quantity, unit, sort_order) VALUES
  ('CONTRACT_ID'::uuid, 'Painel Solar 550W', 20, 'un', 1),
  ('CONTRACT_ID'::uuid, 'Inversor Solar 10kW', 1, 'un', 2),
  ('CONTRACT_ID'::uuid, 'Estrutura de Fixação', 1, 'un', 3);
```

## Step 5: Test RLS Policies

### Test as Anonymous User (Public Access)

```sql
-- Set role to anonymous
SET ROLE anon;

-- Should work: View contract by UUID
SELECT * FROM public.contracts WHERE uuid = 'CONTRACT_UUID';

-- Should work: View contract items
SELECT * FROM public.contract_items WHERE contract_id = 'CONTRACT_ID';

-- Should fail: View all contracts
SELECT * FROM public.contracts;

-- Should fail: Insert contract
INSERT INTO public.contracts (...) VALUES (...);
```

### Test as Authenticated Admin

```sql
-- Set role to authenticated
SET ROLE authenticated;
SET request.jwt.claims.sub = 'USER_ID';

-- Should work: View all contracts
SELECT * FROM public.contracts;

-- Should work: Insert contract
INSERT INTO public.contracts (...) VALUES (...);

-- Should work: Update pending contract
UPDATE public.contracts SET contractor_name = 'New Name' 
WHERE id = 'CONTRACT_ID' AND status = 'pending_signature';

-- Should fail: Update signed contract
UPDATE public.contracts SET contractor_name = 'New Name' 
WHERE id = 'CONTRACT_ID' AND status = 'signed';
```

## Step 6: Update Environment Variables

Copy the connection details to your `.env.local` file:

```bash
# Copy example file
cp .env.local.example .env.local

# Edit with your values
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase-start>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-supabase-start>
```

## Common Commands

```bash
# Check Supabase status
supabase status

# Stop Supabase
supabase stop

# View logs
supabase logs

# Reset database (WARNING: destroys all data)
supabase db reset

# Create new migration
supabase migration new <migration_name>

# Generate TypeScript types
supabase gen types typescript --local > lib/types/database.types.ts
```

## Troubleshooting

### Docker not running
```
Error: Cannot connect to the Docker daemon
```
**Solution**: Start Docker Desktop

### Port already in use
```
Error: port 54321 is already allocated
```
**Solution**: Stop other Supabase instances or change ports in `config.toml`

### Migration fails
```
Error: migration failed
```
**Solution**: 
1. Check the error message
2. Fix the SQL in the migration file
3. Run `supabase db reset` to reapply all migrations

### RLS policy not working
```
Error: new row violates row-level security policy
```
**Solution**: 
1. Check if you're authenticated
2. Verify the user has the correct role
3. Review the RLS policy conditions

## Next Steps

After successfully testing the migrations:

1. **Generate TypeScript Types**
   ```bash
   supabase gen types typescript --local > lib/types/database.types.ts
   ```

2. **Update Supabase Clients**
   - Verify `lib/supabase/client.ts` and `lib/supabase/server.ts` are configured
   - Test connection from Next.js app

3. **Deploy to Production**
   ```bash
   # Link to Supabase project
   supabase link --project-ref <project-ref>
   
   # Push migrations
   supabase db push
   ```

## Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
