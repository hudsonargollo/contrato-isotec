/**
 * Unit Tests for Contract Hashing Service
 * 
 * Tests the contract hashing functionality including:
 * - Serialization of contract data
 * - SHA-256 hash generation
 * - Hash verification
 */

import {
  serializeContractForHashing,
  generateContractHash,
  verifyContractHash,
} from '@/lib/services/contract-hash';
import { Contract } from '@/lib/types';

describe('Contract Hashing Service', () => {
  // Sample contract data for testing
  const sampleContract: Contract = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    uuid: '987fcdeb-51a2-43d7-9876-543210fedcba',
    contractorName: 'João Silva',
    contractorCPF: '12345678901',
    contractorEmail: 'joao@example.com',
    contractorPhone: '11987654321',
    addressCEP: '01310100',
    addressStreet: 'Avenida Paulista',
    addressNumber: '1000',
    addressComplement: 'Apto 101',
    addressNeighborhood: 'Bela Vista',
    addressCity: 'São Paulo',
    addressState: 'SP',
    locationLatitude: -23.5505199,
    locationLongitude: -46.6333094,
    projectKWp: 10.5,
    installationDate: new Date('2024-06-15'),
    services: [
      { description: 'Instalação de painéis solares', included: true },
      { description: 'Manutenção anual', included: false },
    ],
    items: [
      {
        id: 'item-1',
        contractId: '123e4567-e89b-12d3-a456-426614174000',
        itemName: 'Painel Solar 550W',
        quantity: 20,
        unit: 'un',
        sortOrder: 0,
      },
      {
        id: 'item-2',
        contractId: '123e4567-e89b-12d3-a456-426614174000',
        itemName: 'Inversor 10kW',
        quantity: 1,
        unit: 'un',
        sortOrder: 1,
      },
    ],
    contractValue: 45000.00,
    paymentMethod: 'pix',
    status: 'pending_signature',
    createdBy: 'admin-123',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  describe('serializeContractForHashing', () => {
    it('should serialize contract data into a deterministic string', () => {
      const serialized = serializeContractForHashing(sampleContract);
      
      expect(serialized).toBeDefined();
      expect(typeof serialized).toBe('string');
      expect(serialized.length).toBeGreaterThan(0);
    });

    it('should produce the same serialization for the same contract', () => {
      const serialized1 = serializeContractForHashing(sampleContract);
      const serialized2 = serializeContractForHashing(sampleContract);
      
      expect(serialized1).toBe(serialized2);
    });

    it('should include contractor information in serialization', () => {
      const serialized = serializeContractForHashing(sampleContract);
      
      expect(serialized).toContain('contractorName:João Silva');
      expect(serialized).toContain('contractorCPF:12345678901');
      expect(serialized).toContain('contractorEmail:joao@example.com');
    });

    it('should include address information in serialization', () => {
      const serialized = serializeContractForHashing(sampleContract);
      
      expect(serialized).toContain('addressCEP:01310100');
      expect(serialized).toContain('addressStreet:Avenida Paulista');
      expect(serialized).toContain('addressCity:São Paulo');
      expect(serialized).toContain('addressState:SP');
    });

    it('should include geographic coordinates in serialization', () => {
      const serialized = serializeContractForHashing(sampleContract);
      
      expect(serialized).toContain('locationLatitude:-23.5505199');
      expect(serialized).toContain('locationLongitude:-46.6333094');
    });

    it('should include project specifications in serialization', () => {
      const serialized = serializeContractForHashing(sampleContract);
      
      expect(serialized).toContain('projectKWp:10.5');
      expect(serialized).toContain('2024-06-15');
    });

    it('should include equipment items in serialization', () => {
      const serialized = serializeContractForHashing(sampleContract);
      
      expect(serialized).toContain('item:Painel Solar 550W|20|un');
      expect(serialized).toContain('item:Inversor 10kW|1|un');
    });

    it('should include services in serialization', () => {
      const serialized = serializeContractForHashing(sampleContract);
      
      expect(serialized).toContain('service:Instalação de painéis solares|true');
      expect(serialized).toContain('service:Manutenção anual|false');
    });

    it('should include financial information in serialization', () => {
      const serialized = serializeContractForHashing(sampleContract);
      
      expect(serialized).toContain('contractValue:45000');
      expect(serialized).toContain('paymentMethod:pix');
    });

    it('should handle contracts without optional fields', () => {
      const minimalContract: Contract = {
        ...sampleContract,
        contractorEmail: undefined,
        contractorPhone: undefined,
        addressComplement: undefined,
        locationLatitude: undefined,
        locationLongitude: undefined,
        installationDate: undefined,
        items: [],
      };
      
      const serialized = serializeContractForHashing(minimalContract);
      
      expect(serialized).toBeDefined();
      expect(serialized).toContain('contractorEmail:');
      expect(serialized).toContain('contractorPhone:');
      expect(serialized).toContain('locationLatitude:');
      expect(serialized).toContain('locationLongitude:');
    });

    it('should not include metadata fields in serialization', () => {
      const serialized = serializeContractForHashing(sampleContract);
      
      // These fields should NOT be in the serialization
      expect(serialized).not.toContain('id:');
      expect(serialized).not.toContain('uuid:');
      expect(serialized).not.toContain('status:');
      expect(serialized).not.toContain('createdBy:');
      expect(serialized).not.toContain('createdAt:');
      expect(serialized).not.toContain('updatedAt:');
    });
  });

  describe('generateContractHash', () => {
    it('should generate a SHA-256 hash', () => {
      const hash = generateContractHash(sampleContract);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
      expect(hash).toMatch(/^[a-f0-9]{64}$/); // Only lowercase hex characters
    });

    it('should generate the same hash for the same contract (determinism)', () => {
      const hash1 = generateContractHash(sampleContract);
      const hash2 = generateContractHash(sampleContract);
      
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes when contractor name changes', () => {
      const hash1 = generateContractHash(sampleContract);
      
      const modifiedContract = {
        ...sampleContract,
        contractorName: 'Maria Santos',
      };
      const hash2 = generateContractHash(modifiedContract);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes when address changes', () => {
      const hash1 = generateContractHash(sampleContract);
      
      const modifiedContract = {
        ...sampleContract,
        addressStreet: 'Rua Augusta',
      };
      const hash2 = generateContractHash(modifiedContract);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes when project specifications change', () => {
      const hash1 = generateContractHash(sampleContract);
      
      const modifiedContract = {
        ...sampleContract,
        projectKWp: 15.0,
      };
      const hash2 = generateContractHash(modifiedContract);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes when equipment items change', () => {
      const hash1 = generateContractHash(sampleContract);
      
      const modifiedContract = {
        ...sampleContract,
        items: [
          ...sampleContract.items!,
          {
            id: 'item-3',
            contractId: sampleContract.id,
            itemName: 'Cabo Solar 6mm',
            quantity: 100,
            unit: 'm',
            sortOrder: 2,
          },
        ],
      };
      const hash2 = generateContractHash(modifiedContract);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes when services change', () => {
      const hash1 = generateContractHash(sampleContract);
      
      const modifiedContract = {
        ...sampleContract,
        services: [
          ...sampleContract.services,
          { description: 'Monitoramento remoto', included: true },
        ],
      };
      const hash2 = generateContractHash(modifiedContract);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes when financial information changes', () => {
      const hash1 = generateContractHash(sampleContract);
      
      const modifiedContract = {
        ...sampleContract,
        contractValue: 50000.00,
      };
      const hash2 = generateContractHash(modifiedContract);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should generate the same hash regardless of metadata changes', () => {
      const hash1 = generateContractHash(sampleContract);
      
      const modifiedContract = {
        ...sampleContract,
        status: 'signed' as const,
        updatedAt: new Date('2024-02-15'),
      };
      const hash2 = generateContractHash(modifiedContract);
      
      // Hash should be the same because metadata doesn't affect content
      expect(hash1).toBe(hash2);
    });
  });

  describe('verifyContractHash', () => {
    it('should return true when hash matches', () => {
      const hash = generateContractHash(sampleContract);
      const isValid = verifyContractHash(sampleContract, hash);
      
      expect(isValid).toBe(true);
    });

    it('should return false when hash does not match', () => {
      const hash = generateContractHash(sampleContract);
      
      const modifiedContract = {
        ...sampleContract,
        contractorName: 'Maria Santos',
      };
      const isValid = verifyContractHash(modifiedContract, hash);
      
      expect(isValid).toBe(false);
    });

    it('should return false when contract has been tampered with', () => {
      const originalHash = generateContractHash(sampleContract);
      
      // Simulate tampering by changing the contract value
      const tamperedContract = {
        ...sampleContract,
        contractValue: 1000.00, // Changed from 45000.00
      };
      
      const isValid = verifyContractHash(tamperedContract, originalHash);
      
      expect(isValid).toBe(false);
    });

    it('should handle case-insensitive hash comparison', () => {
      const hash = generateContractHash(sampleContract);
      const uppercaseHash = hash.toUpperCase();
      
      const isValid = verifyContractHash(sampleContract, uppercaseHash);
      
      expect(isValid).toBe(true);
    });

    it('should detect tampering in equipment items', () => {
      const originalHash = generateContractHash(sampleContract);
      
      const tamperedContract = {
        ...sampleContract,
        items: [
          {
            ...sampleContract.items![0],
            quantity: 10, // Changed from 20
          },
          sampleContract.items![1],
        ],
      };
      
      const isValid = verifyContractHash(tamperedContract, originalHash);
      
      expect(isValid).toBe(false);
    });

    it('should detect tampering in services', () => {
      const originalHash = generateContractHash(sampleContract);
      
      const tamperedContract = {
        ...sampleContract,
        services: [
          {
            ...sampleContract.services[0],
            included: false, // Changed from true
          },
          sampleContract.services[1],
        ],
      };
      
      const isValid = verifyContractHash(tamperedContract, originalHash);
      
      expect(isValid).toBe(false);
    });

    it('should verify integrity after round-trip (hash generation and verification)', () => {
      // Generate hash
      const hash = generateContractHash(sampleContract);
      
      // Store the hash (simulating database storage)
      const storedHash = hash;
      
      // Later, verify the contract hasn't been modified
      const isValid = verifyContractHash(sampleContract, storedHash);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle contracts with empty equipment list', () => {
      const contractWithoutItems: Contract = {
        ...sampleContract,
        items: [],
      };
      
      const hash = generateContractHash(contractWithoutItems);
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
      
      const isValid = verifyContractHash(contractWithoutItems, hash);
      expect(isValid).toBe(true);
    });

    it('should handle contracts with special characters in fields', () => {
      const contractWithSpecialChars: Contract = {
        ...sampleContract,
        contractorName: 'José María Ñoño',
        addressComplement: 'Apto 101 - Bloco A/B',
      };
      
      const hash = generateContractHash(contractWithSpecialChars);
      expect(hash).toBeDefined();
      
      const isValid = verifyContractHash(contractWithSpecialChars, hash);
      expect(isValid).toBe(true);
    });

    it('should handle contracts with very large values', () => {
      const contractWithLargeValues: Contract = {
        ...sampleContract,
        projectKWp: 999999.99,
        contractValue: 9999999.99,
      };
      
      const hash = generateContractHash(contractWithLargeValues);
      expect(hash).toBeDefined();
      
      const isValid = verifyContractHash(contractWithLargeValues, hash);
      expect(isValid).toBe(true);
    });

    it('should handle contracts with many equipment items', () => {
      const manyItems = Array.from({ length: 50 }, (_, i) => ({
        id: `item-${i}`,
        contractId: sampleContract.id,
        itemName: `Item ${i}`,
        quantity: i + 1,
        unit: 'un',
        sortOrder: i,
      }));
      
      const contractWithManyItems: Contract = {
        ...sampleContract,
        items: manyItems,
      };
      
      const hash = generateContractHash(contractWithManyItems);
      expect(hash).toBeDefined();
      
      const isValid = verifyContractHash(contractWithManyItems, hash);
      expect(isValid).toBe(true);
    });
  });
});
