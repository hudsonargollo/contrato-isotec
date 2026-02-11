/**
 * Core TypeScript types for the Photovoltaic Contract System
 * Based on the design document specifications
 */

// Re-export Zod schemas and their inferred types
export * from './schemas';

// Re-export CRM types
export * from './crm';

// Re-export Invoice types
export * from './invoice';

// Contract Types
export interface Contract {
  id: string;
  uuid: string;
  
  // Contractor Information
  contractorName: string;
  contractorCPF: string;
  contractorEmail?: string;
  contractorPhone?: string;
  
  // Installation Address
  addressCEP: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  
  // Geographic Location (for 3D mockups)
  locationLatitude?: number;
  locationLongitude?: number;
  
  // Project Specifications
  projectKWp: number;
  installationDate?: Date;
  
  // Services and Items
  services: ServiceItem[];
  items?: EquipmentItem[];
  
  // Financial Information
  contractValue: number;
  paymentMethod: 'pix' | 'cash' | 'credit';
  
  // Status and Metadata
  status: 'pending_signature' | 'signed' | 'cancelled';
  contractHash?: string;
  
  // Audit Fields
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  signedAt?: Date;
}

export interface EquipmentItem {
  id: string;
  contractId: string;
  itemName: string;
  quantity: number;
  unit: string;
  sortOrder: number;
  createdAt?: Date;
}

export interface ServiceItem {
  description: string;
  included: boolean;
}

export interface AuditLog {
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
export interface ContractDraft {
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
export interface SignatureResult {
  success: boolean;
  contractId: string;
  signedAt: Date;
  contractHash: string;
  error?: string;
}

export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GoogleMapsConfig {
  apiKey: string;
  defaultCenter: Coordinates;
  defaultZoom: number;
}

// Admin User Types
export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Search and Filter Types
export interface ContractFilters {
  status?: 'pending_signature' | 'signed' | 'cancelled';
  searchQuery?: string;
  searchField?: 'name' | 'cpf';
  page?: number;
  limit?: number;
}

export interface PaginatedContracts {
  contracts: Contract[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
