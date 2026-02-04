# Design Document: Photovoltaic Contract System

## Overview

The Photovoltaic Contract System is a full-stack web application built with Next.js 15 (App Router), React, TypeScript, and Supabase. The system follows a modern serverless architecture deployed on Cloudflare Pages with edge caching for global performance.

The application consists of three main user-facing components:

1. **Admin Dashboard** - Authenticated interface for ISOTEC employees to create, manage, and search contracts
2. **Public Contract View** - Mobile-first interface for contractors to review and sign contracts via unique UUID URLs
3. **PDF Generation Service** - Server-side rendering of professional contract documents

The system integrates with external services (ViaCEP for address lookup, GOV.BR for digital signatures) and maintains comprehensive audit trails for legal compliance with Brazilian digital signature laws.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloudflare Edge Network                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Next.js 15 App (Cloudflare Pages)            │   │
│  │                                                       │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │   Admin     │  │   Public     │  │    PDF     │  │   │
│  │  │  Dashboard  │  │  Contract    │  │ Generation │  │   │
│  │  │   Routes    │  │    View      │  │   Service  │  │   │
│  │  └─────────────┘  └──────────────┘  └────────────┘  │   │
│  │                                                       │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │         Supabase Client Library              │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Backend                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         PostgreSQL Database with RLS                 │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │ profiles │  │contracts │  │  contract_items  │   │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  │  ┌──────────────┐                                    │   │
│  │  │ audit_logs   │                                    │   │
│  │  └──────────────┘                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Authentication Service                  │   │
│  │         (Email, OAuth, MFA support)                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   ViaCEP     │  │   GOV.BR     │  │ Google Maps  │       │
│  │     API      │  │    OAuth     │  │     API      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 15 with App Router (React Server Components)
- TypeScript for type safety
- Shadcn UI components with dark theme customization
- React Hook Form + Zod for form validation
- Framer Motion for animations
- TanStack Query for data fetching and caching

**Backend:**
- Supabase (PostgreSQL with Row Level Security)
- Supabase Auth for authentication and MFA
- Supabase Realtime for live updates (future feature)

**PDF Generation:**
- @react-pdf/renderer for server-side PDF creation

**Deployment:**
- Cloudflare Pages with @cloudflare/next-on-pages adapter
- GitHub Actions for CI/CD
- Cloudflare WAF for security and rate limiting

**External APIs:**
- ViaCEP API for Brazilian postal code lookup
- GOV.BR OAuth for government digital signatures
- Google Maps JavaScript API for location pinpointing

### Security Architecture

**Authentication & Authorization:**
- Supabase Auth with email/password and OAuth providers
- Multi-factor authentication (TOTP) for admin users
- Row Level Security (RLS) policies on all tables
- JWT tokens with short expiration times

**Data Protection:**
- TLS 1.3 for all data in transit
- AES-256 encryption at rest (Supabase default)
- SHA-256 hashing for contract integrity verification
- IP address logging for audit trails

**Rate Limiting & DDoS Protection:**
- Cloudflare WAF rules for API endpoints
- Rate limiting on signature endpoints (5 attempts per 15 minutes)
- CAPTCHA for public contract signing (future enhancement)

## Components and Interfaces

### Frontend Components

#### 1. Contract Creation Wizard

Multi-step form component with progress indication and validation.

**Steps:**
1. Contractor Identification (name, CPF)
2. Installation Address (CEP lookup, manual entry, Google Maps location pin)
3. Project Specifications (kWp capacity, installation date)
4. Equipment List (dynamic JSONB items)
5. Service Scope (checklist with customization)
6. Financial Details (value, payment method)
7. Review and Submit

**Key Functions:**
```typescript
interface ContractWizardProps {
  onComplete: (contract: ContractDraft) => Promise<void>;
  onCancel: () => void;
}

// Validates CPF using standard algorithm
function validateCPF(cpf: string): boolean

// Queries ViaCEP API and returns address data
async function fetchAddressByCEP(cep: string): Promise<AddressData | null>

// Geocodes address to coordinates
async function geocodeAddress(address: string): Promise<Coordinates | null>

// Handles map pin placement
function handleMapPinPlacement(lat: number, lng: number): void

// Submits contract to Supabase
async function createContract(draft: ContractDraft): Promise<Contract>
```

#### 2. Public Contract View

Mobile-first contract display with signature interface.

**Key Functions:**
```typescript
interface PublicContractProps {
  contractId: string; // UUID from URL
}

// Fetches contract by UUID (no auth required)
async function getPublicContract(uuid: string): Promise<Contract | null>

// Initiates GOV.BR OAuth flow
function initiateGovBRSignature(contractId: string): void

// Sends email verification code
async function sendEmailVerificationCode(email: string, contractId: string): Promise<void>

// Verifies code and completes signature
async function verifyAndSign(contractId: string, code: string): Promise<SignatureResult>
```

#### 3. Admin Dashboard

Contract listing, search, and management interface.

**Key Functions:**
```typescript
interface DashboardProps {
  user: AdminUser;
}

// Fetches contracts with filters and pagination
async function getContracts(filters: ContractFilters, page: number): Promise<PaginatedContracts>

// Searches contracts by name, CPF, or status
async function searchContracts(query: string, field: SearchField): Promise<Contract[]>

// Generates and downloads PDF
async function downloadContractPDF(contractId: string): Promise<Blob>
```

#### 4. PDF Generator

Server-side component for professional PDF rendering.

**Key Functions:**
```typescript
// Generates PDF document from contract data
async function generateContractPDF(contract: Contract): Promise<Buffer>

// Renders contract header with branding
function renderPDFHeader(company: CompanyInfo): ReactElement

// Renders dynamic equipment table
function renderEquipmentTable(items: EquipmentItem[]): ReactElement

// Renders signature verification section
function renderSignatureVerification(auditLog: AuditLog): ReactElement
```

### Backend Services

#### 1. Contract Service

Handles contract CRUD operations with RLS enforcement.

**Key Functions:**
```typescript
// Creates new contract with pending status
async function createContract(data: ContractInput, adminId: string): Promise<Contract>

// Updates contract (only if status is pending)
async function updateContract(id: string, data: Partial<ContractInput>): Promise<Contract>

// Retrieves contract by UUID (public access)
async function getContractByUUID(uuid: string): Promise<Contract | null>

// Lists contracts with filters (admin only)
async function listContracts(filters: ContractFilters): Promise<Contract[]>
```

#### 2. Signature Service

Manages digital signature workflows and audit logging.

**Key Functions:**
```typescript
// Generates SHA-256 hash of contract content
function generateContractHash(contract: Contract): string

// Processes GOV.BR OAuth callback
async function processGovBRCallback(code: string, contractId: string): Promise<SignatureResult>

// Sends email verification code
async function sendVerificationEmail(email: string, contractId: string): Promise<void>

// Verifies email code and completes signature
async function verifyEmailSignature(
  contractId: string, 
  code: string, 
  ipAddress: string
): Promise<SignatureResult>

// Creates immutable audit log entry
async function createAuditLog(entry: AuditLogInput): Promise<AuditLog>

// Verifies contract hash integrity
async function verifyContractIntegrity(contractId: string): Promise<boolean>
```

#### 3. Address Service

Integrates with ViaCEP API for address lookup.

**Key Functions:**
```typescript
// Queries ViaCEP API with timeout and error handling
async function lookupCEP(cep: string): Promise<ViaCEPResponse | null>

// Normalizes ViaCEP response to internal format
function normalizeAddress(response: ViaCEPResponse): AddressData

// Validates CEP format (8 digits)
function validateCEP(cep: string): boolean
```

#### 3A. Location Service

Integrates with Google Maps API for geographic location capture.

**Key Functions:**
```typescript
// Geocodes address to coordinates using Google Maps Geocoding API
async function geocodeAddress(address: string): Promise<Coordinates | null>

// Validates coordinates are within Brazil's boundaries
function validateBrazilianCoordinates(lat: number, lng: number): boolean

// Formats coordinates for display
function formatCoordinates(lat: number, lng: number): string

// Reverse geocodes coordinates to address (for verification)
async function reverseGeocode(lat: number, lng: number): Promise<string | null>
```

#### 4. Validation Service

Centralized validation logic for Brazilian-specific formats.

**Key Functions:**
```typescript
// Validates CPF using check digit algorithm
function validateCPF(cpf: string): boolean

// Calculates CPF check digits
function calculateCPFCheckDigits(cpf: string): [number, number]

// Formats CPF with dots and hyphen
function formatCPF(cpf: string): string

// Removes formatting from CPF
function sanitizeCPF(cpf: string): string

// Validates CEP format
function validateCEP(cep: string): boolean

// Formats CEP with hyphen
function formatCEP(cep: string): string
```

### API Routes (Next.js App Router)

**Public Routes:**
- `GET /contracts/[uuid]` - Public contract view
- `POST /api/signatures/email/send` - Send verification code
- `POST /api/signatures/email/verify` - Verify code and sign
- `GET /api/signatures/govbr/callback` - GOV.BR OAuth callback

**Protected Routes (Admin):**
- `GET /dashboard` - Admin dashboard
- `POST /api/contracts` - Create contract
- `GET /api/contracts` - List contracts with filters
- `GET /api/contracts/[id]` - Get contract details
- `PATCH /api/contracts/[id]` - Update contract
- `GET /api/contracts/[id]/pdf` - Generate PDF
- `GET /api/audit-logs/[contractId]` - Get audit logs

**Authentication Routes:**
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `POST /api/auth/mfa/setup` - Setup MFA
- `POST /api/auth/mfa/verify` - Verify MFA token

## Data Models

### Database Schema

#### profiles Table

Stores admin user information.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  mfa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR role = 'admin');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);
```

#### contracts Table

Stores master contract records.

```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  
  -- Contractor Information
  contractor_name TEXT NOT NULL,
  contractor_cpf TEXT NOT NULL,
  contractor_email TEXT,
  contractor_phone TEXT,
  
  -- Installation Address
  address_cep TEXT NOT NULL,
  address_street TEXT NOT NULL,
  address_number TEXT NOT NULL,
  address_complement TEXT,
  address_neighborhood TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_state TEXT NOT NULL,
  
  -- Geographic Location (for 3D mockups)
  location_latitude DECIMAL(10, 8), -- e.g., -23.55052000
  location_longitude DECIMAL(11, 8), -- e.g., -46.63330800
  
  -- Project Specifications
  project_kwp DECIMAL(10, 2) NOT NULL,
  installation_date DATE,
  
  -- Service Scope (JSONB array of service descriptions)
  services JSONB NOT NULL DEFAULT '[]',
  
  -- Financial Information
  contract_value DECIMAL(12, 2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'pix', 'cash', 'credit'
  
  -- Status and Metadata
  status TEXT NOT NULL DEFAULT 'pending_signature', -- 'pending_signature', 'signed', 'cancelled'
  contract_hash TEXT, -- SHA-256 hash after signing
  
  -- Audit Fields
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  signed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending_signature', 'signed', 'cancelled')),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('pix', 'cash', 'credit')),
  CONSTRAINT positive_kwp CHECK (project_kwp > 0),
  CONSTRAINT positive_value CHECK (contract_value > 0),
  CONSTRAINT valid_brazilian_coordinates CHECK (
    (location_latitude IS NULL AND location_longitude IS NULL) OR
    (location_latitude BETWEEN -33.75 AND 5.27 AND location_longitude BETWEEN -73.99 AND -34.79)
  )
);

-- Indexes
CREATE INDEX idx_contracts_uuid ON contracts(uuid);
CREATE INDEX idx_contracts_cpf ON contracts(contractor_cpf);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_created_at ON contracts(created_at DESC);
CREATE INDEX idx_contracts_location ON contracts(location_latitude, location_longitude) WHERE location_latitude IS NOT NULL;

-- RLS Policies
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view contracts by UUID"
  ON contracts FOR SELECT
  USING (TRUE); -- UUID is non-enumerable, provides security

CREATE POLICY "Admins can insert contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update pending contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (
    status = 'pending_signature' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

#### contract_items Table

Stores dynamic equipment lists.

```sql
CREATE TABLE contract_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  -- Item Details
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL, -- 'un', 'kg', 'm', etc.
  
  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

-- Indexes
CREATE INDEX idx_contract_items_contract_id ON contract_items(contract_id);
CREATE INDEX idx_contract_items_sort_order ON contract_items(contract_id, sort_order);

-- RLS Policies
ALTER TABLE contract_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view items for public contracts"
  ON contract_items FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can insert items"
  ON contract_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update items for pending contracts"
  ON contract_items FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_id AND c.status = 'pending_signature'
  ));

CREATE POLICY "Admins can delete items for pending contracts"
  ON contract_items FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_id AND c.status = 'pending_signature'
  ));
```

#### audit_logs Table

Stores immutable signature event records.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type TEXT NOT NULL, -- 'signature_initiated', 'signature_completed', 'signature_failed'
  signature_method TEXT NOT NULL, -- 'govbr', 'email'
  
  -- Signature Data
  contract_hash TEXT NOT NULL, -- SHA-256 hash at time of signature
  signer_identifier TEXT, -- GOV.BR user ID or email address
  ip_address INET NOT NULL,
  user_agent TEXT,
  
  -- Timestamp (immutable)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_event_type CHECK (event_type IN ('signature_initiated', 'signature_completed', 'signature_failed')),
  CONSTRAINT valid_signature_method CHECK (signature_method IN ('govbr', 'email'))
);

-- Indexes
CREATE INDEX idx_audit_logs_contract_id ON audit_logs(contract_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (TRUE); -- Signature service creates logs

-- Prevent updates and deletes (immutable)
CREATE POLICY "No updates allowed"
  ON audit_logs FOR UPDATE
  USING (FALSE);

CREATE POLICY "No deletes allowed"
  ON audit_logs FOR DELETE
  USING (FALSE);
```

### TypeScript Interfaces

```typescript
// Contract Types
interface Contract {
  id: string;
  uuid: string;
  
  // Contractor
  contractorName: string;
  contractorCPF: string;
  contractorEmail?: string;
  contractorPhone?: string;
  
  // Address
  addressCEP: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  
  // Geographic Location
  locationLatitude?: number;
  locationLongitude?: number;
  
  // Project
  projectKWp: number;
  installationDate?: Date;
  
  // Services and Items
  services: ServiceItem[];
  items: EquipmentItem[];
  
  // Financial
  contractValue: number;
  paymentMethod: 'pix' | 'cash' | 'credit';
  
  // Status
  status: 'pending_signature' | 'signed' | 'cancelled';
  contractHash?: string;
  
  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  signedAt?: Date;
}

interface EquipmentItem {
  id: string;
  contractId: string;
  itemName: string;
  quantity: number;
  unit: string;
  sortOrder: number;
}

interface ServiceItem {
  description: string;
  included: boolean;
}

interface AuditLog {
  id: string;
  contractId: string;
  eventType: 'signature_initiated' | 'signature_completed' | 'signature_failed';
  signatureMethod: 'govbr' | 'email';
  contractHash: string;
  signerIdentifier?: string;
  ipAddress: string;
  userAgent?: string;
  createdAt: Date;
}

// Form Types
interface ContractDraft {
  contractorName: string;
  contractorCPF: string;
  contractorEmail?: string;
  contractorPhone?: string;
  addressCEP: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  locationLatitude?: number;
  locationLongitude?: number;
  projectKWp: number;
  installationDate?: Date;
  services: ServiceItem[];
  items: EquipmentItem[];
  contractValue: number;
  paymentMethod: 'pix' | 'cash' | 'credit';
}

// API Response Types
interface SignatureResult {
  success: boolean;
  contractId: string;
  signedAt: Date;
  contractHash: string;
  error?: string;
}

interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface GoogleMapsConfig {
  apiKey: string;
  defaultCenter: Coordinates;
  defaultZoom: number;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

**Redundant Properties Eliminated:**
- Requirements 1.8, 8.6, 13.2, and 13.4 all test BRL currency formatting → Combined into Property 1
- Requirements 4.3, 5.3, and 6.1 all test SHA-256 hash generation → Combined into Property 2
- Requirements 4.4 and 5.4 test audit log creation for different signature methods → Combined into Property 3
- Requirements 4.5 and 5.5 test status transition to "signed" → Combined into Property 4
- Requirements 1.10 and 7.1 both test UUID generation → Combined into Property 5
- Requirements 1.4 and 3.2 both test ViaCEP field population → Combined into Property 6
- Requirements 1.6 and 12.1 both test JSONB equipment storage → Combined into Property 7
- Requirements 9.2, 9.3, and 9.4 all test search filtering → Combined into Property 8

This reflection reduces 90+ acceptance criteria to 25 unique, high-value properties that provide comprehensive coverage without redundancy.

### Core Validation Properties

**Property 1: CPF Validation Algorithm**

*For any* string representing a CPF, if it passes validation, then recalculating the check digits from the first 9 digits must produce the same check digits as provided in the input.

**Validates: Requirements 2.3**

**Property 2: CPF Format Normalization**

*For any* valid CPF, validation should succeed regardless of whether formatting characters (dots and hyphens) are present or absent.

**Validates: Requirements 2.5**

**Property 3: CPF Invalid Pattern Rejection**

*For any* string where all 11 digits are identical, CPF validation must reject it as invalid.

**Validates: Requirements 2.2**

**Property 4: CEP Format Normalization**

*For any* valid 8-digit CEP, validation should succeed regardless of whether the hyphen formatting character is present or absent.

**Validates: Requirements 3.5**

**Property 5: Currency Formatting Consistency**

*For any* positive decimal number, formatting it as BRL currency should produce a string containing the "R$" symbol, proper thousands separators, and exactly 2 decimal places.

**Validates: Requirements 1.8, 8.6, 13.2, 13.4**

**Property 6: Positive Value Validation**

*For any* contract value or kWp capacity, if the value is zero or negative, validation must reject it.

**Validates: Requirements 13.1**

### Hash Integrity Properties

**Property 7: Contract Hash Determinism**

*For any* contract, generating the SHA-256 hash twice with identical contract content must produce identical hash values.

**Validates: Requirements 4.3, 5.3, 6.1**

**Property 8: Contract Hash Sensitivity**

*For any* contract, if any field (contractor data, project specifications, equipment list, or service scope) is modified, the SHA-256 hash must change.

**Validates: Requirements 6.2**

**Property 9: Hash Verification Round Trip**

*For any* signed contract, recalculating the hash from current contract content and comparing it to the stored hash in the audit log should confirm integrity (return true if unmodified, false if tampered).

**Validates: Requirements 6.4**

### Signature and Audit Properties

**Property 10: Audit Log Creation Completeness**

*For any* signature event (GOV.BR or email), an audit log entry must be created containing timestamp, IP address, signature method, contract hash, and signer identifier.

**Validates: Requirements 4.4, 5.4, 10.1, 10.2, 10.5**

**Property 11: GOV.BR Audit Log Identifier**

*For any* signature completed via GOV.BR OAuth, the audit log entry must contain the GOV.BR user ID as the signer identifier.

**Validates: Requirements 10.3**

**Property 12: Email Audit Log Identifier**

*For any* signature completed via email verification, the audit log entry must contain the email address as the signer identifier.

**Validates: Requirements 10.4**

**Property 13: Signature Status Transition**

*For any* contract with status "pending_signature", when a signature is successfully completed (via either GOV.BR or email), the contract status must transition to "signed" and the signedAt timestamp must be set.

**Validates: Requirements 4.5, 5.5**

**Property 14: Email Verification Code Validation**

*For any* generated verification code, only the exact code should successfully authenticate the signature; any other code should fail validation.

**Validates: Requirements 5.2**

### UUID and Security Properties

**Property 15: UUID Uniqueness**

*For any* two contracts created by the system, their UUIDs must be different (non-collision property).

**Validates: Requirements 1.10, 7.1**

**Property 16: UUID Non-Enumerability**

*For any* sequence of generated UUIDs, they must not follow a predictable or sequential pattern (randomness property for security).

**Validates: Requirements 7.6**

### Data Structure Properties

**Property 17: Equipment JSONB Structure**

*For any* equipment item stored in the database, the JSONB structure must contain "itemName", "quantity", and "unit" fields with appropriate types (string, integer, string).

**Validates: Requirements 1.6, 12.1**

**Property 18: ViaCEP Address Population**

*For any* successful ViaCEP API response, all four address fields (street, neighborhood, city, state) must be populated with non-empty values from the response.

**Validates: Requirements 1.4, 3.2**

**Property 19: Contract Creation Initial Status**

*For any* newly created contract, the initial status must be "pending_signature" and the contractHash field must be null.

**Validates: Requirements 1.9**

**Property 20: Financial Precision**

*For any* contract value stored in the database, it must maintain exactly 2 decimal places of precision for currency calculations.

**Validates: Requirements 13.5**

### Search and Display Properties

**Property 21: Search Result Filtering**

*For any* search query (by name, CPF, or status), all returned contracts must match the search criteria, and no contracts matching the criteria should be excluded.

**Validates: Requirements 9.2, 9.3, 9.4**

**Property 22: Public Contract Display Completeness**

*For any* contract accessed via public UUID URL, the displayed view must include all contractor data, project specifications, equipment items, and service scope.

**Validates: Requirements 7.3**

**Property 23: PDF Content Completeness**

*For any* contract, the generated PDF must include all contract fields: contractor data, address, project specifications, equipment table, services table, and financial information.

**Validates: Requirements 8.2**

**Property 24: PDF Signature Verification Data**

*For any* signed contract, the generated PDF must include the contract hash and signature timestamp from the audit log.

**Validates: Requirements 8.4**

**Property 25: Equipment Table Rendering**

*For any* contract with equipment items, both the public view and PDF must render the items as a formatted table with columns for name, quantity, and unit.

**Validates: Requirements 8.3, 12.5**

### Location Capture Properties

**Property 26: Brazilian Coordinates Validation**

*For any* coordinates stored in the system, if they are not null, they must fall within Brazil's geographic boundaries (latitude between -33.75 and 5.27, longitude between -73.99 and -34.79).

**Validates: Requirements 3A.7**

**Property 27: Coordinate Precision**

*For any* coordinates stored in the database, latitude must maintain 8 decimal places and longitude must maintain 8 decimal places for accurate location representation.

**Validates: Requirements 3A.4, 3A.5**

**Property 28: Address Geocoding Consistency**

*For any* address successfully geocoded by Google Maps, the resulting coordinates when reverse geocoded should produce an address in the same city and state as the original address.

**Validates: Requirements 3A.2**

## Error Handling

### Validation Errors

**CPF Validation Errors:**
- Invalid length: "CPF must contain exactly 11 digits"
- Invalid pattern: "CPF cannot have all identical digits"
- Invalid check digits: "CPF check digits are invalid"

**CEP Validation Errors:**
- Invalid length: "CEP must contain exactly 8 digits"
- Invalid format: "CEP format is invalid"

**Financial Validation Errors:**
- Non-positive value: "Contract value must be greater than zero"
- Invalid kWp: "Solar capacity (kWp) must be greater than zero"

### External API Errors

**ViaCEP API Errors:**
- Network timeout (3 seconds): Display "Address lookup timed out. Please enter address manually."
- API returns error: Display "CEP not found. Please verify the postal code or enter address manually."
- Invalid response format: Fall back to manual entry with error message

**Google Maps API Errors:**
- API key invalid: Display "Map service unavailable. Location pin is optional."
- Geocoding failure: Display "Unable to locate address on map. You can manually place the pin."
- Coordinates outside Brazil: Display "Location must be within Brazil. Please adjust the pin."
- Network timeout: Display "Map loading timed out. Location pin is optional."

**GOV.BR OAuth Errors:**
- Authorization denied: Display "GOV.BR authorization was cancelled. Please try again or use email signature."
- OAuth timeout: Display "GOV.BR authentication timed out. Please try again."
- Invalid callback: Display "Authentication error. Please contact support."

### Signature Errors

**Email Verification Errors:**
- Invalid code: "Verification code is incorrect. Please try again."
- Expired code (15 minutes): "Verification code has expired. Please request a new code."
- Too many attempts (5 attempts): "Too many failed attempts. Please request a new code."

**Contract State Errors:**
- Already signed: "This contract has already been signed and cannot be modified."
- Contract not found: "Contract not found. Please verify the URL."
- Invalid UUID: "Invalid contract link. Please verify the URL."

### Database Errors

**Constraint Violations:**
- Duplicate CPF in active contracts: Log warning but allow (same customer can have multiple contracts)
- Foreign key violation: "Referenced record not found. Please refresh and try again."
- Unique constraint violation on UUID: Regenerate UUID and retry (should be extremely rare)

**RLS Policy Violations:**
- Unauthorized access: Return 403 Forbidden with generic message "Access denied"
- Invalid admin role: Redirect to login with message "Admin authentication required"

### Error Logging

All errors should be logged with:
- Timestamp
- Error type and message
- User ID (if authenticated)
- Request context (URL, method, IP address)
- Stack trace (for server errors)

Critical errors (database failures, external API failures) should trigger alerts for monitoring.

## Testing Strategy

### Dual Testing Approach

The system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples and edge cases
- Integration points between components
- Error conditions and error messages
- UI component rendering
- API route handlers

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Validation algorithms (CPF, CEP)
- Hash integrity and cryptographic operations
- Data structure invariants
- Search and filtering correctness

### Property-Based Testing Configuration

**Library Selection:**
- **TypeScript/JavaScript**: Use `fast-check` library for property-based testing
- Minimum 100 iterations per property test
- Each test must reference its design document property in a comment

**Tag Format:**
```typescript
// Feature: photovoltaic-contract-system, Property 1: CPF Validation Algorithm
test('CPF check digits are correctly validated', () => {
  fc.assert(
    fc.property(fc.cpfArbitrary(), (cpf) => {
      // Property test implementation
    }),
    { numRuns: 100 }
  );
});
```

### Test Organization

**Unit Tests Structure:**
```
tests/
├── unit/
│   ├── validation/
│   │   ├── cpf.test.ts
│   │   ├── cep.test.ts
│   │   └── currency.test.ts
│   ├── services/
│   │   ├── contract.test.ts
│   │   ├── signature.test.ts
│   │   └── address.test.ts
│   ├── components/
│   │   ├── ContractWizard.test.tsx
│   │   ├── PublicContractView.test.tsx
│   │   └── PDFGenerator.test.tsx
│   └── api/
│       ├── contracts.test.ts
│       └── signatures.test.ts
├── property/
│   ├── cpf-validation.property.test.ts
│   ├── hash-integrity.property.test.ts
│   ├── signature-audit.property.test.ts
│   ├── uuid-generation.property.test.ts
│   └── search-filtering.property.test.ts
└── integration/
    ├── contract-creation-flow.test.ts
    ├── signature-flow.test.ts
    └── pdf-generation.test.ts
```

### Critical Property Tests

The following properties are critical for legal compliance and must be thoroughly tested:

1. **CPF Validation Algorithm** (Property 1) - Ensures contractor identification accuracy
2. **Contract Hash Determinism** (Property 7) - Ensures reproducible integrity verification
3. **Contract Hash Sensitivity** (Property 8) - Ensures tampering detection
4. **Hash Verification Round Trip** (Property 9) - Ensures integrity verification works correctly
5. **Audit Log Creation Completeness** (Property 10) - Ensures legal evidence is captured
6. **Signature Status Transition** (Property 13) - Ensures contract state is correctly managed
7. **UUID Non-Enumerability** (Property 16) - Ensures security against enumeration attacks

### Test Data Generation

**Custom Arbitraries for fast-check:**

```typescript
// Generate valid CPF numbers
const validCPFArbitrary = fc.tuple(
  fc.array(fc.integer(0, 9), { minLength: 9, maxLength: 9 })
).map(([digits]) => {
  // Calculate check digits and return valid CPF
  const checkDigits = calculateCPFCheckDigits(digits);
  return [...digits, ...checkDigits].join('');
});

// Generate invalid CPF numbers
const invalidCPFArbitrary = fc.oneof(
  fc.string(), // Random strings
  fc.constant('11111111111'), // All same digits
  fc.tuple(fc.array(fc.integer(0, 9), { minLength: 9, maxLength: 9 }))
    .map(([digits]) => [...digits, 9, 9].join('')) // Wrong check digits
);

// Generate contract data
const contractArbitrary = fc.record({
  contractorName: fc.string({ minLength: 3, maxLength: 100 }),
  contractorCPF: validCPFArbitrary,
  addressCEP: fc.string({ minLength: 8, maxLength: 8 }).map(s => s.replace(/\D/g, '')),
  projectKWp: fc.float({ min: 0.1, max: 1000 }),
  contractValue: fc.float({ min: 1000, max: 1000000 }),
  // ... other fields
});
```

### Integration Testing

**Contract Creation Flow:**
1. Admin authentication
2. Multi-step wizard completion
3. ViaCEP API integration
4. Database record creation
5. UUID generation and URL creation

**Signature Flow:**
1. Public contract access via UUID
2. GOV.BR OAuth flow (mocked)
3. Email verification flow (mocked)
4. Hash generation
5. Audit log creation
6. Status transition
7. PDF generation with signature data

**PDF Generation:**
1. Contract data retrieval
2. PDF rendering with all sections
3. Table generation for equipment/services
4. Signature verification data inclusion
5. Multi-page handling

### Mocking Strategy

**External Services:**
- ViaCEP API: Mock with MSW (Mock Service Worker)
- GOV.BR OAuth: Mock OAuth flow with test tokens
- Email service: Mock with in-memory queue for testing

**Database:**
- Use Supabase local development instance for integration tests
- Use in-memory mock for unit tests
- Reset database state between test runs

### Performance Testing

While not part of unit/property tests, the following should be monitored:

- Contract creation time: < 2 seconds
- PDF generation time: < 5 seconds
- ViaCEP API response time: < 3 seconds
- Public contract page load: < 1 second
- Dashboard search response: < 500ms

### Continuous Integration

**GitHub Actions Workflow:**
1. Run linting (ESLint, TypeScript)
2. Run unit tests
3. Run property-based tests (100 iterations minimum)
4. Run integration tests
5. Generate coverage report (target: 80% coverage)
6. Build Next.js application
7. Deploy preview to Cloudflare Pages

**Test Execution:**
- All tests must pass before merge
- Property tests run with increased iterations (1000) on main branch
- Integration tests run against Supabase staging instance
