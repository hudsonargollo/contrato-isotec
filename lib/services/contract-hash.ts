/**
 * Contract Hashing Service
 * 
 * Provides cryptographic hashing functionality for contract integrity verification.
 * Implements SHA-256 hashing with deterministic serialization to ensure:
 * - Same content always produces the same hash (determinism)
 * - Any field change produces a different hash (sensitivity)
 * - Hashes can be verified by recalculating and comparing
 * 
 * Requirements: 6.1, 6.2, 6.4
 */

import { Contract } from '@/lib/types';
import crypto from 'crypto';

/**
 * Serializes contract data into a deterministic string format for hashing.
 * 
 * The serialization includes all contract fields that define the contract content:
 * - Contractor data (name, CPF, email, phone)
 * - Installation address (all address fields including coordinates)
 * - Project specifications (kWp, installation date)
 * - Equipment list (items with name, quantity, unit)
 * - Service scope (service descriptions and included status)
 * - Financial information (contract value, payment method)
 * 
 * Fields are sorted alphabetically and null/undefined values are normalized
 * to ensure deterministic output.
 * 
 * @param contract - The contract object to serialize
 * @returns A deterministic string representation of the contract
 * 
 * @example
 * const contract = { contractorName: "João Silva", contractorCPF: "12345678901", ... };
 * const serialized = serializeContractForHashing(contract);
 * // Returns: "addressCEP:12345678|addressCity:São Paulo|..."
 */
export function serializeContractForHashing(contract: Contract): string {
  // Extract only the fields that define contract content
  // Exclude metadata fields like id, uuid, status, createdAt, etc.
  const contentFields = {
    // Contractor Information
    contractorName: contract.contractorName,
    contractorCPF: contract.contractorCPF,
    contractorEmail: contract.contractorEmail || '',
    contractorPhone: contract.contractorPhone || '',
    
    // Installation Address
    addressCEP: contract.addressCEP,
    addressStreet: contract.addressStreet,
    addressNumber: contract.addressNumber,
    addressComplement: contract.addressComplement || '',
    addressNeighborhood: contract.addressNeighborhood,
    addressCity: contract.addressCity,
    addressState: contract.addressState,
    
    // Geographic Location
    locationLatitude: contract.locationLatitude?.toString() || '',
    locationLongitude: contract.locationLongitude?.toString() || '',
    
    // Project Specifications
    projectKWp: contract.projectKWp.toString(),
    installationDate: contract.installationDate?.toISOString() || '',
    
    // Financial Information
    contractValue: contract.contractValue.toString(),
    paymentMethod: contract.paymentMethod,
  };
  
  // Sort equipment items by sortOrder for deterministic serialization
  const sortedItems = (contract.items || [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => ({
      itemName: item.itemName,
      quantity: item.quantity.toString(),
      unit: item.unit,
    }));
  
  // Sort services by description for deterministic serialization
  const sortedServices = contract.services
    .slice()
    .sort((a, b) => a.description.localeCompare(b.description))
    .map(service => ({
      description: service.description,
      included: service.included.toString(),
    }));
  
  // Create a deterministic string by sorting keys alphabetically
  const sortedKeys = Object.keys(contentFields).sort();
  const fieldPairs = sortedKeys.map(key => {
    const value = contentFields[key as keyof typeof contentFields];
    return `${key}:${value}`;
  });
  
  // Add equipment items
  const itemStrings = sortedItems.map(item => 
    `item:${item.itemName}|${item.quantity}|${item.unit}`
  );
  
  // Add services
  const serviceStrings = sortedServices.map(service =>
    `service:${service.description}|${service.included}`
  );
  
  // Combine all parts with a separator
  return [
    ...fieldPairs,
    ...itemStrings,
    ...serviceStrings,
  ].join('|');
}

/**
 * Generates a SHA-256 hash of the contract content.
 * 
 * This function creates a cryptographic hash that uniquely identifies
 * the contract content. The hash is deterministic (same content = same hash)
 * and sensitive to changes (any field change = different hash).
 * 
 * @param contract - The contract object to hash
 * @returns A SHA-256 hash as a hexadecimal string (64 characters)
 * 
 * @example
 * const contract = { contractorName: "João Silva", ... };
 * const hash = generateContractHash(contract);
 * // Returns: "a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"
 */
export function generateContractHash(contract: Contract): string {
  // Serialize the contract data
  const serialized = serializeContractForHashing(contract);
  
  // Generate SHA-256 hash
  const hash = crypto
    .createHash('sha256')
    .update(serialized, 'utf8')
    .digest('hex');
  
  return hash;
}

/**
 * Verifies the integrity of a contract by comparing its current hash
 * with a previously stored hash.
 * 
 * This function recalculates the hash from the current contract content
 * and compares it to the stored hash. If they match, the contract has
 * not been tampered with. If they differ, the contract may have been modified.
 * 
 * @param contract - The contract object to verify
 * @param storedHash - The previously stored hash to compare against
 * @returns true if the hashes match (contract is unmodified), false otherwise
 * 
 * @example
 * const contract = { contractorName: "João Silva", ... };
 * const storedHash = "a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0";
 * const isValid = verifyContractHash(contract, storedHash);
 * // Returns: true if contract hasn't been modified, false if tampered
 */
export function verifyContractHash(contract: Contract, storedHash: string): boolean {
  // Recalculate the hash from current contract content
  const currentHash = generateContractHash(contract);
  
  // Compare with stored hash (case-insensitive comparison)
  return currentHash.toLowerCase() === storedHash.toLowerCase();
}
