/**
 * Zod Validation Schemas for the Photovoltaic Contract System
 * 
 * This module provides Zod schemas for form validation throughout the application.
 * Schemas integrate with existing validation utilities (CPF, CEP, currency) and
 * include coordinate validation for Brazilian geographic boundaries.
 * 
 * Requirements: 1.1, 12.1, 3A.4, 3A.5, 3A.7
 */

import { z } from 'zod';
import { validateCPF, getCPFErrorMessage } from '../validation/cpf';
import { validateCEP, getCEPErrorMessage } from '../validation/cep';

/**
 * Brazilian geographic boundaries for coordinate validation
 * Latitude: -33.75 to 5.27 (southernmost to northernmost points)
 * Longitude: -73.99 to -34.79 (westernmost to easternmost points)
 */
const BRAZIL_BOUNDS = {
  latitude: { min: -33.75, max: 5.27 },
  longitude: { min: -73.99, max: -34.79 }
} as const;

/**
 * Coordinates Schema
 * Validates latitude and longitude are within Brazil's geographic boundaries
 * Validates: Requirements 3A.4, 3A.5, 3A.7
 */
export const coordinatesSchema = z.object({
  latitude: z
    .number()
    .min(BRAZIL_BOUNDS.latitude.min, 'Latitude must be within Brazil boundaries')
    .max(BRAZIL_BOUNDS.latitude.max, 'Latitude must be within Brazil boundaries')
    .refine(
      (val) => {
        // Ensure 8 decimal places precision
        const decimalPlaces = val.toString().split('.')[1]?.length || 0;
        return decimalPlaces <= 8;
      },
      { message: 'Latitude must have at most 8 decimal places' }
    ),
  longitude: z
    .number()
    .min(BRAZIL_BOUNDS.longitude.min, 'Longitude must be within Brazil boundaries')
    .max(BRAZIL_BOUNDS.longitude.max, 'Longitude must be within Brazil boundaries')
    .refine(
      (val) => {
        // Ensure 8 decimal places precision
        const decimalPlaces = val.toString().split('.')[1]?.length || 0;
        return decimalPlaces <= 8;
      },
      { message: 'Longitude must have at most 8 decimal places' }
    )
});

/**
 * CPF Schema
 * Validates Brazilian CPF using standard algorithm
 * Validates: Requirements 2.1, 2.2, 2.3, 2.5
 */
export const cpfSchema = z
  .string()
  .min(1, 'CPF is required')
  .refine(validateCPF, (val) => ({
    message: getCPFErrorMessage(val) || 'Invalid CPF'
  }));

/**
 * CEP Schema
 * Validates Brazilian postal code format
 * Validates: Requirements 3.5
 */
export const cepSchema = z
  .string()
  .min(1, 'CEP is required')
  .refine(validateCEP, (val) => ({
    message: getCEPErrorMessage(val) || 'Invalid CEP'
  }));

/**
 * Positive Currency Value Schema
 * Validates that a number is positive (for contract values, kWp, etc.)
 * Validates: Requirements 13.1
 */
export const positiveValueSchema = z
  .number()
  .positive('Value must be greater than zero')
  .refine(
    (val) => {
      // Ensure 2 decimal places precision for currency
      const decimalPlaces = val.toString().split('.')[1]?.length || 0;
      return decimalPlaces <= 2;
    },
    { message: 'Value must have at most 2 decimal places' }
  );

/**
 * Service Item Schema
 * Validates service scope items
 * Validates: Requirements 1.7, 12.3, 12.4
 */
export const serviceItemSchema = z.object({
  description: z.string().min(1, 'Service description is required'),
  included: z.boolean()
});

/**
 * Equipment Item Schema (for form input)
 * Validates equipment list items before database insertion
 * Validates: Requirements 1.6, 12.1, 12.2
 */
export const equipmentItemInputSchema = z.object({
  itemName: z.string().min(1, 'Item name is required').max(200, 'Item name is too long'),
  quantity: z.number().int('Quantity must be a whole number').positive('Quantity must be greater than zero'),
  unit: z.string().min(1, 'Unit is required').max(20, 'Unit is too long'),
  sortOrder: z.number().int().nonnegative().default(0)
});

/**
 * Equipment Item Schema (with database fields)
 * Includes id and contractId for database records
 */
export const equipmentItemSchema = equipmentItemInputSchema.extend({
  id: z.string().uuid(),
  contractId: z.string().uuid(),
  createdAt: z.date().optional()
});

/**
 * Payment Method Schema
 * Validates payment method selection
 * Validates: Requirements 13.3
 */
export const paymentMethodSchema = z.enum(['pix', 'cash', 'credit'], {
  errorMap: () => ({ message: 'Payment method must be PIX, cash, or credit' })
});

/**
 * Contract Status Schema
 * Validates contract status values
 */
export const contractStatusSchema = z.enum(['pending_signature', 'signed', 'cancelled'], {
  errorMap: () => ({ message: 'Invalid contract status' })
});

/**
 * Base Contract Draft Schema (without refinements)
 * Used as a base for extending
 */
const contractDraftBaseSchema = z.object({
  // Contractor Information
  contractorName: z
    .string()
    .min(3, 'Contractor name must be at least 3 characters')
    .max(200, 'Contractor name is too long'),
  contractorCPF: cpfSchema,
  contractorEmail: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  contractorPhone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
  
  // Installation Address
  addressCEP: cepSchema,
  addressStreet: z.string().min(1, 'Street is required').max(200, 'Street is too long'),
  addressNumber: z.string().min(1, 'Number is required').max(20, 'Number is too long'),
  addressComplement: z.string().max(100, 'Complement is too long').optional().or(z.literal('')),
  addressNeighborhood: z.string().min(1, 'Neighborhood is required').max(100, 'Neighborhood is too long'),
  addressCity: z.string().min(1, 'City is required').max(100, 'City is too long'),
  addressState: z.string().length(2, 'State must be 2 characters (e.g., SP, RJ)'),
  
  // Geographic Location (optional but validated if provided)
  locationLatitude: z.number().optional(),
  locationLongitude: z.number().optional(),
  
  // Project Specifications
  projectKWp: positiveValueSchema.refine(
    (val) => val <= 10000,
    { message: 'Solar capacity seems unreasonably high' }
  ),
  installationDate: z.date().optional(),
  
  // Services and Equipment
  services: z.array(serviceItemSchema).min(1, 'At least one service must be selected'),
  items: z.array(equipmentItemInputSchema).min(1, 'At least one equipment item is required'),
  
  // Financial Information
  contractValue: positiveValueSchema,
  paymentMethod: paymentMethodSchema
});

/**
 * Contract Draft Schema
 * Validates the complete contract creation form data
 * Used in the multi-step wizard for form validation
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 1.8, 3A.4, 3A.5
 */
export const contractDraftSchema = contractDraftBaseSchema.refine(
  (data) => {
    // If one coordinate is provided, both must be provided
    const hasLat = data.locationLatitude !== undefined;
    const hasLng = data.locationLongitude !== undefined;
    return hasLat === hasLng;
  },
  {
    message: 'Both latitude and longitude must be provided together',
    path: ['locationLatitude']
  }
).refine(
  (data) => {
    // If coordinates are provided, validate they're within Brazil
    if (data.locationLatitude !== undefined && data.locationLongitude !== undefined) {
      const latValid = 
        data.locationLatitude >= BRAZIL_BOUNDS.latitude.min &&
        data.locationLatitude <= BRAZIL_BOUNDS.latitude.max;
      const lngValid = 
        data.locationLongitude >= BRAZIL_BOUNDS.longitude.min &&
        data.locationLongitude <= BRAZIL_BOUNDS.longitude.max;
      return latValid && lngValid;
    }
    return true;
  },
  {
    message: 'Coordinates must be within Brazil boundaries',
    path: ['locationLatitude']
  }
);

/**
 * Contract Schema
 * Validates complete contract records from the database
 * Includes all fields from ContractDraft plus database metadata
 */
export const contractSchema = contractDraftBaseSchema.extend({
  id: z.string().uuid(),
  uuid: z.string().uuid(),
  status: contractStatusSchema,
  contractHash: z.string().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  signedAt: z.date().optional()
}).refine(
  (data) => {
    // If one coordinate is provided, both must be provided
    const hasLat = data.locationLatitude !== undefined;
    const hasLng = data.locationLongitude !== undefined;
    return hasLat === hasLng;
  },
  {
    message: 'Both latitude and longitude must be provided together',
    path: ['locationLatitude']
  }
).refine(
  (data) => {
    // If coordinates are provided, validate they're within Brazil
    if (data.locationLatitude !== undefined && data.locationLongitude !== undefined) {
      const latValid = 
        data.locationLatitude >= BRAZIL_BOUNDS.latitude.min &&
        data.locationLatitude <= BRAZIL_BOUNDS.latitude.max;
      const lngValid = 
        data.locationLongitude >= BRAZIL_BOUNDS.longitude.min &&
        data.locationLongitude <= BRAZIL_BOUNDS.longitude.max;
      return latValid && lngValid;
    }
    return true;
  },
  {
    message: 'Coordinates must be within Brazil boundaries',
    path: ['locationLatitude']
  }
);

/**
 * Audit Log Event Type Schema
 */
export const auditLogEventTypeSchema = z.enum([
  'signature_initiated',
  'signature_completed',
  'signature_failed'
], {
  errorMap: () => ({ message: 'Invalid audit log event type' })
});

/**
 * Signature Method Schema
 */
export const signatureMethodSchema = z.enum(['govbr', 'email'], {
  errorMap: () => ({ message: 'Signature method must be GOV.BR or email' })
});

/**
 * Audit Log Schema
 * Validates audit log records
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 */
export const auditLogSchema = z.object({
  id: z.string().uuid(),
  contractId: z.string().uuid(),
  eventType: auditLogEventTypeSchema,
  signatureMethod: signatureMethodSchema,
  contractHash: z.string().min(64, 'Contract hash must be SHA-256 (64 characters)'),
  signerIdentifier: z.string().optional(),
  ipAddress: z.string().ip('Invalid IP address'),
  userAgent: z.string().optional(),
  createdAt: z.date()
});

/**
 * Signature Result Schema
 * Validates signature operation responses
 * Validates: Requirements 4.5, 5.5
 */
export const signatureResultSchema = z.object({
  success: z.boolean(),
  contractId: z.string().uuid(),
  signedAt: z.date(),
  contractHash: z.string().min(64, 'Contract hash must be SHA-256 (64 characters)'),
  error: z.string().optional()
});

/**
 * ViaCEP Response Schema
 * Validates responses from the ViaCEP API
 * Validates: Requirements 3.1, 3.2
 */
export const viaCEPResponseSchema = z.object({
  cep: z.string(),
  logradouro: z.string(),
  complemento: z.string(),
  bairro: z.string(),
  localidade: z.string(),
  uf: z.string(),
  erro: z.boolean().optional()
});

/**
 * Address Data Schema
 * Validates normalized address data from ViaCEP
 */
export const addressDataSchema = z.object({
  street: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string()
});

/**
 * Google Maps Config Schema
 * Validates Google Maps configuration
 */
export const googleMapsConfigSchema = z.object({
  apiKey: z.string().min(1, 'Google Maps API key is required'),
  defaultCenter: coordinatesSchema,
  defaultZoom: z.number().int().min(1).max(21)
});

/**
 * Contract Filters Schema
 * Validates search and filter parameters for contract listing
 * Validates: Requirements 9.2, 9.3, 9.4
 */
export const contractFiltersSchema = z.object({
  status: contractStatusSchema.optional(),
  searchQuery: z.string().optional(),
  searchField: z.enum(['name', 'cpf']).optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  sortBy: z.enum(['created_at', 'contractor_name', 'contract_value', 'status']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

/**
 * Admin User Schema
 * Validates admin user records
 */
export const adminUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.string(),
  mfaEnabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * Email Verification Request Schema
 * Validates email signature initiation requests
 * Validates: Requirements 5.1
 */
export const emailVerificationRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  contractId: z.string().uuid('Invalid contract ID')
});

/**
 * Email Verification Code Schema
 * Validates email verification code submission
 * Validates: Requirements 5.2
 */
export const emailVerificationCodeSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d{6}$/, 'Verification code must be numeric'),
  contractId: z.string().uuid('Invalid contract ID')
});

/**
 * Type exports inferred from schemas
 * These provide TypeScript types that match the Zod schemas
 */
export type CoordinatesInput = z.infer<typeof coordinatesSchema>;
export type ServiceItemInput = z.infer<typeof serviceItemSchema>;
export type EquipmentItemInput = z.infer<typeof equipmentItemInputSchema>;
export type ContractDraftInput = z.infer<typeof contractDraftSchema>;
export type ContractInput = z.infer<typeof contractSchema>;
export type AuditLogInput = z.infer<typeof auditLogSchema>;
export type SignatureResultInput = z.infer<typeof signatureResultSchema>;
export type ViaCEPResponseInput = z.infer<typeof viaCEPResponseSchema>;
export type AddressDataInput = z.infer<typeof addressDataSchema>;
export type GoogleMapsConfigInput = z.infer<typeof googleMapsConfigSchema>;
export type ContractFiltersInput = z.infer<typeof contractFiltersSchema>;
export type AdminUserInput = z.infer<typeof adminUserSchema>;
export type EmailVerificationRequestInput = z.infer<typeof emailVerificationRequestSchema>;
export type EmailVerificationCodeInput = z.infer<typeof emailVerificationCodeSchema>;
