/**
 * Unit Tests for Audit Log Service
 * 
 * Tests the audit log functionality including:
 * - Creating immutable audit log entries
 * - Retrieving audit logs for a contract
 * - Filtering audit logs by event type
 * - Verifying audit log hashes
 */

import {
  createAuditLog,
  getAuditLogsForContract,
  getLatestAuditLog,
  getAuditLogsByEventType,
  verifyAuditLogHash,
  AuditLogInput,
  AuditLogEntry,
} from '@/lib/services/audit-log';

// Mock the Supabase clients
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Audit Log Service', () => {
  // Sample audit log data for testing
  const sampleAuditLogInput: AuditLogInput = {
    contractId: '123e4567-e89b-12d3-a456-426614174000',
    eventType: 'signature_completed',
    signatureMethod: 'govbr',
    contractHash: 'a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
    signerIdentifier: 'govbr-user-12345',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    metadata: {
      signatureTimestamp: '2024-01-15T10:30:00Z',
      deviceType: 'desktop',
    },
  };

  const sampleAuditLogEntry: AuditLogEntry = {
    id: 'audit-log-123',
    contractId: sampleAuditLogInput.contractId,
    eventType: sampleAuditLogInput.eventType,
    signatureMethod: sampleAuditLogInput.signatureMethod,
    contractHash: sampleAuditLogInput.contractHash,
    signerIdentifier: sampleAuditLogInput.signerIdentifier,
    ipAddress: sampleAuditLogInput.ipAddress,
    userAgent: sampleAuditLogInput.userAgent,
    metadata: sampleAuditLogInput.metadata,
    createdAt: '2024-01-15T10:30:00.000Z',
  };

  let mockSupabaseClient: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create a mock Supabase client
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };

    // Mock the createClient functions to return our mock client
    const { createClient: createBrowserClient } = require('@/lib/supabase/client');
    const { createClient: createServerClient } = require('@/lib/supabase/server');
    
    createBrowserClient.mockReturnValue(mockSupabaseClient);
    createServerClient.mockResolvedValue(mockSupabaseClient);
  });

  describe('createAuditLog', () => {
    it('should create an audit log entry successfully', async () => {
      // Mock successful insert
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: sampleAuditLogEntry.id,
          contract_id: sampleAuditLogEntry.contractId,
          event_type: sampleAuditLogEntry.eventType,
          signature_method: sampleAuditLogEntry.signatureMethod,
          contract_hash: sampleAuditLogEntry.contractHash,
          signer_identifier: sampleAuditLogEntry.signerIdentifier,
          ip_address: sampleAuditLogEntry.ipAddress,
          user_agent: sampleAuditLogEntry.userAgent,
          metadata: sampleAuditLogEntry.metadata,
          created_at: sampleAuditLogEntry.createdAt,
        },
        error: null,
      });

      const result = await createAuditLog(sampleAuditLogInput);

      expect(result).toEqual(sampleAuditLogEntry);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        contract_id: sampleAuditLogInput.contractId,
        event_type: sampleAuditLogInput.eventType,
        signature_method: sampleAuditLogInput.signatureMethod,
        contract_hash: sampleAuditLogInput.contractHash,
        signer_identifier: sampleAuditLogInput.signerIdentifier,
        ip_address: sampleAuditLogInput.ipAddress,
        user_agent: sampleAuditLogInput.userAgent,
        metadata: sampleAuditLogInput.metadata,
      });
    });

    it('should create audit log for GOV.BR signature', async () => {
      const govbrInput: AuditLogInput = {
        ...sampleAuditLogInput,
        signatureMethod: 'govbr',
        signerIdentifier: 'govbr-user-67890',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: 'audit-log-456',
          contract_id: govbrInput.contractId,
          event_type: govbrInput.eventType,
          signature_method: govbrInput.signatureMethod,
          contract_hash: govbrInput.contractHash,
          signer_identifier: govbrInput.signerIdentifier,
          ip_address: govbrInput.ipAddress,
          user_agent: govbrInput.userAgent,
          metadata: govbrInput.metadata || {},
          created_at: '2024-01-15T10:30:00.000Z',
        },
        error: null,
      });

      const result = await createAuditLog(govbrInput);

      expect(result.signatureMethod).toBe('govbr');
      expect(result.signerIdentifier).toBe('govbr-user-67890');
    });

    it('should create audit log for email signature', async () => {
      const emailInput: AuditLogInput = {
        ...sampleAuditLogInput,
        signatureMethod: 'email',
        signerIdentifier: 'contractor@example.com',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: 'audit-log-789',
          contract_id: emailInput.contractId,
          event_type: emailInput.eventType,
          signature_method: emailInput.signatureMethod,
          contract_hash: emailInput.contractHash,
          signer_identifier: emailInput.signerIdentifier,
          ip_address: emailInput.ipAddress,
          user_agent: emailInput.userAgent,
          metadata: emailInput.metadata || {},
          created_at: '2024-01-15T10:30:00.000Z',
        },
        error: null,
      });

      const result = await createAuditLog(emailInput);

      expect(result.signatureMethod).toBe('email');
      expect(result.signerIdentifier).toBe('contractor@example.com');
    });

    it('should handle audit log without optional fields', async () => {
      const minimalInput: AuditLogInput = {
        contractId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: 'signature_initiated',
        signatureMethod: 'email',
        contractHash: 'a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
        ipAddress: '192.168.1.1',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: 'audit-log-minimal',
          contract_id: minimalInput.contractId,
          event_type: minimalInput.eventType,
          signature_method: minimalInput.signatureMethod,
          contract_hash: minimalInput.contractHash,
          signer_identifier: null,
          ip_address: minimalInput.ipAddress,
          user_agent: null,
          metadata: {},
          created_at: '2024-01-15T10:30:00.000Z',
        },
        error: null,
      });

      const result = await createAuditLog(minimalInput);

      expect(result.signerIdentifier).toBeNull();
      expect(result.userAgent).toBeNull();
      expect(result.metadata).toEqual({});
    });

    it('should throw error when database insert fails', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await expect(createAuditLog(sampleAuditLogInput)).rejects.toThrow(
        'Failed to create audit log: Database connection failed'
      );
    });

    it('should throw error when no data is returned', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(createAuditLog(sampleAuditLogInput)).rejects.toThrow(
        'Failed to create audit log: No data returned'
      );
    });

    it('should use server client when useServerClient is true', async () => {
      const { createClient: createServerClient } = require('@/lib/supabase/server');
      
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: sampleAuditLogEntry.id,
          contract_id: sampleAuditLogEntry.contractId,
          event_type: sampleAuditLogEntry.eventType,
          signature_method: sampleAuditLogEntry.signatureMethod,
          contract_hash: sampleAuditLogEntry.contractHash,
          signer_identifier: sampleAuditLogEntry.signerIdentifier,
          ip_address: sampleAuditLogEntry.ipAddress,
          user_agent: sampleAuditLogEntry.userAgent,
          metadata: sampleAuditLogEntry.metadata,
          created_at: sampleAuditLogEntry.createdAt,
        },
        error: null,
      });

      await createAuditLog(sampleAuditLogInput, true);

      expect(createServerClient).toHaveBeenCalled();
    });
  });

  describe('getAuditLogsForContract', () => {
    it('should retrieve all audit logs for a contract', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          contract_id: sampleAuditLogInput.contractId,
          event_type: 'signature_completed',
          signature_method: 'govbr',
          contract_hash: 'hash1',
          signer_identifier: 'user1',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          metadata: {},
          created_at: '2024-01-15T10:30:00.000Z',
        },
        {
          id: 'log-2',
          contract_id: sampleAuditLogInput.contractId,
          event_type: 'signature_initiated',
          signature_method: 'email',
          contract_hash: 'hash2',
          signer_identifier: 'user@example.com',
          ip_address: '192.168.1.2',
          user_agent: 'Chrome',
          metadata: {},
          created_at: '2024-01-15T10:00:00.000Z',
        },
      ];

      mockSupabaseClient.order.mockResolvedValue({
        data: mockLogs,
        error: null,
      });

      const result = await getAuditLogsForContract(sampleAuditLogInput.contractId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('log-1');
      expect(result[1].id).toBe('log-2');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('contract_id', sampleAuditLogInput.contractId);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return empty array when no logs exist', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getAuditLogsForContract('non-existent-contract');

      expect(result).toEqual([]);
    });

    it('should return empty array when data is null', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await getAuditLogsForContract('contract-id');

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      });

      await expect(getAuditLogsForContract('contract-id')).rejects.toThrow(
        'Failed to retrieve audit logs: Query failed'
      );
    });

    it('should order logs by creation time (newest first)', async () => {
      const mockLogs = [
        {
          id: 'log-3',
          contract_id: 'contract-id',
          event_type: 'signature_completed',
          signature_method: 'govbr',
          contract_hash: 'hash3',
          signer_identifier: 'user3',
          ip_address: '192.168.1.3',
          user_agent: 'Safari',
          metadata: {},
          created_at: '2024-01-15T12:00:00.000Z', // Most recent
        },
        {
          id: 'log-2',
          contract_id: 'contract-id',
          event_type: 'signature_initiated',
          signature_method: 'email',
          contract_hash: 'hash2',
          signer_identifier: 'user2',
          ip_address: '192.168.1.2',
          user_agent: 'Chrome',
          metadata: {},
          created_at: '2024-01-15T11:00:00.000Z',
        },
        {
          id: 'log-1',
          contract_id: 'contract-id',
          event_type: 'contract_created',
          signature_method: 'system',
          contract_hash: '',
          signer_identifier: 'admin',
          ip_address: '127.0.0.1',
          user_agent: null,
          metadata: {},
          created_at: '2024-01-15T10:00:00.000Z', // Oldest
        },
      ];

      mockSupabaseClient.order.mockResolvedValue({
        data: mockLogs,
        error: null,
      });

      const result = await getAuditLogsForContract('contract-id');

      expect(result[0].id).toBe('log-3'); // Most recent first
      expect(result[2].id).toBe('log-1'); // Oldest last
    });
  });

  describe('getLatestAuditLog', () => {
    it('should return the most recent audit log', async () => {
      const mockLogs = [
        {
          id: 'log-latest',
          contract_id: 'contract-id',
          event_type: 'signature_completed',
          signature_method: 'govbr',
          contract_hash: 'hash-latest',
          signer_identifier: 'user-latest',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          metadata: {},
          created_at: '2024-01-15T12:00:00.000Z',
        },
        {
          id: 'log-older',
          contract_id: 'contract-id',
          event_type: 'signature_initiated',
          signature_method: 'email',
          contract_hash: 'hash-older',
          signer_identifier: 'user-older',
          ip_address: '192.168.1.2',
          user_agent: 'Chrome',
          metadata: {},
          created_at: '2024-01-15T11:00:00.000Z',
        },
      ];

      mockSupabaseClient.order.mockResolvedValue({
        data: mockLogs,
        error: null,
      });

      const result = await getLatestAuditLog('contract-id');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('log-latest');
      expect(result?.eventType).toBe('signature_completed');
    });

    it('should return null when no logs exist', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getLatestAuditLog('contract-id');

      expect(result).toBeNull();
    });
  });

  describe('getAuditLogsByEventType', () => {
    it('should filter logs by event type', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          contract_id: 'contract-id',
          event_type: 'signature_completed',
          signature_method: 'govbr',
          contract_hash: 'hash1',
          signer_identifier: 'user1',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          metadata: {},
          created_at: '2024-01-15T10:30:00.000Z',
        },
      ];

      mockSupabaseClient.order.mockResolvedValue({
        data: mockLogs,
        error: null,
      });

      const result = await getAuditLogsByEventType('contract-id', 'signature_completed');

      expect(result).toHaveLength(1);
      expect(result[0].eventType).toBe('signature_completed');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('contract_id', 'contract-id');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('event_type', 'signature_completed');
    });

    it('should return empty array when no logs match event type', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getAuditLogsByEventType('contract-id', 'signature_failed');

      expect(result).toEqual([]);
    });

    it('should filter signature_initiated events', async () => {
      const mockLogs = [
        {
          id: 'log-init-1',
          contract_id: 'contract-id',
          event_type: 'signature_initiated',
          signature_method: 'email',
          contract_hash: 'hash-init',
          signer_identifier: 'user@example.com',
          ip_address: '192.168.1.1',
          user_agent: 'Chrome',
          metadata: {},
          created_at: '2024-01-15T10:00:00.000Z',
        },
      ];

      mockSupabaseClient.order.mockResolvedValue({
        data: mockLogs,
        error: null,
      });

      const result = await getAuditLogsByEventType('contract-id', 'signature_initiated');

      expect(result).toHaveLength(1);
      expect(result[0].eventType).toBe('signature_initiated');
    });
  });

  describe('verifyAuditLogHash', () => {
    it('should return true when hash exists in audit logs', async () => {
      mockSupabaseClient.limit.mockResolvedValue({
        data: [{ id: 'log-1' }],
        error: null,
      });

      const result = await verifyAuditLogHash(
        'contract-id',
        'a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0'
      );

      expect(result).toBe(true);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('contract_id', 'contract-id');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
        'contract_hash',
        'a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0'
      );
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(1);
    });

    it('should return false when hash does not exist', async () => {
      mockSupabaseClient.limit.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await verifyAuditLogHash('contract-id', 'non-existent-hash');

      expect(result).toBe(false);
    });

    it('should return false when data is null', async () => {
      mockSupabaseClient.limit.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await verifyAuditLogHash('contract-id', 'some-hash');

      expect(result).toBe(false);
    });

    it('should throw error when database query fails', async () => {
      mockSupabaseClient.limit.mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      });

      await expect(verifyAuditLogHash('contract-id', 'some-hash')).rejects.toThrow(
        'Failed to verify audit log hash: Query failed'
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete signature flow audit trail', async () => {
      // Step 1: Signature initiated
      const initiatedLog = {
        id: 'log-1',
        contract_id: 'contract-id',
        event_type: 'signature_initiated',
        signature_method: 'govbr',
        contract_hash: '',
        signer_identifier: null,
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        metadata: {},
        created_at: '2024-01-15T10:00:00.000Z',
      };

      // Step 2: Signature completed
      const completedLog = {
        id: 'log-2',
        contract_id: 'contract-id',
        event_type: 'signature_completed',
        signature_method: 'govbr',
        contract_hash: 'final-hash',
        signer_identifier: 'govbr-user-123',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        metadata: { signedAt: '2024-01-15T10:05:00.000Z' },
        created_at: '2024-01-15T10:05:00.000Z',
      };

      mockSupabaseClient.order.mockResolvedValue({
        data: [completedLog, initiatedLog],
        error: null,
      });

      const logs = await getAuditLogsForContract('contract-id');

      expect(logs).toHaveLength(2);
      expect(logs[0].eventType).toBe('signature_completed');
      expect(logs[1].eventType).toBe('signature_initiated');
    });

    it('should handle failed signature attempts', async () => {
      const failedLog = {
        id: 'log-failed',
        contract_id: 'contract-id',
        event_type: 'signature_failed',
        signature_method: 'email',
        contract_hash: '',
        signer_identifier: 'user@example.com',
        ip_address: '192.168.1.1',
        user_agent: 'Chrome',
        metadata: { reason: 'Invalid verification code' },
        created_at: '2024-01-15T10:00:00.000Z',
      };

      mockSupabaseClient.order.mockResolvedValue({
        data: [failedLog],
        error: null,
      });

      const logs = await getAuditLogsByEventType('contract-id', 'signature_failed');

      expect(logs).toHaveLength(1);
      expect(logs[0].eventType).toBe('signature_failed');
      expect(logs[0].metadata).toHaveProperty('reason');
    });
  });
});
