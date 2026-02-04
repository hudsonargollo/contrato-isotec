/**
 * API Error Handler
 * 
 * Centralized error handling for API routes.
 * Provides consistent error responses and logging.
 * 
 * Requirements: All error handling requirements
 */

import { NextResponse } from 'next/server';
import { logError, ErrorLevel, ErrorCategory } from '@/lib/services/error-logger';
import { ERROR_MESSAGES, createErrorResponse } from './error-messages';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public category: ErrorCategory = ErrorCategory.UNKNOWN
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Handles API errors and returns appropriate response
 */
export function handleAPIError(error: unknown, context?: Record<string, any>): NextResponse {
  // Handle known API errors
  if (error instanceof APIError) {
    logError({
      level: error.statusCode >= 500 ? ErrorLevel.ERROR : ErrorLevel.WARNING,
      category: error.category,
      message: error.message,
      error,
      context,
    });

    return NextResponse.json(
      createErrorResponse(error.message, error.statusCode),
      { status: error.statusCode }
    );
  }

  // Handle generic errors
  const message = error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR;
  
  logError({
    level: ErrorLevel.ERROR,
    category: ErrorCategory.UNKNOWN,
    message,
    error: error instanceof Error ? error : undefined,
    context,
  });

  return NextResponse.json(
    createErrorResponse(ERROR_MESSAGES.GENERIC.SERVER_ERROR, 500),
    { status: 500 }
  );
}
