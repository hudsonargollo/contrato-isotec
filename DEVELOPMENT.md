# Development Guide

## Quick Start

### 1. Environment Setup

Create `.env.local` file with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# GOV.BR OAuth (optional for MVP)
GOVBR_CLIENT_ID=your_govbr_client_id
GOVBR_CLIENT_SECRET=your_govbr_client_secret
GOVBR_REDIRECT_URI=http://localhost:3000/api/signatures/govbr/callback
```

### 2. Database Setup

Run Supabase migrations:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Or manually run the SQL files in `supabase/migrations/` in order.

### 3. Start Development Server

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## Testing the MVP

### Create a Contract

1. Go to http://localhost:3000
2. Click "Criar Contrato"
3. Fill in the 7-step wizard:
   - **Step 1:** Contractor info (use test CPF: 12345678909)
   - **Step 2:** Address (use test CEP: 01310-100 for São Paulo)
   - **Step 3:** Project specs (e.g., 5.5 kWp)
   - **Step 4:** Equipment list (add solar panels, inverters, etc.)
   - **Step 5:** Services (select included services)
   - **Step 6:** Financial (enter value and payment method)
   - **Step 7:** Review and submit

4. After submission, you'll be redirected to the public contract view

### Sign a Contract

1. On the public contract view, enter an email address
2. Click "Enviar Código"
3. Check console logs for the 6-digit code (in development mode)
4. Enter the code and click "Verificar e Assinar"
5. Contract status changes to "signed" with timestamp and hash

### View Contract Details

Access any contract via: http://localhost:3000/contracts/[uuid]

## Architecture

### Frontend (Next.js 15 App Router)

```
app/
├── page.tsx                    # Home page
├── wizard/page.tsx             # Contract creation wizard
├── contracts/[uuid]/page.tsx   # Public contract view
└── api/                        # API routes
    ├── contracts/
    │   ├── route.ts           # POST (create), GET (list)
    │   └── [id]/route.ts      # GET (details)
    └── signatures/email/
        ├── send/route.ts      # POST (send verification code)
        └── verify/route.ts    # POST (verify and sign)
```

### Components

```
components/
├── wizard/
│   ├── ContractWizard.tsx     # Main wizard component
│   ├── steps/                 # 7 wizard steps
│   └── GoogleMapsLocationPicker.tsx
├── contract/
│   └── EmailSignature.tsx     # Email signature component
└── ui/                        # Reusable UI components
```

### Services & Utilities

```
lib/
├── supabase/                  # Database client
├── validation/                # CPF, CEP, currency validators
├── services/                  # Business logic
│   ├── viacep.ts             # Address lookup
│   ├── googlemaps.ts         # Geocoding
│   ├── contract-hash.ts      # SHA-256 hashing
│   └── audit-log.ts          # Audit trail
└── types/                     # TypeScript types & Zod schemas
```

## Key Features

### 1. CPF Validation

```typescript
import { validateCPF, formatCPF, sanitizeCPF } from '@/lib/validation/cpf';

// Validate
validateCPF('123.456.789-09'); // true/false

// Format
formatCPF('12345678909'); // '123.456.789-09'

// Sanitize
sanitizeCPF('123.456.789-09'); // '12345678909'
```

### 2. CEP Lookup

```typescript
import { lookupCEP } from '@/lib/services/viacep';

const address = await lookupCEP('01310100');
// Returns: { street, neighborhood, city, state }
```

### 3. Contract Hashing

```typescript
import { generateContractHash } from '@/lib/services/contract-hash';

const hash = generateContractHash(contract);
// Returns: SHA-256 hash (64 characters)
```

### 4. Audit Logging

```typescript
import { createAuditLog } from '@/lib/services/audit-log';

await createAuditLog({
  contractId: 'uuid',
  eventType: 'signature_completed',
  signatureMethod: 'email',
  contractHash: 'hash',
  signerIdentifier: 'email@example.com',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
}, true); // useServerClient
```

## Database Schema

### contracts

- `id` (UUID, PK)
- `uuid` (UUID, unique) - For public URLs
- Contractor info (name, CPF, email, phone)
- Address (CEP, street, number, complement, neighborhood, city, state)
- Location (latitude, longitude) - Optional, 8 decimal places
- Project (kWp, installation_date)
- `services` (JSONB) - Array of service objects
- Financial (value, payment_method)
- Status (pending_signature, signed, cancelled)
- `contract_hash` (TEXT) - SHA-256 after signing
- Timestamps (created_at, updated_at, signed_at)

### contract_items

- `id` (UUID, PK)
- `contract_id` (UUID, FK)
- `item_name` (TEXT)
- `quantity` (INTEGER)
- `unit` (TEXT)
- `sort_order` (INTEGER)

### verification_codes

- `id` (UUID, PK)
- `contract_id` (UUID, FK)
- `email` (TEXT)
- `code` (TEXT) - 6 digits
- `expires_at` (TIMESTAMPTZ) - 15 minutes
- `attempts` (INTEGER) - Max 5
- `verified` (BOOLEAN)

### audit_logs

- `id` (UUID, PK)
- `contract_id` (UUID, FK)
- `event_type` (TEXT) - signature_initiated, signature_completed, signature_failed
- `signature_method` (TEXT) - email, govbr
- `contract_hash` (TEXT)
- `signer_identifier` (TEXT) - Email or GOV.BR user ID
- `ip_address` (TEXT)
- `user_agent` (TEXT)
- `created_at` (TIMESTAMPTZ)

## Testing

### Unit Tests

Located in `tests/unit/`:

- `validation/` - CPF, CEP, currency tests
- `services/` - ViaCEP, Google Maps, hashing, audit log tests
- `types/` - Zod schema validation tests

Run with: `npm test`

### Property-Based Tests (Optional)

Property tests validate universal properties across many inputs using `fast-check`.

Example properties:
- CPF validation algorithm correctness
- Hash determinism (same input = same output)
- Hash sensitivity (any change = different output)
- Coordinate precision (8 decimal places)

## Common Tasks

### Add a New Wizard Step

1. Create step component in `components/wizard/steps/`
2. Import in `ContractWizard.tsx`
3. Add to steps array
4. Update form schema in `lib/types/schemas.ts`

### Add a New Validation

1. Create validator in `lib/validation/`
2. Add unit tests in `tests/unit/validation/`
3. Integrate into Zod schema

### Add a New API Endpoint

1. Create route in `app/api/`
2. Use `createClient()` from `@/lib/supabase/server`
3. Validate with Zod schemas
4. Return proper HTTP status codes

## Troubleshooting

### Supabase Connection Issues

- Check `.env.local` has correct URL and anon key
- Verify Supabase project is running
- Check RLS policies allow the operation

### Google Maps Not Loading

- Verify API key in `.env.local`
- Enable Maps JavaScript API in Google Cloud Console
- Check browser console for errors

### Tests Failing

- Run `npm install` to ensure dependencies are up to date
- Clear Jest cache: `npx jest --clearCache`
- Check for TypeScript errors: `npx tsc --noEmit`

## Next Steps

See `.kiro/specs/photovoltaic-contract-system/tasks.md` for the complete implementation plan.

Priority tasks for post-MVP:
- GOV.BR OAuth integration
- PDF generation
- Admin dashboard
- Property-based tests
- LGPD compliance features
