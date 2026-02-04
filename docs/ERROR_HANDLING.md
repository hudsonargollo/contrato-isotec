# Error Handling Guide

This document describes the comprehensive error handling system implemented in the ISOTEC Photovoltaic Contract System.

## Overview

The error handling system provides:
- **Error Boundaries** for React component errors
- **Centralized Error Logging** with structured data
- **User-Friendly Error Messages** in Portuguese
- **API Error Handling** with consistent responses
- **Monitoring Integration** (ready for Sentry, DataDog, etc.)

## Components

### 1. Error Boundary (`components/error/ErrorBoundary.tsx`)

Catches React errors and displays user-friendly fallback UI.

**Usage:**
```tsx
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Catches component errors
- Logs errors to monitoring service
- Displays user-friendly error message
- Provides "Try Again" and "Go Home" actions
- Shows stack trace in development mode

### 2. Error Logger (`lib/services/error-logger.ts`)

Centralized error logging with structured data.

**Usage:**
```typescript
import { logError, ErrorLevel, ErrorCategory } from '@/lib/services/error-logger';

logError({
  level: ErrorLevel.ERROR,
  category: ErrorCategory.DATABASE,
  message: 'Failed to fetch contract',
  error: err,
  context: { contractId: '123' },
});
```

**Error Levels:**
- `INFO` - Informational messages
- `WARNING` - Warning messages
- `ERROR` - Error messages
- `CRITICAL` - Critical errors (triggers alerts)

**Error Categories:**
- `VALIDATION` - Validation errors
- `AUTHENTICATION` - Authentication errors
- `AUTHORIZATION` - Authorization errors
- `DATABASE` - Database errors
- `EXTERNAL_API` - External API errors
- `NETWORK` - Network errors
- `BUSINESS_LOGIC` - Business logic errors
- `UNKNOWN` - Unknown errors

### 3. Error Messages (`lib/errors/error-messages.ts`)

Centralized user-friendly error messages in Portuguese.

**Usage:**
```typescript
import { ERROR_MESSAGES, getUserFriendlyMessage } from '@/lib/errors/error-messages';

// Use predefined message
throw new Error(ERROR_MESSAGES.VALIDATION.CPF_INVALID);

// Get user-friendly message from error
const message = getUserFriendlyMessage(error);
```

### 4. API Error Handler (`lib/errors/api-error-handler.ts`)

Handles API route errors with consistent responses.

**Usage:**
```typescript
import { handleAPIError, APIError } from '@/lib/errors/api-error-handler';

export async function POST(request: Request) {
  try {
    // Your code
  } catch (error) {
    return handleAPIError(error, { requestId: '123' });
  }
}

// Throw custom API error
throw new APIError(
  ERROR_MESSAGES.CONTRACT.NOT_FOUND,
  404,
  ErrorCategory.BUSINESS_LOGIC
);
```

### 5. Global Error Pages

**Error Page (`app/error.tsx`):**
- Handles unhandled errors in the app
- Logs errors automatically
- Displays user-friendly message

**404 Page (`app/not-found.tsx`):**
- Custom 404 page
- Provides navigation options

## Error Handling Patterns

### Validation Errors

```typescript
import { ERROR_MESSAGES } from '@/lib/errors/error-messages';
import { logValidationError } from '@/lib/services/error-logger';

if (!validateCPF(cpf)) {
  logValidationError('Invalid CPF', { cpf });
  throw new Error(ERROR_MESSAGES.VALIDATION.CPF_INVALID);
}
```

### Database Errors

```typescript
import { logDatabaseError } from '@/lib/services/error-logger';
import { ERROR_MESSAGES } from '@/lib/errors/error-messages';

try {
  const { data, error } = await supabase.from('contracts').select();
  if (error) throw error;
} catch (error) {
  logDatabaseError('Failed to fetch contracts', error as Error);
  throw new Error(ERROR_MESSAGES.DATABASE.QUERY_FAILED);
}
```

### External API Errors

```typescript
import { logExternalAPIError } from '@/lib/services/error-logger';
import { ERROR_MESSAGES } from '@/lib/errors/error-messages';

try {
  const response = await fetch('https://viacep.com.br/ws/...');
  if (!response.ok) throw new Error('API request failed');
} catch (error) {
  logExternalAPIError('ViaCEP', 'Failed to fetch address', error as Error);
  throw new Error(ERROR_MESSAGES.EXTERNAL_API.VIACEP_ERROR);
}
```

### API Route Error Handling

```typescript
import { handleAPIError, APIError } from '@/lib/errors/api-error-handler';
import { ERROR_MESSAGES } from '@/lib/errors/error-messages';
import { ErrorCategory } from '@/lib/services/error-logger';

export async function POST(request: Request) {
  try {
    // Validate input
    if (!data.cpf) {
      throw new APIError(
        ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD,
        400,
        ErrorCategory.VALIDATION
      );
    }

    // Business logic
    const contract = await createContract(data);
    
    return NextResponse.json(contract);
  } catch (error) {
    return handleAPIError(error, { url: request.url });
  }
}
```

## Monitoring Integration

The error logging system is ready for integration with monitoring services:

### Sentry Integration

```typescript
// lib/services/error-logger.ts

import * as Sentry from '@sentry/nextjs';

function sendToMonitoringService(entry: ErrorLogEntry): void {
  Sentry.captureException(entry.error, {
    level: entry.level,
    tags: { category: entry.category },
    extra: entry.context,
  });
}
```

### DataDog Integration

```typescript
// lib/services/error-logger.ts

import { datadogLogs } from '@datadog/browser-logs';

function sendToMonitoringService(entry: ErrorLogEntry): void {
  datadogLogs.logger.error(entry.message, {
    error: entry.error,
    category: entry.category,
    context: entry.context,
  });
}
```

## Testing Error Handling

### Test Error Boundary

```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('displays error message', () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument();
});
```

### Test Error Logger

```typescript
import { logError, ErrorLevel, ErrorCategory } from '@/lib/services/error-logger';

test('logs error with correct structure', () => {
  const consoleSpy = jest.spyOn(console, 'error');
  
  logError({
    level: ErrorLevel.ERROR,
    category: ErrorCategory.VALIDATION,
    message: 'Test error',
  });
  
  expect(consoleSpy).toHaveBeenCalled();
});
```

## Best Practices

1. **Always use predefined error messages** from `ERROR_MESSAGES`
2. **Log errors with appropriate level and category**
3. **Include context** for debugging (user ID, request ID, etc.)
4. **Never expose sensitive data** in error messages
5. **Use APIError** for API routes with appropriate status codes
6. **Wrap components** with ErrorBoundary for better UX
7. **Test error scenarios** in your code

## Error Response Format

All API errors follow this format:

```json
{
  "error": "User-friendly error message",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Support

For questions about error handling, contact the development team.
