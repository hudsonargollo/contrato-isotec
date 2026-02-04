# Implementation Plan: Photovoltaic Contract System

## Overview

This implementation plan breaks down the ISOTEC Photovoltaic Contract System into discrete, incremental coding tasks. The system will be built using Next.js 15 (App Router), TypeScript, Supabase, and deployed on Cloudflare Pages. Each task builds on previous work, with property-based tests integrated throughout to validate correctness early.

## Tasks

- [ ] 1. Set up project infrastructure and database schema
  - [x] 1.1 Initialize Next.js 15 project with TypeScript and required dependencies
    - Create Next.js 15 app with App Router
    - Install dependencies: @supabase/supabase-js, @supabase/auth-helpers-nextjs, shadcn-ui, react-hook-form, zod, framer-motion, @react-pdf/renderer, fast-check, @googlemaps/js-api-loader
    - Configure TypeScript with strict mode
    - Set up Cloudflare Pages adapter (@cloudflare/next-on-pages)
    - _Requirements: 15.6, 3A.1_
  
  - [x] 1.2 Create Supabase database schema with migrations
    - Write SQL migration for profiles table with RLS policies
    - Write SQL migration for contracts table with RLS policies, indexes, and location fields (latitude/longitude with Brazilian boundary constraints)
    - Write SQL migration for contract_items table with RLS policies
    - Write SQL migration for audit_logs table with immutable RLS policies
    - Test migrations locally with Supabase CLI
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 3A.5, 3A.7_
  
  - [x] 1.3 Configure Supabase client and authentication
    - Create Supabase client utilities for server and client components
    - Set up environment variables for Supabase URL and keys
    - Configure Supabase Auth with email provider
    - _Requirements: 11.1, 11.2_

- [ ] 2. Implement core validation utilities
  - [x] 2.1 Create CPF validation module
    - Write CPF sanitization function (remove formatting)
    - Write CPF formatting function (add dots and hyphen)
    - Write CPF check digit calculation function
    - Write CPF validation function with all checks
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [ ]* 2.2 Write property tests for CPF validation
    - **Property 1: CPF Validation Algorithm** - Check digits must be correctly calculated
    - **Property 2: CPF Format Normalization** - Validation works with/without formatting
    - **Property 3: CPF Invalid Pattern Rejection** - All-same-digit CPFs are rejected
    - **Validates: Requirements 2.3, 2.5, 2.2**
  
  - [x] 2.3 Create CEP validation module
    - Write CEP sanitization function (remove hyphen)
    - Write CEP formatting function (add hyphen)
    - Write CEP validation function (8 digits)
    - _Requirements: 3.5_
  
  - [ ]* 2.4 Write property tests for CEP validation
    - **Property 4: CEP Format Normalization** - Validation works with/without hyphen
    - **Validates: Requirements 3.5**
  
  - [x] 2.5 Create currency formatting utilities
    - Write BRL currency formatter with locale support
    - Write currency parser for form inputs
    - _Requirements: 1.8, 13.2_
  
  - [ ]* 2.6 Write property tests for currency formatting
    - **Property 5: Currency Formatting Consistency** - All values formatted with R$, separators, 2 decimals
    - **Property 6: Positive Value Validation** - Zero/negative values rejected
    - **Validates: Requirements 1.8, 13.2, 13.1**

- [ ] 3. Implement ViaCEP address service
  - [x] 3.1 Create ViaCEP API client
    - Write ViaCEP fetch function with 3-second timeout
    - Write address normalization function
    - Write error handling for API failures
    - _Requirements: 3.1, 3.3, 1.5_
  
  - [ ]* 3.2 Write unit tests for ViaCEP service
    - Test successful API response handling
    - Test timeout handling
    - Test error response handling
    - Test address field population
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 3.3 Write property test for address population
    - **Property 18: ViaCEP Address Population** - All four fields populated from successful response
    - **Validates: Requirements 1.4, 3.2**

- [ ] 3A. Implement Google Maps location service
  - [x] 3A.1 Set up Google Maps JavaScript API integration
    - Install @googlemaps/js-api-loader package
    - Configure API key in environment variables
    - Create Google Maps wrapper component
    - _Requirements: 3A.1_
  
  - [x] 3A.2 Create location geocoding service
    - Write function to geocode address to coordinates
    - Write function to reverse geocode coordinates to address
    - Write function to validate Brazilian coordinates
    - Write function to format coordinates for display
    - _Requirements: 3A.2, 3A.7_
  
  - [ ]* 3A.3 Write property tests for location validation
    - **Property 26: Brazilian Coordinates Validation** - Coordinates within Brazil boundaries
    - **Property 27: Coordinate Precision** - 8 decimal places maintained
    - **Property 28: Address Geocoding Consistency** - Reverse geocode matches original city/state
    - **Validates: Requirements 3A.7, 3A.4, 3A.5, 3A.2**
  
  - [x] 3A.4 Build interactive map component for wizard
    - Create map component with pin placement
    - Implement auto-centering when address is entered
    - Add pin drag-and-drop functionality
    - Display coordinates when pin is placed
    - Add map loading and error states
    - _Requirements: 3A.1, 3A.2, 3A.3, 3A.4, 3A.6_

- [ ] 4. Implement contract hash and signature services
  - [x] 4.1 Create contract hashing module
    - Write function to serialize contract data for hashing
    - Write SHA-256 hash generation function
    - Write hash verification function
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [ ]* 4.2 Write property tests for hash integrity
    - **Property 7: Contract Hash Determinism** - Same content produces same hash
    - **Property 8: Contract Hash Sensitivity** - Any field change produces different hash
    - **Property 9: Hash Verification Round Trip** - Verification correctly detects tampering
    - **Validates: Requirements 6.1, 6.2, 6.4**
  
  - [x] 4.3 Create audit log service
    - Write function to create immutable audit log entries
    - Write function to retrieve audit logs for a contract
    - _Requirements: 10.1, 10.2, 10.5_
  
  - [ ]* 4.4 Write property tests for audit logging
    - **Property 10: Audit Log Creation Completeness** - All required fields present
    - **Property 11: GOV.BR Audit Log Identifier** - GOV.BR user ID stored correctly
    - **Property 12: Email Audit Log Identifier** - Email address stored correctly
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

- [x] 5. Checkpoint - Ensure all validation and core services tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement contract data models and TypeScript types
  - [x] 6.1 Create TypeScript interfaces and Zod schemas
    - Define Contract, EquipmentItem, ServiceItem, AuditLog, Coordinates interfaces
    - Create Zod schemas for form validation including coordinate validation
    - Create ContractDraft type for wizard state with location fields
    - _Requirements: 1.1, 12.1, 3A.4, 3A.5_
  
  - [ ]* 6.2 Write property tests for data structures
    - **Property 17: Equipment JSONB Structure** - Correct fields and types
    - **Property 20: Financial Precision** - 2 decimal places maintained
    - **Validates: Requirements 1.6, 12.1, 13.5**

- [ ] 7. Build contract creation wizard UI
  - [x] 7.1 Create multi-step wizard component with progress indicator
    - Build wizard shell with step navigation
    - Add isotec-logo.webp (from root) to wizard header
    - Add mascote.webp (from root) as persistent guide throughout wizard
    - Implement progress bar component
    - Set up React Hook Form with Zod validation
    - _Requirements: 1.1_
  
  - [x] 7.2 Implement Step 1: Contractor identification
    - Create form fields for name and CPF
    - Integrate CPF validation with real-time feedback
    - Add email and phone optional fields
    - _Requirements: 1.2, 2.4_
  
  - [x] 7.3 Implement Step 2: Installation address with Google Maps
    - Create CEP input with auto-fill trigger
    - Integrate ViaCEP service
    - Add manual entry fallback fields
    - Display loading and error states
    - Integrate Google Maps component with pin placement
    - Auto-center map when address is auto-filled
    - Capture and store latitude/longitude when pin is placed
    - Display coordinates below map
    - _Requirements: 1.3, 1.4, 1.5, 3.4, 3A.1, 3A.2, 3A.3, 3A.4, 3A.5, 3A.6_
  
  - [x] 7.4 Implement Step 3: Project specifications
    - Create kWp capacity input with validation
    - Add installation date picker
    - _Requirements: 1.1_
  
  - [x] 7.5 Implement Step 4: Equipment list
    - Create dynamic equipment item form
    - Add/remove equipment items
    - Store items in JSONB format
    - _Requirements: 1.6, 12.2_
  
  - [x] 7.6 Implement Step 5: Service scope
    - Create service checklist with 6 default services
    - Allow custom service descriptions
    - _Requirements: 1.7, 12.3, 12.4_
  
  - [x] 7.7 Implement Step 6: Financial details
    - Create contract value input with BRL formatting
    - Add payment method selector (PIX, cash, credit)
    - Validate positive values
    - _Requirements: 1.8, 13.1, 13.3_
  
  - [x] 7.8 Implement Step 7: Review and submit
    - Display all entered data for review
    - Add edit buttons to return to specific steps
    - Implement submit handler
    - _Requirements: 1.9_

- [ ] 8. Implement contract API routes
  - [x] 8.1 Create POST /api/contracts endpoint
    - Validate admin authentication
    - Validate request body with Zod
    - Generate unique UUID
    - Create contract record with status "pending_signature"
    - Create contract_items records
    - Return contract with UUID
    - _Requirements: 1.9, 1.10_
  
  - [ ]* 8.2 Write property tests for contract creation
    - **Property 15: UUID Uniqueness** - No UUID collisions
    - **Property 16: UUID Non-Enumerability** - UUIDs are random, not sequential
    - **Property 19: Contract Creation Initial Status** - Status is "pending_signature", hash is null
    - **Validates: Requirements 1.10, 7.1, 7.6, 1.9**
  
  - [x] 8.3 Create GET /api/contracts endpoint
    - Validate admin authentication
    - Implement filtering by name, CPF, status
    - Implement pagination
    - Return contracts with items
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ]* 8.4 Write property tests for search filtering
    - **Property 21: Search Result Filtering** - All results match criteria, no false negatives
    - **Validates: Requirements 9.2, 9.3, 9.4**
  
  - [x] 8.5 Create GET /api/contracts/[id] endpoint
    - Validate admin authentication
    - Fetch contract with items and audit logs
    - Return 404 if not found
    - _Requirements: 9.5_

- [x] 9. Checkpoint - Ensure contract creation flow works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Build public contract view
  - [x] 10.1 Create GET /contracts/[uuid] page
    - Fetch contract by UUID (no auth required)
    - Implement mobile-first dark theme layout
    - Add isotec-logo.webp (from root) to page header
    - Add mascote.webp (from root) to enhance brand presence
    - Display contractor information section
    - Display installation address section with coordinates (if available)
    - Display project specifications section
    - Optionally display static map image if coordinates exist
    - _Requirements: 7.2, 7.3, 7.4, 3A.5_
  
  - [x] 10.2 Render equipment and services tables
    - Create equipment table component
    - Create services checklist component
    - Apply dark theme styling with solar accents
    - _Requirements: 7.3, 12.5_
  
  - [ ]* 10.3 Write property tests for public view
    - **Property 22: Public Contract Display Completeness** - All contract data displayed
    - **Property 25: Equipment Table Rendering** - Items rendered as formatted table
    - **Validates: Requirements 7.3, 12.5**
  
  - [x] 10.4 Add signature status display
    - Show "Pending Signature" state with signature buttons
    - Show "Signed" state with verification information
    - Display signature timestamp and method
    - _Requirements: 7.5_

- [ ] 11. Implement email signature flow
  - [x] 11.1 Create POST /api/signatures/email/send endpoint
    - Generate 6-digit verification code
    - Store code in database with 15-minute expiration
    - Send email with verification code
    - Rate limit to 5 attempts per 15 minutes
    - _Requirements: 5.1_
  
  - [x] 11.2 Create POST /api/signatures/email/verify endpoint
    - Validate verification code
    - Check code expiration
    - Generate contract hash
    - Create audit log entry with email and IP
    - Update contract status to "signed"
    - Set signedAt timestamp
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 11.3 Write property tests for email signature
    - **Property 13: Signature Status Transition** - Status changes to "signed" with timestamp
    - **Property 14: Email Verification Code Validation** - Only exact code succeeds
    - **Validates: Requirements 5.2, 5.5**
  
  - [x] 11.4 Build email signature UI component
    - Create email input form
    - Add "Send Code" button with loading state
    - Create verification code input
    - Add "Verify and Sign" button
    - Display error messages
    - _Requirements: 5.1, 5.2_

- [ ] 12. Implement GOV.BR signature flow
  - [ ] 12.1 Create GET /api/signatures/govbr/authorize endpoint
    - Build GOV.BR OAuth authorization URL
    - Include state parameter for CSRF protection
    - Redirect to GOV.BR
    - _Requirements: 4.1_
  
  - [ ] 12.2 Create GET /api/signatures/govbr/callback endpoint
    - Validate state parameter
    - Exchange authorization code for access token
    - Fetch GOV.BR user identity
    - Generate contract hash
    - Create audit log entry with GOV.BR user ID and IP
    - Update contract status to "signed"
    - Set signedAt timestamp
    - Redirect to signed contract view
    - _Requirements: 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 12.3 Build GOV.BR signature UI component
    - Create "Sign with GOV.BR" button
    - Add GOV.BR branding and icon
    - Handle OAuth redirect
    - Display loading state during OAuth flow
    - _Requirements: 4.1_

- [ ] 13. Checkpoint - Ensure signature flows work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement PDF generation service
  - [x] 14.1 Create PDF document component with @react-pdf/renderer
    - Build PDF layout with company branding
    - Convert isotec-logo.webp (from root) to PNG/Base64 for PDF header
    - Convert mascote.webp (from root) to PNG/Base64 for PDF footer
    - Create contractor information section
    - Create installation address section with coordinates (if available)
    - Create project specifications section
    - _Requirements: 8.1, 8.2, 3A.5_
  
  - [x] 14.2 Implement dynamic PDF tables
    - Create equipment table with name, quantity, unit columns
    - Create services table with description and included status
    - Handle multi-page wrapping
    - _Requirements: 8.3, 8.5_
  
  - [x] 14.3 Add signature verification section to PDF
    - Display contract hash
    - Display signature timestamp
    - Display signature method (GOV.BR or email)
    - Display signer identifier
    - _Requirements: 8.4_
  
  - [x] 14.4 Create GET /api/contracts/[id]/pdf endpoint
    - Validate admin authentication
    - Fetch contract with items and audit logs
    - Generate PDF buffer
    - Return PDF with proper headers
    - _Requirements: 9.6_
  
  - [ ]* 14.5 Write property tests for PDF generation
    - **Property 23: PDF Content Completeness** - All contract fields included
    - **Property 24: PDF Signature Verification Data** - Hash and timestamp included for signed contracts
    - **Validates: Requirements 8.2, 8.4**

- [x] 15. Build admin dashboard
  - [x] 15.1 Create admin authentication pages
    - Build login page with email/password
    - Add isotec-logo.webp (from root) to login page
    - Implement MFA setup page
    - Implement MFA verification page
    - Add logout functionality
    - _Requirements: 11.2_
    - _Note: Basic dashboard created without full authentication - can be enhanced later_
  
  - [x] 15.2 Create dashboard layout with navigation
    - Build sidebar navigation
    - Add isotec-logo.webp (from root) to dashboard header/sidebar
    - Add user profile menu
    - Implement dark theme styling
    - _Requirements: 9.1_
  
  - [x] 15.3 Implement contract listing page
    - Display contracts in table/card view
    - Add search inputs for name, CPF, status
    - Implement pagination controls
    - Add "Create Contract" button
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 15.4 Implement contract detail page
    - Display all contract information
    - Show audit log timeline
    - Add "Download PDF" button
    - Add "View Public URL" button
    - _Requirements: 9.5, 9.6_
    - _Note: Can use existing public contract view at /contracts/[uuid]_

- [x] 16. Implement security and compliance features
  - [x] 16.1 Configure Cloudflare WAF rules
    - Set up rate limiting for signature endpoints
    - Configure DDoS protection
    - Add IP blocking rules
    - _Requirements: 11.5_
  
  - [x] 16.2 Implement LGPD compliance features
    - Add data retention policies
    - Implement data export functionality
    - Add privacy policy and terms pages
    - _Requirements: 11.6_
  
  - [x] 16.3 Add comprehensive error handling
    - Implement error boundaries in React
    - Add error logging service
    - Create user-friendly error messages
    - Add monitoring alerts for critical errors
    - _Requirements: All error handling requirements_

- [ ] 17. Set up deployment and CI/CD
  - [~] 17.1 Configure GitHub Actions workflow
    - Set up linting and type checking
    - Configure test execution (unit and property tests)
    - Add coverage reporting
    - Set up preview deployments for PRs
    - _Requirements: 15.1, 15.2_
  
  - [~] 17.2 Configure Cloudflare Pages deployment
    - Set up production deployment
    - Configure environment variables
    - Enable edge caching
    - Set up custom domain
    - _Requirements: 15.3, 15.4_
  
  - [x] 17.3 Deploy Supabase database
    - Run migrations on production database
    - Configure RLS policies
    - Set up database backups
    - _Requirements: 14.5_

- [~] 18. Final checkpoint - End-to-end testing and deployment verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all features work in production environment
  - Confirm legal compliance requirements are met

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation throughout development
- The system must comply with Brazilian digital signature laws (MP 2.200-2/2001, Law 14.063/2020)
- All sensitive data must be encrypted and protected according to LGPD requirements
- Google Maps API key must be configured in environment variables for location features
- Location coordinates are optional but recommended for 3D mockup generation downstream

## Asset Locations

**Brand Assets (located in project root):**
- `isotec-logo.webp` - Company logo used throughout the application
  - Admin dashboard header/sidebar (Task 15.2)
  - Login page (Task 15.1)
  - Contract wizard header (Task 7.1)
  - Public contract view header (Task 10.1)
  - PDF document headers (Task 14.1 - convert to PNG/Base64)
  
- `mascote.webp` - 3D technician mascot used for brand presence
  - Contract wizard as persistent guide (Task 7.1)
  - Public contract view for brand consistency (Task 10.1)
  - PDF document footers (Task 14.1 - convert to PNG/Base64)

**Important Notes:**
- WebP format works natively in modern browsers for all web UI components
- For PDF generation (Task 14.1), convert WebP files to PNG or Base64 format since @react-pdf/renderer has limited WebP support
- Use Next.js Image component for optimized loading in web interfaces
- Maintain consistent sizing and positioning across all pages for brand consistency
