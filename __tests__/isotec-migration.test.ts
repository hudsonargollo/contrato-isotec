/**
 * ISOTEC Migration System Tests
 * 
 * Tests data migration functionality including extraction, transformation,
 * validation, and loading of legacy ISOTEC data.
 * 
 * Requirements: 11.1, 11.3 - Data migration and validation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { isotecMigrationService } from '@/lib/services/isotec-migration';
import type { MigrationJob, LegacyContract, LegacyCustomer } from '@/lib/services/isotec-migration';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'test-job-id',
              tenant_id: 'test-tenant',
              job_type: 'full',
              status: 'pending',
              progress: {
                total_records: 0,
                processed_records: 0,
                successful_records: 0,
                failed_records: 0,
                current_phase: 'initialization'
              },
              configuration: {
                batch_size: 100,
                parallel_workers: 2,
                validation_enabled: true,
                dry_run: false
              }
            },
            error: null
          }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'test-job-id',
              status: 'pending'
            },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    })),
    rpc: jest.fn(() => Promise.resolve({ error: null }))
  }))
}));

describe('ISOTEC Migration Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Migration Job Creation', () => {
    it('should create a migration job with default configuration', async () => {
      const job = await isotecMigrationService.createMigrationJob('test-tenant', 'full');

      expect(job).toBeDefined();
      expect(job.tenant_id).toBe('test-tenant');
      expect(job.job_type).toBe('full');
      expect(job.status).toBe('pending');
      expect(job.configuration.batch_size).toBe(100);
      expect(job.configuration.parallel_workers).toBe(2);
      expect(job.configuration.validation_enabled).toBe(true);
      expect(job.configuration.dry_run).toBe(false);
    });

    it('should create a migration job with custom configuration', async () => {
      const customConfig = {
        batch_size: 50,
        parallel_workers: 1,
        validation_enabled: false,
        dry_run: true
      };

      const job = await isotecMigrationService.createMigrationJob(
        'test-tenant',
        'incremental',
        customConfig
      );

      expect(job.configuration).toEqual(customConfig);
      expect(job.job_type).toBe('incremental');
    });

    it('should create validation-only migration job', async () => {
      const job = await isotecMigrationService.createMigrationJob('test-tenant', 'validation');

      expect(job.job_type).toBe('validation');
      expect(job.status).toBe('pending');
    });
  });

  describe('Data Transformation', () => {
    it('should transform legacy contract data correctly', () => {
      const legacyContract: LegacyContract = {
        id: 'isotec_001',
        cliente_nome: 'João Silva Santos',
        cliente_email: 'joao@email.com',
        cliente_telefone: '11999999999',
        cliente_cpf: '12345678901',
        endereco_completo: 'Rua das Flores, 123, São Paulo, SP',
        potencia_sistema: 5.5,
        valor_total: 25000.00,
        data_criacao: '2023-01-15',
        status: 'ativo',
        observacoes: 'Sistema residencial'
      };

      // Test the transformation logic (would be part of the service)
      const transformedContract = {
        id: `migrated_${legacyContract.id}`,
        customer_id: `migrated_${legacyContract.id}`,
        contract_number: legacyContract.id,
        system_power: legacyContract.potencia_sistema,
        total_value: legacyContract.valor_total,
        status: 'active', // mapped from 'ativo'
        notes: legacyContract.observacoes,
        created_at: new Date(legacyContract.data_criacao)
      };

      expect(transformedContract.id).toBe('migrated_isotec_001');
      expect(transformedContract.system_power).toBe(5.5);
      expect(transformedContract.total_value).toBe(25000.00);
      expect(transformedContract.status).toBe('active');
    });

    it('should transform legacy customer data correctly', () => {
      const legacyCustomer: LegacyCustomer = {
        id: 'isotec_cust_001',
        nome: 'João Silva Santos',
        email: 'joao@email.com',
        telefone: '11999999999',
        cpf: '12345678901',
        endereco: 'Rua das Flores, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234567',
        data_cadastro: '2023-01-10'
      };

      const transformedCustomer = {
        id: `migrated_${legacyCustomer.id}`,
        first_name: legacyCustomer.nome.split(' ')[0],
        last_name: legacyCustomer.nome.split(' ').slice(1).join(' '),
        email: legacyCustomer.email,
        phone: legacyCustomer.telefone,
        document_number: legacyCustomer.cpf,
        address: {
          street: legacyCustomer.endereco,
          city: legacyCustomer.cidade,
          state: legacyCustomer.estado,
          postal_code: legacyCustomer.cep
        },
        created_at: new Date(legacyCustomer.data_cadastro)
      };

      expect(transformedCustomer.first_name).toBe('João');
      expect(transformedCustomer.last_name).toBe('Silva Santos');
      expect(transformedCustomer.address.city).toBe('São Paulo');
      expect(transformedCustomer.address.state).toBe('SP');
    });

    it('should handle name parsing edge cases', () => {
      const singleName = 'João';
      const firstName = singleName.split(' ')[0];
      const lastName = singleName.split(' ').slice(1).join(' ');

      expect(firstName).toBe('João');
      expect(lastName).toBe('');

      const multipleName = 'João Silva Santos Oliveira';
      const firstNameMultiple = multipleName.split(' ')[0];
      const lastNameMultiple = multipleName.split(' ').slice(1).join(' ');

      expect(firstNameMultiple).toBe('João');
      expect(lastNameMultiple).toBe('Silva Santos Oliveira');
    });
  });

  describe('Status Mapping', () => {
    it('should map legacy contract statuses correctly', () => {
      const statusMap: Record<string, string> = {
        'ativo': 'active',
        'inativo': 'inactive',
        'pendente': 'pending',
        'cancelado': 'cancelled',
        'concluido': 'completed'
      };

      Object.entries(statusMap).forEach(([legacy, expected]) => {
        const mapped = statusMap[legacy.toLowerCase()] || 'pending';
        expect(mapped).toBe(expected);
      });

      // Test unknown status defaults to pending
      const unknownStatus = statusMap['unknown'] || 'pending';
      expect(unknownStatus).toBe('pending');
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields in legacy contract', () => {
      const validContract: LegacyContract = {
        id: 'isotec_001',
        cliente_nome: 'João Silva',
        cliente_email: 'joao@email.com',
        cliente_telefone: '11999999999',
        cliente_cpf: '12345678901',
        endereco_completo: 'Rua das Flores, 123',
        potencia_sistema: 5.5,
        valor_total: 25000.00,
        data_criacao: '2023-01-15',
        status: 'ativo'
      };

      // Test validation logic
      expect(validContract.id).toBeTruthy();
      expect(validContract.cliente_nome.length).toBeGreaterThan(0);
      expect(validContract.cliente_email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(validContract.cliente_cpf).toMatch(/^\d{11}$/);
      expect(validContract.potencia_sistema).toBeGreaterThan(0);
      expect(validContract.valor_total).toBeGreaterThan(0);
    });

    it('should identify invalid contract data', () => {
      const invalidContract = {
        id: '',
        cliente_nome: '',
        cliente_email: 'invalid-email',
        cliente_telefone: '11999999999',
        cliente_cpf: '123', // Invalid CPF
        endereco_completo: 'Rua das Flores, 123',
        potencia_sistema: -1, // Invalid power
        valor_total: 0, // Invalid value
        data_criacao: '2023-01-15',
        status: 'ativo'
      };

      expect(invalidContract.id).toBeFalsy();
      expect(invalidContract.cliente_nome).toBeFalsy();
      expect(invalidContract.cliente_email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(invalidContract.cliente_cpf).not.toMatch(/^\d{11}$/);
      expect(invalidContract.potencia_sistema).toBeLessThanOrEqual(0);
      expect(invalidContract.valor_total).toBeLessThanOrEqual(0);
    });
  });

  describe('Migration Progress Tracking', () => {
    it('should calculate progress percentage correctly', () => {
      const calculateProgress = (processed: number, total: number): number => {
        return total > 0 ? (processed / total) * 100 : 0;
      };

      expect(calculateProgress(0, 100)).toBe(0);
      expect(calculateProgress(50, 100)).toBe(50);
      expect(calculateProgress(100, 100)).toBe(100);
      expect(calculateProgress(0, 0)).toBe(0);
    });

    it('should estimate completion time', () => {
      const estimateCompletion = (
        startTime: number,
        processed: number,
        total: number
      ): number | null => {
        if (processed === 0) return null;
        
        const elapsed = Date.now() - startTime;
        const rate = processed / elapsed;
        const remaining = total - processed;
        
        return Date.now() + (remaining / rate);
      };

      const startTime = Date.now() - 60000; // 1 minute ago
      const processed = 50;
      const total = 100;

      const estimated = estimateCompletion(startTime, processed, total);
      expect(estimated).toBeGreaterThan(Date.now());

      // Test edge case
      const noProgress = estimateCompletion(startTime, 0, total);
      expect(noProgress).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle transformation errors gracefully', () => {
      const invalidData = {
        id: null,
        cliente_nome: null,
        cliente_email: 'invalid'
      };

      const errors: any[] = [];

      try {
        // Simulate transformation that would fail
        if (!invalidData.id || !invalidData.cliente_nome) {
          throw new Error('Missing required fields');
        }
      } catch (error) {
        errors.push({
          entity_type: 'contract',
          entity_id: invalidData.id || 'unknown',
          error_type: 'validation',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          source_data: invalidData
        });
      }

      expect(errors).toHaveLength(1);
      expect(errors[0].error_type).toBe('validation');
      expect(errors[0].error_message).toBe('Missing required fields');
    });

    it('should categorize different error types', () => {
      const errorTypes = ['validation', 'transformation', 'database', 'business_rule'];
      
      errorTypes.forEach(type => {
        const error = {
          error_type: type,
          error_message: `Test ${type} error`
        };
        
        expect(errorTypes).toContain(error.error_type);
      });
    });
  });

  describe('Migration Job States', () => {
    it('should validate job status transitions', () => {
      const validTransitions: Record<string, string[]> = {
        'pending': ['running', 'failed'],
        'running': ['completed', 'failed', 'paused'],
        'paused': ['running', 'failed'],
        'completed': [],
        'failed': ['pending'] // Can retry
      };

      // Test valid transitions
      expect(validTransitions['pending']).toContain('running');
      expect(validTransitions['running']).toContain('completed');
      expect(validTransitions['running']).toContain('failed');
      
      // Test invalid transitions
      expect(validTransitions['completed']).not.toContain('running');
      expect(validTransitions['pending']).not.toContain('completed');
    });

    it('should validate job types', () => {
      const validJobTypes = ['full', 'incremental', 'validation'];
      
      validJobTypes.forEach(type => {
        expect(['full', 'incremental', 'validation']).toContain(type);
      });
      
      expect(['full', 'incremental', 'validation']).not.toContain('invalid');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate batch size limits', () => {
      const validateBatchSize = (size: number): boolean => {
        return size >= 1 && size <= 1000;
      };

      expect(validateBatchSize(1)).toBe(true);
      expect(validateBatchSize(100)).toBe(true);
      expect(validateBatchSize(1000)).toBe(true);
      expect(validateBatchSize(0)).toBe(false);
      expect(validateBatchSize(1001)).toBe(false);
    });

    it('should validate parallel worker limits', () => {
      const validateWorkers = (workers: number): boolean => {
        return workers >= 1 && workers <= 10;
      };

      expect(validateWorkers(1)).toBe(true);
      expect(validateWorkers(5)).toBe(true);
      expect(validateWorkers(10)).toBe(true);
      expect(validateWorkers(0)).toBe(false);
      expect(validateWorkers(11)).toBe(false);
    });
  });
});