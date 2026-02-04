/**
 * ViaCEP API Client
 * 
 * This module provides integration with the ViaCEP API for Brazilian postal code lookup.
 * ViaCEP is a free Brazilian postal code (CEP) lookup service.
 * 
 * API Documentation: https://viacep.com.br/
 * 
 * Requirements: 3.1, 3.3, 1.5
 */

import { sanitizeCEP, validateCEP } from '@/lib/validation/cep';

/**
 * Raw response from ViaCEP API
 */
export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/**
 * Normalized address data for internal use
 */
export interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * Error types that can occur during CEP lookup
 */
export enum ViaCEPErrorType {
  INVALID_CEP = 'INVALID_CEP',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
}

/**
 * Custom error class for ViaCEP API errors
 */
export class ViaCEPError extends Error {
  constructor(
    public type: ViaCEPErrorType,
    message: string
  ) {
    super(message);
    this.name = 'ViaCEPError';
  }
}

/**
 * Fetches address data from ViaCEP API with timeout
 * 
 * @param cep - Brazilian postal code (with or without formatting)
 * @param timeoutMs - Request timeout in milliseconds (default: 3000)
 * @returns Promise resolving to ViaCEP response
 * @throws {ViaCEPError} If CEP is invalid, not found, or request fails
 * 
 * @example
 * const response = await fetchViaCEP('01310-100');
 * console.log(response.logradouro); // 'Avenida Paulista'
 */
export async function fetchViaCEP(
  cep: string,
  timeoutMs: number = 3000
): Promise<ViaCEPResponse> {
  // Validate CEP format before making request
  if (!validateCEP(cep)) {
    throw new ViaCEPError(
      ViaCEPErrorType.INVALID_CEP,
      'CEP must contain exactly 8 digits'
    );
  }

  const sanitized = sanitizeCEP(cep);
  const url = `https://viacep.com.br/ws/${sanitized}/json/`;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    // Check HTTP status
    if (!response.ok) {
      throw new ViaCEPError(
        ViaCEPErrorType.NETWORK_ERROR,
        `ViaCEP API returned status ${response.status}`
      );
    }

    // Parse JSON response
    const data = await response.json();

    // Check if ViaCEP returned an error (CEP not found)
    if (data.erro === true) {
      throw new ViaCEPError(
        ViaCEPErrorType.NOT_FOUND,
        'CEP not found in ViaCEP database'
      );
    }

    // Validate response structure
    if (!isValidViaCEPResponse(data)) {
      throw new ViaCEPError(
        ViaCEPErrorType.INVALID_RESPONSE,
        'ViaCEP API returned invalid response format'
      );
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ViaCEPError(
        ViaCEPErrorType.TIMEOUT,
        'ViaCEP API request timed out after 3 seconds'
      );
    }

    // Re-throw ViaCEPError instances
    if (error instanceof ViaCEPError) {
      throw error;
    }

    // Handle other network errors
    throw new ViaCEPError(
      ViaCEPErrorType.NETWORK_ERROR,
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validates that a ViaCEP response has all required fields
 * 
 * @param data - Response data to validate
 * @returns true if response is valid, false otherwise
 */
function isValidViaCEPResponse(data: any): data is ViaCEPResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.cep === 'string' &&
    typeof data.logradouro === 'string' &&
    typeof data.bairro === 'string' &&
    typeof data.localidade === 'string' &&
    typeof data.uf === 'string'
  );
}

/**
 * Normalizes ViaCEP response to internal AddressData format
 * 
 * Converts ViaCEP field names to more readable English names:
 * - logradouro → street
 * - bairro → neighborhood
 * - localidade → city
 * - uf → state
 * 
 * @param response - ViaCEP API response
 * @returns Normalized address data
 * 
 * @example
 * const response = await fetchViaCEP('01310-100');
 * const address = normalizeAddress(response);
 * console.log(address.street); // 'Avenida Paulista'
 * console.log(address.city); // 'São Paulo'
 */
export function normalizeAddress(response: ViaCEPResponse): AddressData {
  return {
    street: response.logradouro,
    neighborhood: response.bairro,
    city: response.localidade,
    state: response.uf,
  };
}

/**
 * Looks up address by CEP and returns normalized data
 * 
 * This is a convenience function that combines fetchViaCEP and normalizeAddress.
 * 
 * @param cep - Brazilian postal code (with or without formatting)
 * @returns Promise resolving to normalized address data, or null if lookup fails
 * 
 * @example
 * try {
 *   const address = await lookupCEP('01310-100');
 *   if (address) {
 *     console.log(`${address.street}, ${address.city} - ${address.state}`);
 *   }
 * } catch (error) {
 *   if (error instanceof ViaCEPError) {
 *     console.error(`CEP lookup failed: ${error.message}`);
 *   }
 * }
 */
export async function lookupCEP(cep: string): Promise<AddressData | null> {
  try {
    const response = await fetchViaCEP(cep);
    return normalizeAddress(response);
  } catch (error) {
    // Return null for any error - caller can decide how to handle
    return null;
  }
}

/**
 * Gets a user-friendly error message for ViaCEP errors
 * 
 * @param error - ViaCEPError instance
 * @returns User-friendly error message
 * 
 * @example
 * try {
 *   await fetchViaCEP('invalid');
 * } catch (error) {
 *   if (error instanceof ViaCEPError) {
 *     console.error(getViaCEPErrorMessage(error));
 *   }
 * }
 */
export function getViaCEPErrorMessage(error: ViaCEPError): string {
  switch (error.type) {
    case ViaCEPErrorType.INVALID_CEP:
      return 'CEP must contain exactly 8 digits';
    case ViaCEPErrorType.NOT_FOUND:
      return 'CEP not found. Please verify the postal code or enter address manually.';
    case ViaCEPErrorType.TIMEOUT:
      return 'Address lookup timed out. Please enter address manually.';
    case ViaCEPErrorType.NETWORK_ERROR:
      return 'Unable to connect to address lookup service. Please enter address manually.';
    case ViaCEPErrorType.INVALID_RESPONSE:
      return 'Address lookup service returned invalid data. Please enter address manually.';
    default:
      return 'An error occurred during address lookup. Please enter address manually.';
  }
}
