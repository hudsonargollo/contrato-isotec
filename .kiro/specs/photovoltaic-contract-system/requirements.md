# Requirements Document: Photovoltaic Contract System

## Introduction

The Photovoltaic Contract System is an enterprise-grade solution for automating the complete lifecycle of solar energy service contracts in Brazil. The system enables ISOTEC administrators to create, manage, and digitally sign service contracts with customers while maintaining full legal compliance with Brazilian digital signature laws (MP 2.200-2/2001 and Law 14.063/2020). The system provides a multi-step contract creation wizard, digital signature capabilities using GOV.BR OAuth or email authentication, public contract viewing, professional PDF generation, and comprehensive audit trails for legal evidence.

## Glossary

- **System**: The Photovoltaic Contract System
- **Admin**: An authenticated ISOTEC employee with contract management privileges
- **Contractor**: The customer receiving solar installation services
- **Contract**: A service agreement document between ISOTEC and a Contractor
- **CPF**: Cadastro de Pessoas Físicas - Brazilian individual taxpayer registry identification
- **CEP**: Código de Endereçamento Postal - Brazilian postal code
- **GOV.BR**: Brazilian government digital identity platform
- **Advanced_Signature**: Digital signature using GOV.BR OAuth with SHA-256 hash
- **Admitted_Signature**: Email-based signature with audit trail
- **Contract_Hash**: SHA-256 cryptographic hash of contract content
- **Audit_Log**: Immutable record of signature events with timestamps and IP addresses
- **RLS**: Row Level Security - PostgreSQL security policy system
- **ViaCEP**: Brazilian postal code lookup API service
- **kWp**: Kilowatt-peak - unit of solar panel capacity measurement
- **UUID**: Universally Unique Identifier for contract URLs
- **LGPD**: Lei Geral de Proteção de Dados - Brazilian data protection law
- **Latitude**: Geographic coordinate specifying north-south position
- **Longitude**: Geographic coordinate specifying east-west position
- **Location_Pin**: Interactive map marker indicating precise installation site location

## Requirements

### Requirement 1: Contract Creation Wizard

**User Story:** As an Admin, I want to create service contracts through a guided multi-step wizard, so that I can efficiently capture all required contract information with validation.

#### Acceptance Criteria

1. WHEN an Admin starts contract creation, THE System SHALL display a multi-step wizard with progress indication
2. WHEN an Admin enters a CPF, THE System SHALL validate it using the standard CPF algorithm before proceeding
3. WHEN an Admin enters a CEP, THE System SHALL query the ViaCEP API and auto-fill address fields
4. WHEN the ViaCEP API returns valid data, THE System SHALL populate street, neighborhood, city, and state fields
5. IF the ViaCEP API fails or returns invalid data, THEN THE System SHALL allow manual address entry
6. WHEN an Admin adds equipment items, THE System SHALL store them as JSONB with name, quantity, and unit fields
7. WHEN an Admin selects service scope items, THE System SHALL include 6 default services with customization capability
8. WHEN an Admin enters financial values, THE System SHALL format them as BRL currency
9. WHEN an Admin completes all wizard steps, THE System SHALL create a Contract record with status "pending_signature"
10. THE System SHALL generate a unique non-enumerable UUID for each Contract

### Requirement 2: CPF Validation

**User Story:** As an Admin, I want CPF numbers to be validated automatically, so that I can ensure data accuracy and prevent invalid contractor identification.

#### Acceptance Criteria

1. WHEN a CPF is submitted, THE System SHALL verify it has exactly 11 digits
2. WHEN a CPF is submitted, THE System SHALL reject known invalid patterns (all same digits like "111.111.111-11")
3. WHEN a CPF is submitted, THE System SHALL calculate and verify both check digits using the standard algorithm
4. IF a CPF fails validation, THEN THE System SHALL display a descriptive error message
5. THE System SHALL accept CPF input with or without formatting characters (dots and hyphens)

### Requirement 3: Address Auto-Completion

**User Story:** As an Admin, I want address fields to auto-fill when I enter a CEP, so that I can reduce data entry time and minimize errors.

#### Acceptance Criteria

1. WHEN an Admin enters a valid 8-digit CEP, THE System SHALL query the ViaCEP API within 3 seconds
2. WHEN the ViaCEP API returns success, THE System SHALL populate street, neighborhood, city, and state fields
3. WHEN the ViaCEP API returns an error, THE System SHALL display an error message and enable manual entry
4. WHEN address fields are auto-filled, THE System SHALL allow Admins to edit any field
5. THE System SHALL accept CEP input with or without formatting characters (hyphen)

### Requirement 3A: Geographic Location Capture

**User Story:** As an Admin, I want to capture the precise geographic location of the installation site using Google Maps, so that I can provide accurate coordinates for 3D mockups and site planning.

#### Acceptance Criteria

1. WHEN an Admin enters an address, THE System SHALL display an interactive Google Maps component
2. WHEN the address is auto-filled via ViaCEP, THE System SHALL automatically center the map on the approximate location
3. WHEN an Admin interacts with the map, THE System SHALL allow placement of a location pin
4. WHEN a location pin is placed, THE System SHALL capture latitude and longitude coordinates
5. WHEN coordinates are captured, THE System SHALL store them with the contract record
6. WHEN an Admin manually adjusts the pin, THE System SHALL update the stored coordinates
7. THE System SHALL validate that coordinates are within Brazil's geographic boundaries

### Requirement 4: Digital Signature - GOV.BR Integration

**User Story:** As a Contractor, I want to sign contracts using my GOV.BR account, so that I can provide legally binding Advanced signatures.

#### Acceptance Criteria

1. WHEN a Contractor chooses GOV.BR signature, THE System SHALL redirect to GOV.BR OAuth authorization
2. WHEN GOV.BR OAuth succeeds, THE System SHALL receive the Contractor's verified identity
3. WHEN a signature is completed, THE System SHALL generate a SHA-256 hash of the contract content
4. WHEN a signature is completed, THE System SHALL store the hash, timestamp, and GOV.BR user ID in Audit_Log
5. WHEN a signature is completed, THE System SHALL update Contract status to "signed"
6. THE System SHALL comply with MP 2.200-2/2001 requirements for Advanced signatures

### Requirement 5: Digital Signature - Email Authentication

**User Story:** As a Contractor, I want to sign contracts using email verification, so that I can provide Admitted signatures when GOV.BR is unavailable.

#### Acceptance Criteria

1. WHEN a Contractor chooses email signature, THE System SHALL send a verification code to the provided email
2. WHEN a Contractor enters the correct verification code, THE System SHALL authenticate the signature
3. WHEN an email signature is completed, THE System SHALL generate a SHA-256 hash of the contract content
4. WHEN an email signature is completed, THE System SHALL store the hash, timestamp, email, and IP address in Audit_Log
5. WHEN an email signature is completed, THE System SHALL update Contract status to "signed"
6. THE System SHALL comply with Law 14.063/2020 requirements for Admitted signatures

### Requirement 6: Contract Hash Integrity

**User Story:** As a system administrator, I want contract content to be cryptographically hashed, so that I can prove document integrity for legal purposes.

#### Acceptance Criteria

1. WHEN a Contract is signed, THE System SHALL generate a SHA-256 hash of all contract content
2. WHEN generating a hash, THE System SHALL include contractor data, project specifications, equipment list, and service scope
3. WHEN a hash is generated, THE System SHALL store it immutably in Audit_Log
4. WHEN a Contract is retrieved, THE System SHALL recalculate the hash and compare it to the stored value
5. IF hash verification fails, THEN THE System SHALL flag the Contract as potentially tampered

### Requirement 7: Public Contract Viewing

**User Story:** As a Contractor, I want to view my contract before signing through a secure public URL, so that I can review all terms and conditions.

#### Acceptance Criteria

1. WHEN a Contract is created, THE System SHALL generate a unique UUID-based URL
2. WHEN a Contractor accesses the public URL, THE System SHALL display the contract in a mobile-first interface
3. WHEN displaying a contract, THE System SHALL show all contractor data, project specifications, equipment, and services
4. WHEN displaying a contract, THE System SHALL apply dark theme styling with solar-inspired accents
5. WHEN a Contract status is "signed", THE System SHALL display signature verification information
6. THE System SHALL prevent enumeration attacks by using non-sequential UUIDs

### Requirement 8: PDF Generation

**User Story:** As an Admin, I want to generate professional PDF contracts, so that I can provide archival copies and printed documents.

#### Acceptance Criteria

1. WHEN an Admin requests a PDF, THE System SHALL generate a document with company branding
2. WHEN generating a PDF, THE System SHALL include all contract data in a professional layout
3. WHEN generating a PDF, THE System SHALL create dynamic tables for equipment and services
4. WHEN generating a PDF, THE System SHALL include signature verification codes or hashes
5. WHEN content exceeds one page, THE System SHALL automatically wrap to additional pages
6. THE System SHALL format currency values as BRL with proper locale formatting

### Requirement 9: Administrative Dashboard

**User Story:** As an Admin, I want to view and search all contracts, so that I can manage the contract portfolio efficiently.

#### Acceptance Criteria

1. WHEN an Admin accesses the dashboard, THE System SHALL display a list of all contracts
2. WHEN an Admin searches by name, THE System SHALL filter contracts matching the contractor name
3. WHEN an Admin searches by CPF, THE System SHALL filter contracts matching the CPF
4. WHEN an Admin searches by status, THE System SHALL filter contracts matching the status
5. WHEN an Admin views a contract, THE System SHALL display all contract details and audit logs
6. WHEN an Admin requests a PDF download, THE System SHALL generate and serve the PDF file

### Requirement 10: Audit Trail

**User Story:** As a compliance officer, I want comprehensive audit logs for all signature events, so that I can provide legal evidence of contract execution.

#### Acceptance Criteria

1. WHEN any signature event occurs, THE System SHALL create an immutable Audit_Log entry
2. WHEN creating an Audit_Log entry, THE System SHALL record timestamp, IP address, and signature method
3. WHEN creating an Audit_Log entry for GOV.BR signatures, THE System SHALL record the GOV.BR user ID
4. WHEN creating an Audit_Log entry for email signatures, THE System SHALL record the email address
5. WHEN creating an Audit_Log entry, THE System SHALL record the Contract_Hash
6. THE System SHALL prevent modification or deletion of Audit_Log entries

### Requirement 11: Security and Access Control

**User Story:** As a security administrator, I want robust access controls and encryption, so that I can protect sensitive contractor data and comply with LGPD.

#### Acceptance Criteria

1. WHEN accessing contract data, THE System SHALL enforce Row Level Security policies
2. WHEN an Admin authenticates, THE System SHALL require multi-factor authentication
3. WHEN data is transmitted, THE System SHALL use TLS 1.3 encryption
4. WHEN data is stored, THE System SHALL use AES-256 encryption at rest
5. WHEN API requests exceed rate limits, THE System SHALL block requests using Cloudflare WAF
6. THE System SHALL comply with LGPD data protection requirements

### Requirement 12: Equipment and Service Management

**User Story:** As an Admin, I want to add dynamic equipment lists and service scopes to contracts, so that I can customize each contract to the specific installation.

#### Acceptance Criteria

1. WHEN an Admin adds equipment, THE System SHALL store name, quantity, and unit in JSONB format
2. WHEN an Admin adds equipment, THE System SHALL allow unlimited items per contract
3. WHEN an Admin selects services, THE System SHALL provide 6 default service options
4. WHEN an Admin selects services, THE System SHALL allow custom service descriptions
5. WHEN displaying equipment or services, THE System SHALL render them in a formatted table

### Requirement 13: Financial Information Management

**User Story:** As an Admin, I want to record contract financial details, so that I can track project values and payment methods.

#### Acceptance Criteria

1. WHEN an Admin enters a contract value, THE System SHALL validate it as a positive number
2. WHEN an Admin enters a contract value, THE System SHALL format it as BRL currency
3. WHEN an Admin selects a payment method, THE System SHALL offer PIX, cash, and credit options
4. WHEN displaying financial information, THE System SHALL show values with proper BRL formatting
5. THE System SHALL store financial values with decimal precision for currency calculations

### Requirement 14: Database Schema and Migrations

**User Story:** As a developer, I want declarative database schema management, so that I can version control and deploy schema changes reliably.

#### Acceptance Criteria

1. THE System SHALL define profiles table for Admin users
2. THE System SHALL define contracts table with contractor data, project specs, and status fields
3. THE System SHALL define contract_items table for equipment lists
4. THE System SHALL define audit_logs table for signature events
5. WHEN schema changes are needed, THE System SHALL use Supabase CLI migrations
6. THE System SHALL enforce foreign key relationships between tables

### Requirement 15: Deployment and Performance

**User Story:** As a DevOps engineer, I want automated deployment with edge caching, so that I can deliver fast global performance and reliable updates.

#### Acceptance Criteria

1. WHEN code is pushed to GitHub, THE System SHALL trigger CI/CD pipeline
2. WHEN CI/CD runs, THE System SHALL create preview deployments for pull requests
3. WHEN deploying to production, THE System SHALL use Cloudflare Pages with edge caching
4. WHEN serving static assets, THE System SHALL leverage Cloudflare CDN
5. WHEN environment variables change, THE System SHALL update them without code deployment
6. THE System SHALL use @cloudflare/next-on-pages adapter for Next.js 15 compatibility
