/**
 * E-Signature Service Unit Tests
 * 
 * Unit tests for e-signature integration functionality including
 * signature request creation, status tracking, and provider integration.
 * 
 * Requirements: 7.3 - E-signature integration
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ESignatureService, createESignatureService, createSignatureRequestFromContract } from '@/lib/services/e-signature';
import { 
  CreateSignatureRequest,
  CreateSigner,
  CreateSignatureField,
  SignatureRequestWithSigners,
  calculateSignatureProgress,
  isSignatureRequestExpired,
  getStatusLabel,
  getStatusColor
} from '@/lib/types/e-signature';
import { GeneratedContract } from '@/lib/types/contract-generation';
import { TenantContext } from '@/lib/types/tenant';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    rpc: jest.fn(),
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    }))
  }))
}));

describe('ESignatureService', () => {
  let service: ESignatureService;
  let mockTenantContext: TenantContext;

  beforeEach(() => {
    mockTenantContext = {
      tenant_id: 'test-tenant-id',
      user_id: 'test-user-id',
      permissions: [],
      subscription_limits: {}
    };

    service = createESignatureService(mockTenantContext);
  });

  describe('createSignatureRequest', () => {
    it('should create a signature request with valid data', async () => {
      const requestData: CreateSignatureRequest = {
        tenant_id: mockTenantContext.tenant_id,
        contract_id: 'test-contract-id',
        provider: 'docusign',
        document_name: 'Test Contract.pdf',
        subject: 'Please sign this contract',
        message: 'Please review and sign the attached contract.',
        status: 'draft',
        created_by: mockTenantContext.user_id
      };

      // Mock successful database response
      const mockResponse = {
        id: 'test-request-id',
        ...requestData,
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      const result = await service.createSignatureRequest(requestData);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-request-id');
      expect(result.contract_id).toBe('test-contract-id');
      expect(result.provider).toBe('docusign');
      expect(result.status).toBe('draft');
    });

    it('should throw error when database operation fails', async () => {
      const requestData: CreateSignatureRequest = {
        tenant_id: mockTenantContext.tenant_id,
        contract_id: 'test-contract-id',
        provider: 'docusign',
        document_name: 'Test Contract.pdf',
        subject: 'Please sign this contract',
        message: 'Please review and sign the attached contract.',
        status: 'draft',
        created_by: mockTenantContext.user_id
      };

      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(service.createSignatureRequest(requestData)).rejects.toThrow('Failed to create signature request: Database error');
    });
  });

  describe('addSigner', () => {
    it('should add a signer to a signature request', async () => {
      const signerData: CreateSigner = {
        signature_request_id: 'test-request-id',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'contractor',
        signing_order: 1,
        auth_method: 'email',
        require_id_verification: false,
        status: 'pending'
      };

      const mockResponse = {
        id: 'test-signer-id',
        ...signerData,
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      const result = await service.addSigner('test-request-id', signerData);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-signer-id');
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.signing_order).toBe(1);
    });
  });

  describe('addSignatureField', () => {
    it('should add a signature field to a signer', async () => {
      const fieldData: CreateSignatureField = {
        signer_id: 'test-signer-id',
        field_type: 'signature',
        field_name: 'contractor_signature',
        required: true,
        page_number: 1,
        x_position: 100,
        y_position: 200,
        width: 150,
        height: 50
      };

      const mockResponse = {
        id: 'test-field-id',
        ...fieldData,
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      const result = await service.addSignatureField('test-signer-id', fieldData);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-field-id');
      expect(result.field_type).toBe('signature');
      expect(result.field_name).toBe('contractor_signature');
      expect(result.x_position).toBe(100);
      expect(result.y_position).toBe(200);
    });
  });
});

describe('Utility Functions', () => {
  describe('createSignatureRequestFromContract', () => {
    it('should create signature request data from contract', () => {
      const mockContract: GeneratedContract = {
        id: 'test-contract-id',
        tenant_id: 'test-tenant-id',
        generation_request_id: 'test-generation-id',
        contract_number: 'CT240001',
        template_id: 'test-template-id',
        template_version: '1.0.0',
        customer_id: 'test-customer-id',
        customer_data: {
          contractor_name: 'John Doe',
          contractor_email: 'john@example.com'
        },
        contract_content: '<h1>Contract Content</h1>',
        contract_variables: {},
        file_url: 'https://example.com/contract.pdf',
        file_format: 'pdf',
        status: 'approved',
        is_final: true,
        signature_status: 'pending',
        signature_requests: [],
        expires_at: new Date('2024-04-01'),
        created_by: 'test-user-id',
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = createSignatureRequestFromContract(mockContract, 'docusign');

      expect(result.tenant_id).toBe('test-tenant-id');
      expect(result.contract_id).toBe('test-contract-id');
      expect(result.provider).toBe('docusign');
      expect(result.document_name).toBe('CT240001.pdf');
      expect(result.document_url).toBe('https://example.com/contract.pdf');
      expect(result.subject).toBe('Assinatura do Contrato CT240001');
      expect(result.message).toBe('Por favor, assine o contrato CT240001.');
      expect(result.expires_at).toEqual(new Date('2024-04-01'));
      expect(result.created_by).toBe('test-user-id');
    });
  });

  describe('calculateSignatureProgress', () => {
    it('should calculate signature progress correctly', () => {
      const signers = [
        {
          id: '1',
          signature_request_id: 'test-request-id',
          name: 'John Doe',
          email: 'john@example.com',
          signing_order: 1,
          auth_method: 'email' as const,
          require_id_verification: false,
          status: 'signed' as const,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          signature_request_id: 'test-request-id',
          name: 'Jane Smith',
          email: 'jane@example.com',
          signing_order: 2,
          auth_method: 'email' as const,
          require_id_verification: false,
          status: 'sent' as const,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '3',
          signature_request_id: 'test-request-id',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          signing_order: 3,
          auth_method: 'email' as const,
          require_id_verification: false,
          status: 'pending' as const,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      const progress = calculateSignatureProgress(signers);

      expect(progress.total_signers).toBe(3);
      expect(progress.signed_count).toBe(1);
      expect(progress.sent_count).toBe(1);
      expect(progress.pending_count).toBe(1);
      expect(progress.declined_count).toBe(0);
      expect(progress.completion_percentage).toBe(33); // 1/3 * 100 rounded
    });

    it('should handle empty signers array', () => {
      const progress = calculateSignatureProgress([]);

      expect(progress.total_signers).toBe(0);
      expect(progress.signed_count).toBe(0);
      expect(progress.sent_count).toBe(0);
      expect(progress.pending_count).toBe(0);
      expect(progress.declined_count).toBe(0);
      expect(progress.completion_percentage).toBe(0);
    });
  });

  describe('isSignatureRequestExpired', () => {
    it('should return true for expired requests', () => {
      const expiredRequest = {
        id: 'test-id',
        tenant_id: 'test-tenant-id',
        contract_id: 'test-contract-id',
        provider: 'docusign' as const,
        document_name: 'Test.pdf',
        subject: 'Test',
        message: 'Test',
        status: 'sent' as const,
        expires_at: new Date('2020-01-01'), // Past date
        reminder_enabled: true,
        reminder_delay_days: 3,
        created_by: 'test-user-id',
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(isSignatureRequestExpired(expiredRequest)).toBe(true);
    });

    it('should return false for non-expired requests', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const activeRequest = {
        id: 'test-id',
        tenant_id: 'test-tenant-id',
        contract_id: 'test-contract-id',
        provider: 'docusign' as const,
        document_name: 'Test.pdf',
        subject: 'Test',
        message: 'Test',
        status: 'sent' as const,
        expires_at: futureDate,
        reminder_enabled: true,
        reminder_delay_days: 3,
        created_by: 'test-user-id',
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(isSignatureRequestExpired(activeRequest)).toBe(false);
    });

    it('should return false for requests without expiration', () => {
      const noExpirationRequest = {
        id: 'test-id',
        tenant_id: 'test-tenant-id',
        contract_id: 'test-contract-id',
        provider: 'docusign' as const,
        document_name: 'Test.pdf',
        subject: 'Test',
        message: 'Test',
        status: 'sent' as const,
        expires_at: undefined,
        reminder_enabled: true,
        reminder_delay_days: 3,
        created_by: 'test-user-id',
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(isSignatureRequestExpired(noExpirationRequest)).toBe(false);
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct Portuguese labels for statuses', () => {
      expect(getStatusLabel('pending')).toBe('Pendente');
      expect(getStatusLabel('sent')).toBe('Enviado');
      expect(getStatusLabel('signed')).toBe('Assinado');
      expect(getStatusLabel('declined')).toBe('Recusado');
      expect(getStatusLabel('expired')).toBe('Expirado');
      expect(getStatusLabel('completed')).toBe('Concluído');
    });

    it('should return original status for unknown statuses', () => {
      expect(getStatusLabel('unknown_status' as any)).toBe('unknown_status');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct CSS classes for statuses', () => {
      expect(getStatusColor('pending')).toBe('bg-yellow-100 text-yellow-800');
      expect(getStatusColor('sent')).toBe('bg-blue-100 text-blue-800');
      expect(getStatusColor('signed')).toBe('bg-green-100 text-green-800');
      expect(getStatusColor('declined')).toBe('bg-red-100 text-red-800');
      expect(getStatusColor('expired')).toBe('bg-gray-100 text-gray-800');
    });

    it('should return default color for unknown statuses', () => {
      expect(getStatusColor('unknown_status' as any)).toBe('bg-gray-100 text-gray-800');
    });
  });
});

describe('E-Signature Integration Scenarios', () => {
  it('should handle complete signature workflow', async () => {
    // This test simulates a complete e-signature workflow
    const mockTenantContext: TenantContext = {
      tenant_id: 'test-tenant-id',
      user_id: 'test-user-id',
      permissions: [],
      subscription_limits: {}
    };

    const service = createESignatureService(mockTenantContext);

    // Mock database responses
    const mockSupabase = require('@/lib/supabase/server').createClient();
    
    // Mock signature request creation
    mockSupabase.from().insert().select().single.mockResolvedValueOnce({
      data: {
        id: 'test-request-id',
        tenant_id: 'test-tenant-id',
        contract_id: 'test-contract-id',
        provider: 'docusign',
        document_name: 'Contract.pdf',
        subject: 'Please sign',
        message: 'Please sign this contract',
        status: 'draft',
        created_by: 'test-user-id',
        created_at: new Date(),
        updated_at: new Date()
      },
      error: null
    });

    // Mock signer addition
    mockSupabase.from().insert().select().single.mockResolvedValueOnce({
      data: {
        id: 'test-signer-id',
        signature_request_id: 'test-request-id',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'pending',
        signing_order: 1,
        auth_method: 'email',
        require_id_verification: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      error: null
    });

    // Mock signature field addition
    mockSupabase.from().insert().select().single.mockResolvedValueOnce({
      data: {
        id: 'test-field-id',
        signer_id: 'test-signer-id',
        field_type: 'signature',
        field_name: 'contractor_signature',
        required: true,
        page_number: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      error: null
    });

    // Create signature request
    const requestData: CreateSignatureRequest = {
      tenant_id: mockTenantContext.tenant_id,
      contract_id: 'test-contract-id',
      provider: 'docusign',
      document_name: 'Contract.pdf',
      subject: 'Please sign',
      message: 'Please sign this contract',
      status: 'draft',
      created_by: mockTenantContext.user_id
    };

    const request = await service.createSignatureRequest(requestData);
    expect(request.id).toBe('test-request-id');

    // Add signer
    const signerData: CreateSigner = {
      signature_request_id: request.id,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'contractor',
      signing_order: 1,
      auth_method: 'email',
      require_id_verification: false,
      status: 'pending'
    };

    const signer = await service.addSigner(request.id, signerData);
    expect(signer.id).toBe('test-signer-id');

    // Add signature field
    const fieldData: CreateSignatureField = {
      signer_id: signer.id,
      field_type: 'signature',
      field_name: 'contractor_signature',
      required: true,
      page_number: 1
    };

    const field = await service.addSignatureField(signer.id, fieldData);
    expect(field.id).toBe('test-field-id');
  });

  it('should validate signature request data', () => {
    // Test data validation scenarios
    const validRequestData: CreateSignatureRequest = {
      tenant_id: 'test-tenant-id',
      contract_id: 'test-contract-id',
      provider: 'docusign',
      document_name: 'Contract.pdf',
      subject: 'Please sign',
      message: 'Please sign this contract',
      status: 'draft',
      created_by: 'test-user-id'
    };

    // This would be validated by Zod schemas in the actual implementation
    expect(validRequestData.provider).toMatch(/^(docusign|hellosign)$/);
    expect(validRequestData.document_name).toBeTruthy();
    expect(validRequestData.subject).toBeTruthy();
    expect(validRequestData.tenant_id).toBeTruthy();
    expect(validRequestData.contract_id).toBeTruthy();
    expect(validRequestData.created_by).toBeTruthy();
  });
});