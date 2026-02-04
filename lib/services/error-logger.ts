/**
 * Error Logging Service
 * 
 * Centralized error logging with structured data for monitoring and debugging.
 * Supports different log levels and error categorization.
 * 
 * Requirements: All error handling requirements
 */

export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  NETWORK = 'network',
  BUSINESS_LOGIC = 'business_logic',
  UNKNOWN = 'unknown',
}

export interface ErrorLogEntry {
  level: ErrorLevel;
  category: ErrorCategory;
  message: string;
  error?: Error;
  context?: Record<string, any>;
  timestamp: string;
  userId?: string;
  requestId?: string;
  url?: string;
  method?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Logs an error with structured data
 */
export function logError(entry: Omit<ErrorLogEntry, 'timestamp'>): void {
  const logEntry: ErrorLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // Log to console with appropriate level
  const consoleMethod = getConsoleMethod(entry.level);
  consoleMethod('[ERROR LOG]', JSON.stringify(logEntry, null, 2));

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    sendToMonitoringService(logEntry);
  }

  // Send alerts for critical errors
  if (entry.level === ErrorLevel.CRITICAL) {
    sendCriticalAlert(logEntry);
  }
}

/**
 * Gets the appropriate console method for the error level
 */
function getConsoleMethod(level: ErrorLevel): typeof console.log {
  switch (level) {
    case ErrorLevel.INFO:
      return console.info;
    case ErrorLevel.WARNING:
      return console.warn;
    case ErrorLevel.ERROR:
    case ErrorLevel.CRITICAL:
      return console.error;
    default:
      return console.log;
  }
}

/**
 * Sends error to monitoring service (placeholder for integration)
 */
// @ts-expect-error - TODO: Implement monitoring service integration
function sendToMonitoringService(entry: ErrorLogEntry): void {
  // TODO: Integrate with monitoring service (e.g., Sentry, DataDog, LogRocket)
  // Example:
  // Sentry.captureException(entry.error, {
  //   level: entry.level,
  //   tags: { category: entry.category },
  //   extra: entry.context,
  // });
}

/**
 * Sends critical error alerts (placeholder for integration)
 */
function sendCriticalAlert(entry: ErrorLogEntry): void {
  // TODO: Integrate with alerting service (e.g., PagerDuty, Slack, email)
  console.error('[CRITICAL ALERT]', entry);
}

/**
 * Helper function to log validation errors
 */
export function logValidationError(
  message: string,
  context?: Record<string, any>
): void {
  logError({
    level: ErrorLevel.WARNING,
    category: ErrorCategory.VALIDATION,
    message,
    context,
  });
}

/**
 * Helper function to log authentication errors
 */
export function logAuthError(
  message: string,
  userId?: string,
  context?: Record<string, any>
): void {
  logError({
    level: ErrorLevel.WARNING,
    category: ErrorCategory.AUTHENTICATION,
    message,
    userId,
    context,
  });
}

/**
 * Helper function to log database errors
 */
export function logDatabaseError(
  message: string,
  error: Error,
  context?: Record<string, any>
): void {
  logError({
    level: ErrorLevel.CRITICAL,
    category: ErrorCategory.DATABASE,
    message,
    error,
    context,
  });
}

/**
 * Helper function to log external API errors
 */
export function logExternalAPIError(
  apiName: string,
  message: string,
  error?: Error,
  context?: Record<string, any>
): void {
  logError({
    level: ErrorLevel.ERROR,
    category: ErrorCategory.EXTERNAL_API,
    message: `${apiName}: ${message}`,
    error,
    context,
  });
}

/**
 * Helper function to log business logic errors
 */
export function logBusinessLogicError(
  message: string,
  context?: Record<string, any>
): void {
  logError({
    level: ErrorLevel.ERROR,
    category: ErrorCategory.BUSINESS_LOGIC,
    message,
    context,
  });
}

/**
 * Creates a request context object for error logging
 */
export function createRequestContext(request: Request): Record<string, any> {
  return {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  };
}
