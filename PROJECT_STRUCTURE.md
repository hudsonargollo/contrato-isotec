# ISOTEC Photovoltaic Contract System - Project Structure

## Overview
Production-ready Next.js 15 application for managing photovoltaic installation contracts with digital signatures, deployed on Cloudflare Pages with Supabase backend.

---

## Core Application Structure

### `/app` - Next.js App Router
```
app/
├── admin/              # Admin dashboard (protected routes)
│   ├── contracts/      # Contract management
│   │   ├── [id]/       # Individual contract details
│   │   └── page.tsx    # Contract listing
│   └── page.tsx        # Admin home
├── api/                # API routes
│   ├── contracts/      # Contract CRUD operations
│   │   ├── [id]/       # Individual contract endpoints
│   │   │   └── pdf/    # PDF generation
│   │   └── route.ts    # List/create contracts
│   ├── data-export/    # LGPD data export
│   └── signatures/     # Digital signature endpoints
│       └── email/      # Email verification flow
├── contracts/          # Public contract viewing
│   └── [uuid]/         # View contract by UUID
├── data-export/        # LGPD data export page
├── login/              # Admin login
├── privacy/            # Privacy policy (LGPD)
├── terms/              # Terms of service
├── wizard/             # Contract creation wizard
├── error.tsx           # Global error boundary
├── globals.css         # Global styles
├── layout.tsx          # Root layout
├── not-found.tsx       # 404 page
└── page.tsx            # Homepage
```

### `/components` - React Components
```
components/
├── contract/           # Contract-specific components
│   └── EmailSignature.tsx
├── error/              # Error handling components
│   └── ErrorBoundary.tsx
├── ui/                 # Shadcn UI components
│   ├── button.tsx
│   ├── calendar.tsx
│   ├── card.tsx
│   ├── checkbox.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── popover.tsx
│   ├── progress.tsx
│   ├── radio-group.tsx
│   └── select.tsx
└── wizard/             # Multi-step wizard components
    ├── ContractWizard.tsx
    ├── GoogleMapsLocationPicker.tsx
    └── steps/          # Individual wizard steps
        ├── Step1ContractorInfo.tsx
        ├── Step2Address.tsx
        ├── Step3ProjectSpecs.tsx
        ├── Step4Equipment.tsx
        ├── Step5Services.tsx
        ├── Step6Financial.tsx
        └── Step7Review.tsx
```

### `/lib` - Core Business Logic
```
lib/
├── config/             # Configuration
│   └── data-retention.ts
├── errors/             # Error handling
│   ├── api-error-handler.ts
│   └── error-messages.ts
├── pdf/                # PDF generation
│   ├── ContractPDF.tsx
│   └── assets/         # (removed - too large for git)
├── services/           # Business services
│   ├── audit-log.ts
│   ├── contract-hash.ts
│   ├── data-export.ts
│   ├── email.ts
│   ├── error-logger.ts
│   ├── googlemaps.ts
│   ├── index.ts
│   └── viacep.ts
├── supabase/           # Supabase client
│   ├── admin.ts
│   ├── auth.ts
│   ├── client.ts
│   ├── config.ts
│   ├── index.ts
│   ├── server.ts
│   └── types.ts
├── types/              # TypeScript types
│   ├── index.ts
│   └── schemas.ts
├── validation/         # Input validation
│   ├── cep.ts
│   ├── cpf.ts
│   ├── currency.ts
│   └── index.ts
└── utils.ts            # Utility functions
```

---

## Database & Backend

### `/supabase` - Database Migrations
```
supabase/
├── functions/          # Edge functions
│   └── send-email/
├── migrations/         # SQL migrations (5 files)
│   ├── 20240101000001_create_profiles_table.sql
│   ├── 20240101000002_create_contracts_table.sql
│   ├── 20240101000003_create_contract_items_table.sql
│   ├── 20240101000004_create_audit_logs_table.sql
│   └── 20240101000005_create_verification_codes_table.sql
├── config.toml         # Supabase configuration
├── QUICKSTART.md       # Local development guide
├── README.md           # Migration documentation
├── seed.sql            # Seed data
└── test-migrations.sql # Migration tests
```

**Database Tables:**
- `profiles` - Admin users with role-based access
- `contracts` - Master contract records with location data
- `contract_items` - Equipment lists (JSONB)
- `audit_logs` - Immutable signature audit trail
- `verification_codes` - Email verification codes

---

## Documentation

### `/docs` - Project Documentation
```
docs/
├── deployment/         # Deployment guides
│   ├── DEPLOYMENT_CHECKLIST.md
│   ├── DEPLOY_GITHUB_CLOUDFLARE.md
│   ├── QUICK_DEPLOY.md
│   ├── SUPABASE_DEPLOY_CHECKLIST.md
│   ├── SUPABASE_PRODUCTION_DEPLOY.md
│   └── TASK_17.3_COMPLETION.md
├── ADMIN_SETUP.md      # Admin user setup
├── API.md              # API documentation
├── COMPLETION_STATUS.md # Feature completion status
├── DEVELOPMENT.md      # Development guide
├── EMAIL_SETUP.md      # Email configuration
├── ERROR_HANDLING.md   # Error handling guide
├── SECURITY_COMPLIANCE_IMPLEMENTATION.md
├── SMTP_INTEGRATION.md # SMTP setup
└── SUPABASE_SETUP.md   # Supabase configuration
```

### Spec Files (`.kiro/specs/`)
- `photovoltaic-contract-system/` - Main feature spec
  - `requirements.md` - User stories & acceptance criteria
  - `design.md` - System architecture & design
  - `tasks.md` - Implementation task list
- `ui-ux-improvements/` - UI/UX enhancement spec

---

## Testing

### `/tests` - Test Suite
```
tests/
├── integration/        # Integration tests (empty - future)
├── property/           # Property-based tests (empty - future)
└── unit/               # Unit tests
    ├── pdf/            # PDF generation tests
    ├── services/       # Service layer tests
    ├── supabase/       # Supabase config tests
    ├── types/          # Schema validation tests
    └── validation/     # Input validation tests
```

**Test Configuration:**
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Test setup
- Test framework: Jest + React Testing Library
- Property testing: fast-check (configured, not yet implemented)

---

## Scripts & Utilities

### `/scripts` - Automation Scripts
```
scripts/
├── cleanup-expired-data.ts      # Data retention cleanup
└── verify-production-database.ts # Database verification
```

**NPM Scripts:**
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm test             # Run tests
npm run verify:db    # Verify database
npm run cleanup:data # Clean expired data
```

---

## Configuration Files

### Root Configuration
```
.env.local.example      # Environment variables template
.eslintrc.json          # ESLint configuration
.gitignore              # Git ignore rules
jest.config.js          # Jest configuration
middleware.ts           # Next.js middleware (auth, session)
next.config.ts          # Next.js configuration
package.json            # Dependencies & scripts
postcss.config.mjs      # PostCSS configuration
tailwind.config.ts      # Tailwind CSS configuration
tsconfig.json           # TypeScript configuration
```

### Environment Variables Required
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# SMTP Email
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM

# Application
NEXT_PUBLIC_APP_URL
```

---

## Assets

### `/public` - Static Assets
```
public/
├── isotec-logo.webp    # Company logo
└── mascote.webp        # 3D technician mascot
```

---

## Key Features Implemented

✅ **Contract Management**
- Multi-step wizard with 7 steps
- CPF validation (Brazilian tax ID)
- CEP address lookup (ViaCEP API)
- Google Maps location picker
- Equipment & services management
- Financial details with BRL formatting

✅ **Digital Signatures**
- Email verification flow
- SHA-256 contract hashing
- Immutable audit logs
- IP address tracking

✅ **Admin Dashboard**
- Contract listing & search
- Contract details view
- PDF generation
- Audit log timeline

✅ **Security & Compliance**
- Row Level Security (RLS)
- LGPD data export
- Privacy policy & terms
- Error handling & logging
- Rate limiting (Cloudflare WAF)

✅ **PDF Generation**
- Professional contract PDFs
- Company branding
- Equipment & services tables
- Signature verification data

---

## Technology Stack

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Shadcn UI
- Framer Motion
- React Hook Form + Zod

**Backend:**
- Supabase (PostgreSQL + Auth)
- Next.js API Routes
- @react-pdf/renderer

**External APIs:**
- ViaCEP (Brazilian postal codes)
- Google Maps JavaScript API
- SMTP (email delivery)

**Deployment:**
- Cloudflare Pages
- GitHub (version control)
- Supabase Cloud (database)

---

## Development Status

**Current Version:** MVP Complete  
**Last Updated:** February 4, 2026  
**Production Database:** Deployed ✅  
**GitHub Repository:** `hudsonargollo/contrato-isotec`

**Next Steps:**
1. Configure GitHub Actions (CI/CD)
2. Deploy to Cloudflare Pages
3. Create admin user
4. End-to-end testing

---

## File Size Considerations

**Removed from Git:**
- Large base64 image files (lib/pdf/assets/*.txt)
- Build artifacts (.next/)
- Dependencies (node_modules/)
- Temporary files (.DS_Store, tsconfig.tsbuildinfo)

**Reason:** GitHub has file size limits. PDF generation will use original WebP files instead of base64 encoded versions.

---

## License & Contact

**Project:** ISOTEC Photovoltaic Contract System  
**Purpose:** Solar energy service contract management  
**Compliance:** Brazilian digital signature laws (MP 2.200-2/2001, Law 14.063/2020), LGPD

---

*This document provides a complete overview of the project structure. For detailed information, refer to individual documentation files in the `/docs` directory.*
