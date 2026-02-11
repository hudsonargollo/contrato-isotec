/**
 * Audit Log Service
 * 
 * Provides functionality for creating and retrieving immutable audit log entries
 * for contract signature events. Audit logs are critical for legal compliance
 * and must record all signature events with timestamps, IP addresses, and signer
 * identifiers.
 * 
 * Supports both GOV.BR and email signature methods, and integrates with the
 * contract hashing module for integrity verification.
 * 
 * Requirements: 10.1, 10.2, 10.5
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * Input data for creating an audit log entry
 */
export interface AuditLogInput {
  contractId: string;
  eventType: 'signature_initiated' | 'signature_completed' | 'signature_failed' | 'contract_viewed' | 'contract_created';
  signatureMethod: 'govbr' | 'email' | 'system';
  contractHash: string;
  signerIdentifier?: string;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Audit log entry returned from the database
 */
export interface AuditLogEntry {
  id: string;
  contractId: string;
  eventType: string;
  signatureMethod: string;
  contractHash: string;
  signerIdentifier: string | null;
  ipAddress: string;
  userAgent: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

/**
 * Creates an immutable audit log entry for a contract event.
 * 
 * This function records signature events with all required metadata for legal
 * compliance. Once created, audit log entries cannot be modified or deleted
 * due to database-level RLS policies and triggers.
 * 
 * The function automatically captures:
 * - Timestamp (set by database)
 * - Event type (signature_initiated, signature_completed, signature_failed, etc.)
 * - Signature method (govbr, email, system)
 * - Contract hash (SHA-256 hash of contract content)
 * - Signer identifier (GOV.BR user ID or email address)
 * - IP address of the signer
 * - User agent string (optional)
 * - Additional metadata (optional)
 * 
 * @param input - The audit log data to record
 * @param useServerClient - Whether to use server-side client (default: false)
 * @returns The created audit log entry
 * @throws Error if the audit log creation fails
 * 
 * @example
 * // Create audit log for GOV.BR signature
 * const auditLog = await createAuditLog({
 *   contractId: 'contract-uuid',
 *   eventType: 'signature_completed',
 *   signatureMethod: 'govbr',
 *   contractHash: 'a3f5b8c9d2e1f4a7...',
 *   signerIdentifier: 'govbr-user-id-12345',
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...'
 * });
 * 
 * @example
 * // Create audit log for email signature
 * const auditLog = await createAuditLog({
 *   contractId: 'contract-uuid',
 *   eventType: 'signature_completed',
 *   signatureMethod: 'email',
 *   contractHash: 'a3f5b8c9d2e1f4a7...',
 *   signerIdentifier: 'contractor@example.com',
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...'
 * });
 */
export async function createAuditLog(
  input: AuditLogInput,
  useServerClient: boolean = false
): Promise<AuditLogEntry> {
  // Get the appropriate Supabase client
  const supabase = useServerClient ? await createServerClient() : createBrowserClient();
  
  // Prepare the audit log data
  const auditLogData = {
    contract_id: input.contractId,
    event_type: input.eventType,
    signature_method: input.signatureMethod,
    contract_hash: input.contractHash,
    signer_identifier: input.signerIdentifier || null,
    ip_address: input.ipAddress,
    user_agent: input.userAgent || null,
    metadata: input.metadata || {},
  };
  
  // Insert the audit log entry
  const { data, error } = await supabase
    .from('audit_logs')
    .insert(auditLogData)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create audit log: ${error.message}`);
  }
  
  if (!data) {
    throw new Error('Failed to create audit log: No data returned');
  }
  
  // Transform the database response to match our interface
  return {
    id: data.id,
    contractId: data.contract_id,
    eventType: data.event_type,
    signatureMethod: data.signature_method,
    contractHash: data.contract_hash,
    signerIdentifier: data.signer_identifier,
    ipAddress: data.ip_address,
    userAgent: data.user_agent,
    metadata: data.metadata,
    createdAt: data.created_at,
  };
}

/**
 * Retrieves all audit log entries for a specific contract.
 * 
 * This function fetches the complete audit trail for a contract, ordered by
 * creation time (most recent first). The audit logs provide a chronological
 * record of all events related to the contract, including:
 * - Contract creation
 * - Signature initiation attempts
 * - Successful signature completions
 * - Failed signature attempts
 * - Contract views (optional)
 * 
 * The returned logs are immutable and provide legal evidence of contract
 * execution and integrity verification.
 * 
 * @param contractId - The UUID of the contract
 * @param useServerClient - Whether to use server-side client (default: false)
 * @returns Array of audit log entries, ordered by creation time (newest first)
 * @throws Error if the retrieval fails
 * 
 * @example
 * // Retrieve audit logs for a contract
 * const logs = await getAuditLogsForContract('contract-uuid');
 * 
 * // Display the audit trail
 * logs.forEach(log => {
 *   console.log(`${log.createdAt}: ${log.eventType} via ${log.signatureMethod}`);
 *   console.log(`  Signer: ${log.signerIdentifier}`);
 *   console.log(`  IP: ${log.ipAddress}`);
 *   console.log(`  Hash: ${log.contractHash}`);
 * });
 */
export async function getAuditLogsForContract(
  contractId: string,
  useServerClient: boolean = false
): Promise<AuditLogEntry[]> {
  // Get the appropriate Supabase client
  const supabase = useServerClient ? await createServerClient() : createBrowserClient();
  
  // Query audit logs for the contract
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to retrieve audit logs: ${error.message}`);
  }
  
  if (!data) {
    return [];
  }
  
  // Transform the database response to match our interface
  return data.map(log => ({
    id: log.id,
    contractId: log.contract_id,
    eventType: log.event_type,
    signatureMethod: log.signature_method,
    contractHash: log.contract_hash,
    signerIdentifier: log.signer_identifier,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    metadata: log.metadata,
    createdAt: log.created_at,
  }));
}

/**
 * Retrieves the most recent audit log entry for a contract.
 * 
 * This is a convenience function that returns only the latest audit log entry,
 * which is useful for checking the current signature status or most recent event.
 * 
 * @param contractId - The UUID of the contract
 * @param useServerClient - Whether to use server-side client (default: false)
 * @returns The most recent audit log entry, or null if no logs exist
 * @throws Error if the retrieval fails
 * 
 * @example
 * // Get the latest audit log entry
 * const latestLog = await getLatestAuditLog('contract-uuid');
 * if (latestLog && latestLog.eventType === 'signature_completed') {
 *   console.log('Contract is signed');
 * }
 */
export async function getLatestAuditLog(
  contractId: string,
  useServerClient: boolean = false
): Promise<AuditLogEntry | null> {
  const logs = await getAuditLogsForContract(contractId, useServerClient);
  return logs.length > 0 ? logs[0] : null;
}

/**
 * Retrieves audit logs filtered by event type.
 * 
 * This function allows filtering audit logs by specific event types,
 * which is useful for analyzing specific aspects of the contract lifecycle.
 * 
 * @param contractId - The UUID of the contract
 * @param eventType - The event type to filter by
 * @param useServerClient - Whether to use server-side client (default: false)
 * @returns Array of audit log entries matching the event type
 * @throws Error if the retrieval fails
 * 
 * @example
 * // Get all signature completion events
 * const signatureLogs = await getAuditLogsByEventType(
 *   'contract-uuid',
 *   'signature_completed'
 * );
 */
export async function getAuditLogsByEventType(
  contractId: string,
  eventType: AuditLogInput['eventType'],
  useServerClient: boolean = false
): Promise<AuditLogEntry[]> {
  // Get the appropriate Supabase client
  const supabase = useServerClient ? await createServerClient() : createBrowserClient();
  
  // Query audit logs for the contract with event type filter
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('contract_id', contractId)
    .eq('event_type', eventType)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to retrieve audit logs: ${error.message}`);
  }
  
  if (!data) {
    return [];
  }
  
  // Transform the database response to match our interface
  return data.map(log => ({
    id: log.id,
    contractId: log.contract_id,
    eventType: log.event_type,
    signatureMethod: log.signature_method,
    contractHash: log.contract_hash,
    signerIdentifier: log.signer_identifier,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    metadata: log.metadata,
    createdAt: log.created_at,
  }));
}

/**
 * Verifies that an audit log entry exists for a specific contract hash.
 * 
 * This function checks if there's an audit log entry with a matching contract
 * hash, which can be used to verify that a signature was recorded with a
 * specific version of the contract content.
 * 
 * @param contractId - The UUID of the contract
 * @param contractHash - The SHA-256 hash to verify
 * @param useServerClient - Whether to use server-side client (default: false)
 * @returns true if an audit log with the hash exists, false otherwise
 * @throws Error if the verification fails
 * 
 * @example
 * // Verify that a signature was recorded with a specific hash
 * const hashExists = await verifyAuditLogHash('contract-uuid', 'a3f5b8c9d2e1f4a7...');
 * if (hashExists) {
 *   console.log('Signature verified with matching hash');
 * }
 */
export async function verifyAuditLogHash(
  contractId: string,
  contractHash: string,
  useServerClient: boolean = false
): Promise<boolean> {
  // Get the appropriate Supabase client
  const supabase = useServerClient ? await createServerClient() : createBrowserClient();
  
  // Query for audit logs with matching hash
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id')
    .eq('contract_id', contractId)
    .eq('contract_hash', contractHash)
    .limit(1);
  
  if (error) {
    throw new Error(`Failed to verify audit log hash: ${error.message}`);
  }
  
  return data !== null && data.length > 0;
}
// Export a default audit logger instance
export const auditLogger = {
  log: createAuditLog,
  createAuditLog,
  getAuditLogsForContract,
  getLatestAuditLog,
  getAuditLogsByEventType,
  verifyAuditLogHash
};