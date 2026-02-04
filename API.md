# API Documentation

## Base URL

Development: `http://localhost:3000/api`
Production: `https://your-domain.com/api`

## Authentication

Most endpoints require admin authentication via Supabase Auth.

**Headers:**
```
Authorization: Bearer <supabase_jwt_token>
```

Public endpoints (no auth required):
- `POST /signatures/email/send`
- `POST /signatures/email/verify`

## Endpoints

### Contracts

#### Create Contract

```http
POST /api/contracts
```

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "contractorName": "João Silva",
  "contractorCPF": "12345678909",
  "contractorEmail": "joao@example.com",
  "contractorPhone": "(11) 98765-4321",
  "addressCEP": "01310100",
  "addressStreet": "Avenida Paulista",
  "addressNumber": "1000",
  "addressComplement": "Apto 101",
  "addressNeighborhood": "Bela Vista",
  "addressCity": "São Paulo",
  "addressState": "SP",
  "locationLatitude": -23.5614548,
  "locationLongitude": -46.6558819,
  "projectKWp": 5.5,
  "installationDate": "2024-03-15",
  "services": [
    {
      "description": "Instalação de painéis solares",
      "included": true
    },
    {
      "description": "Configuração do inversor",
      "included": true
    }
  ],
  "items": [
    {
      "itemName": "Painel Solar 550W",
      "quantity": 10,
      "unit": "un",
      "sortOrder": 0
    },
    {
      "itemName": "Inversor 5kW",
      "quantity": 1,
      "unit": "un",
      "sortOrder": 1
    }
  ],
  "contractValue": 27500.00,
  "paymentMethod": "pix"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "contract": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "uuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "createdAt": "2024-02-04T10:30:00Z",
    "status": "pending_signature"
  }
}
```

**Errors:**
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - User is not an admin
- `400 Bad Request` - Validation errors
- `500 Internal Server Error` - Server error

---

#### List Contracts

```http
GET /api/contracts?status=pending_signature&search=João&searchField=name&page=1&limit=20
```

**Authentication:** Required (Admin)

**Query Parameters:**
- `status` (optional) - Filter by status: `pending_signature`, `signed`, `cancelled`
- `search` (optional) - Search query
- `searchField` (optional) - Field to search: `name`, `cpf`
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)

**Response:** `200 OK`
```json
{
  "success": true,
  "contracts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "uuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "contractor_name": "João Silva",
      "contractor_cpf": "12345678909",
      "contractor_email": "joao@example.com",
      "project_kwp": "5.50",
      "contract_value": "27500.00",
      "status": "pending_signature",
      "created_at": "2024-02-04T10:30:00Z",
      "contract_items": [
        {
          "id": "...",
          "item_name": "Painel Solar 550W",
          "quantity": 10,
          "unit": "un",
          "sort_order": 0
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

#### Get Contract Details

```http
GET /api/contracts/:id
```

**Authentication:** Required (Admin)

**Path Parameters:**
- `id` - Contract ID (UUID)

**Response:** `200 OK`
```json
{
  "success": true,
  "contract": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "uuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "contractor_name": "João Silva",
    "contractor_cpf": "12345678909",
    "contractor_email": "joao@example.com",
    "contractor_phone": "(11) 98765-4321",
    "address_cep": "01310100",
    "address_street": "Avenida Paulista",
    "address_number": "1000",
    "address_complement": "Apto 101",
    "address_neighborhood": "Bela Vista",
    "address_city": "São Paulo",
    "address_state": "SP",
    "location_latitude": "-23.56145480",
    "location_longitude": "-46.65588190",
    "project_kwp": "5.50",
    "installation_date": "2024-03-15",
    "services": [
      {
        "description": "Instalação de painéis solares",
        "included": true
      }
    ],
    "contract_value": "27500.00",
    "payment_method": "pix",
    "status": "signed",
    "contract_hash": "a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    "created_by": "admin-user-id",
    "created_at": "2024-02-04T10:30:00Z",
    "updated_at": "2024-02-04T11:00:00Z",
    "signed_at": "2024-02-04T11:00:00Z",
    "contract_items": [...],
    "auditLogs": [
      {
        "id": "...",
        "event_type": "signature_completed",
        "signature_method": "email",
        "contract_hash": "a3f5b8c9...",
        "signer_identifier": "joao@example.com",
        "ip_address": "192.168.1.1",
        "created_at": "2024-02-04T11:00:00Z"
      }
    ]
  }
}
```

**Errors:**
- `404 Not Found` - Contract not found
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - User is not an admin

---

### Email Signatures

#### Send Verification Code

```http
POST /api/signatures/email/send
```

**Authentication:** Not required (Public)

**Request Body:**
```json
{
  "email": "joao@example.com",
  "contractId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Verification code sent to email",
  "expiresAt": "2024-02-04T11:15:00Z",
  "code": "123456"  // Only in development mode
}
```

**Errors:**
- `404 Not Found` - Contract not found
- `400 Bad Request` - Contract is not pending signature
- `429 Too Many Requests` - Rate limit exceeded (5 attempts per 15 minutes)

**Rate Limiting:**
- Maximum 5 code requests per contract per 15 minutes
- Returns `retryAfter` in seconds when rate limited

---

#### Verify Code and Sign

```http
POST /api/signatures/email/verify
```

**Authentication:** Not required (Public)

**Request Body:**
```json
{
  "code": "123456",
  "contractId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "contract": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "uuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "status": "signed",
    "signedAt": "2024-02-04T11:00:00Z",
    "contractHash": "a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"
  }
}
```

**Errors:**
- `400 Bad Request` - Invalid or expired code
- `429 Too Many Requests` - Maximum verification attempts exceeded (5 attempts)
- `404 Not Found` - Contract not found

**Security:**
- Codes expire after 15 minutes
- Maximum 5 verification attempts per code
- IP address and user agent logged in audit trail
- Contract hash generated using SHA-256

---

## Data Models

### Contract

```typescript
{
  id: string;                    // UUID (internal)
  uuid: string;                  // UUID (public URL)
  contractorName: string;
  contractorCPF: string;         // 11 digits, no formatting
  contractorEmail?: string;
  contractorPhone?: string;
  addressCEP: string;            // 8 digits, no formatting
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;          // 2 letters (e.g., "SP")
  locationLatitude?: number;     // -33.75 to 5.27 (Brazil bounds)
  locationLongitude?: number;    // -73.99 to -34.79 (Brazil bounds)
  projectKWp: number;            // > 0, max 2 decimal places
  installationDate?: Date;
  services: ServiceItem[];       // JSONB array
  contractValue: number;         // > 0, max 2 decimal places
  paymentMethod: 'pix' | 'cash' | 'credit';
  status: 'pending_signature' | 'signed' | 'cancelled';
  contractHash?: string;         // SHA-256 (64 chars)
  createdBy: string;             // Admin user ID
  createdAt: Date;
  updatedAt: Date;
  signedAt?: Date;
}
```

### Equipment Item

```typescript
{
  id: string;
  contractId: string;
  itemName: string;
  quantity: number;              // Integer > 0
  unit: string;                  // 'un', 'kg', 'm', 'm²', 'kWp', etc.
  sortOrder: number;
  createdAt: Date;
}
```

### Service Item

```typescript
{
  description: string;
  included: boolean;
}
```

### Audit Log

```typescript
{
  id: string;
  contractId: string;
  eventType: 'signature_initiated' | 'signature_completed' | 'signature_failed';
  signatureMethod: 'email' | 'govbr';
  contractHash: string;          // SHA-256
  signerIdentifier?: string;     // Email or GOV.BR user ID
  ipAddress: string;
  userAgent?: string;
  createdAt: Date;
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

Common HTTP status codes:
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Rate Limiting

Email signature endpoints are rate limited:
- **Send code:** 5 requests per contract per 15 minutes
- **Verify code:** 5 attempts per code

When rate limited, the response includes:
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 900  // Seconds until retry allowed
}
```

## Security

### Authentication
- Admin endpoints use Supabase JWT tokens
- Tokens must be included in `Authorization` header
- Tokens expire after configured duration

### Data Validation
- All inputs validated with Zod schemas
- CPF validated with check digit algorithm
- CEP validated as 8-digit numeric
- Coordinates validated within Brazil boundaries
- Currency values validated as positive with 2 decimal places

### Audit Trail
- All signature events logged immutably
- Logs include IP address, user agent, timestamp
- Contract hash ensures integrity
- Logs cannot be modified or deleted

### Rate Limiting
- Prevents abuse of signature endpoints
- Configurable limits per endpoint
- Returns retry-after information
