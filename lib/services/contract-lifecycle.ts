/**
 * Contract Lifecycle Tracking Service
 * 
 * Manages contract status transitions, renewal tracking, expiration monitoring,
 * and lifecycle analytics for the contract generation system.
 * 
 * Requirements: 7.4 - Contract lifecycle tracking
 */

import { createClient } from '@/lib/supabase/client';
import { TenantContext } from '@/lib/types/tenant';
import { GeneratedContract, ContractStatus, SignatureStatus } from '@/lib/types/contract-generation';

// Contract lifecycle event types
export const CONTRACT_LIFECYCLE_EVENTS = [
  'created',
  'approved',
  'sent_for_signature',
  'partially_signed',
  'fully_signed',
  'expired',
  'renewed',
  'cancelled',
  'archived'
] as const;

export type ContractLifecycleEvent = typeof CONTRACT_LIFECYCLE_EVENTS[number];

// Contract lifecycle tracking interfaces
export interface ContractLifecycleEntry {
  id: string;
  tenant_id: string;
  contract_id: string;
  event_type: ContractLifecycleEvent;
  previous_status?: ContractStatus;
  new_status: ContractStatus;
  event_data: Record<string, any>;
  triggered_by: string;
  created_at: Date;
}

export interface ContractRenewalAlert {
  id: string;
  tenant_id: string;
  contract_id: string;
  contract_number: string;
  customer_name: string;
  renewal_date: Date;
  days_until_renewal: number;
  alert_type: 'warning' | 'urgent' | 'overdue';
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: Date;
  created_at: Date;
}

export interface ContractExpirationAlert {
  id: string;
  tenant_id: string;
  contract_id: string;
  contract_number: string;
  customer_name: string;
  expires_at: Date;
  days_until_expiration: number;
  alert_type: 'warning' | 'urgent' | 'expired';
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: Date;
  created_at: Date;
}

export interface ContractLifecycleStats {
  total_contracts: number;
  active_contracts: number;
  expired_contracts: number;
  pending_signature: number;
  fully_signed: number;
  average_signing_time_days: number;
  renewal_alerts: number;
  expiration_alerts: number;
  contracts_by_status: Record<ContractStatus, number>;
  monthly_creation_trend: Array<{
    month: string;
    count: number;
  }>;
}

export interface ContractLifecycleFilters {
  status?: ContractStatus[];
  signature_status?: SignatureStatus[];
  date_range?: {
    start: Date;
    end: Date;
  };
  customer_id?: string;
  template_id?: string;
  expires_within_days?: number;
  renewal_within_days?: number;
}

export class ContractLifecycleService {
  private supabase = createClient();
  private tenantContext: TenantContext;

  constructor(tenantContext: TenantContext) {
    this.tenantContext = tenantContext;
  }

  /**
   * Track a contract lifecycle event
   */
  async trackLifecycleEvent(
    contractId: string,
    eventType: ContractLifecycleEvent,
    eventData: Record<string, any> = {},
    previousStatus?: ContractStatus,
    newStatus?: ContractStatus
  ): Promise<ContractLifecycleEntry> {
    const { data, error } = await this.supabase
      .from('contract_lifecycle_events')
      .insert({
        tenant_id: this.tenantContext.tenant_id,
        contract_id: contractId,
        event_type: eventType,
        previous_status: previousStatus,
        new_status: newStatus,
        event_data: eventData,
        triggered_by: this.tenantContext.user_id
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to track lifecycle event: ${error.message}`);
    }

    return this.mapDatabaseToLifecycleEntry(data);
  }

  /**
   * Update contract status with lifecycle tracking
   */
  async updateContractStatus(
    contractId: string,
    newStatus: ContractStatus,
    eventData: Record<string, any> = {}
  ): Promise<GeneratedContract> {
    // Get current contract to track previous status
    const { data: currentContract, error: fetchError } = await this.supabase
      .from('generated_contracts')
      .select('status')
      .eq('id', contractId)
      .eq('tenant_id', this.tenantContext.tenant_id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch current contract: ${fetchError.message}`);
    }

    const previousStatus = currentContract.status as ContractStatus;

    // Update contract status
    const { data: updatedContract, error: updateError } = await this.supabase
      .from('generated_contracts')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId)
      .eq('tenant_id', this.tenantContext.tenant_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update contract status: ${updateError.message}`);
    }

    // Track lifecycle event
    const eventType = this.getEventTypeFromStatusChange(previousStatus, newStatus);
    await this.trackLifecycleEvent(
      contractId,
      eventType,
      { ...eventData, status_change: { from: previousStatus, to: newStatus } },
      previousStatus,
      newStatus
    );

    return this.mapDatabaseToGeneratedContract(updatedContract);
  }

  /**
   * Get contract lifecycle history
   */
  async getContractLifecycleHistory(contractId: string): Promise<ContractLifecycleEntry[]> {
    const { data, error } = await this.supabase
      .from('contract_lifecycle_events')
      .select(`
        *,
        triggered_by_user:auth.users!contract_lifecycle_events_triggered_by_fkey(email, raw_user_meta_data)
      `)
      .eq('contract_id', contractId)
      .eq('tenant_id', this.tenantContext.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch lifecycle history: ${error.message}`);
    }

    return data.map(this.mapDatabaseToLifecycleEntry);
  }

  /**
   * Get contracts requiring renewal attention
   */
  async getRenewalAlerts(daysAhead: number = 30): Promise<ContractRenewalAlert[]> {
    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + daysAhead);

    const { data, error } = await this.supabase
      .from('generated_contracts')
      .select(`
        id,
        contract_number,
        renewal_date,
        customer_data,
        created_at
      `)
      .eq('tenant_id', this.tenantContext.tenant_id)
      .not('renewal_date', 'is', null)
      .lte('renewal_date', alertDate.toISOString())
      .in('status', ['signed', 'approved'])
      .order('renewal_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch renewal alerts: ${error.message}`);
    }

    return data.map(contract => {
      const renewalDate = new Date(contract.renewal_date);
      const daysUntilRenewal = Math.ceil((renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      return {
        id: `renewal_${contract.id}`,
        tenant_id: this.tenantContext.tenant_id,
        contract_id: contract.id,
        contract_number: contract.contract_number,
        customer_name: contract.customer_data?.name || 'Unknown Customer',
        renewal_date: renewalDate,
        days_until_renewal: daysUntilRenewal,
        alert_type: daysUntilRenewal <= 7 ? 'urgent' : daysUntilRenewal <= 0 ? 'overdue' : 'warning',
        is_acknowledged: false,
        created_at: new Date()
      } as ContractRenewalAlert;
    });
  }

  /**
   * Get contracts requiring expiration attention
   */
  async getExpirationAlerts(daysAhead: number = 30): Promise<ContractExpirationAlert[]> {
    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + daysAhead);

    const { data, error } = await this.supabase
      .from('generated_contracts')
      .select(`
        id,
        contract_number,
        expires_at,
        customer_data,
        created_at
      `)
      .eq('tenant_id', this.tenantContext.tenant_id)
      .not('expires_at', 'is', null)
      .lte('expires_at', alertDate.toISOString())
      .neq('status', 'expired')
      .order('expires_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch expiration alerts: ${error.message}`);
    }

    return data.map(contract => {
      const expirationDate = new Date(contract.expires_at);
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      return {
        id: `expiration_${contract.id}`,
        tenant_id: this.tenantContext.tenant_id,
        contract_id: contract.id,
        contract_number: contract.contract_number,
        customer_name: contract.customer_data?.name || 'Unknown Customer',
        expires_at: expirationDate,
        days_until_expiration: daysUntilExpiration,
        alert_type: daysUntilExpiration <= 7 ? 'urgent' : daysUntilExpiration <= 0 ? 'expired' : 'warning',
        is_acknowledged: false,
        created_at: new Date()
      } as ContractExpirationAlert;
    });
  }

  /**
   * Process expired contracts
   */
  async processExpiredContracts(): Promise<{ processed: number; errors: string[] }> {
    const now = new Date();
    const errors: string[] = [];
    let processed = 0;

    // Find contracts that have expired
    const { data: expiredContracts, error } = await this.supabase
      .from('generated_contracts')
      .select('id, contract_number, expires_at')
      .eq('tenant_id', this.tenantContext.tenant_id)
      .lt('expires_at', now.toISOString())
      .neq('status', 'expired');

    if (error) {
      throw new Error(`Failed to fetch expired contracts: ${error.message}`);
    }

    // Update each expired contract
    for (const contract of expiredContracts || []) {
      try {
        await this.updateContractStatus(
          contract.id,
          'expired',
          { 
            expired_at: now.toISOString(),
            auto_expired: true 
          }
        );
        processed++;
      } catch (err) {
        errors.push(`Failed to expire contract ${contract.contract_number}: ${err}`);
      }
    }

    return { processed, errors };
  }

  /**
   * Get contract lifecycle statistics
   */
  async getLifecycleStats(filters?: ContractLifecycleFilters): Promise<ContractLifecycleStats> {
    let query = this.supabase
      .from('generated_contracts')
      .select('status, signature_status, created_at, signed_at, expires_at, renewal_date')
      .eq('tenant_id', this.tenantContext.tenant_id);

    // Apply filters
    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters?.signature_status?.length) {
      query = query.in('signature_status', filters.signature_status);
    }
    if (filters?.date_range) {
      query = query
        .gte('created_at', filters.date_range.start.toISOString())
        .lte('created_at', filters.date_range.end.toISOString());
    }

    const { data: contracts, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch lifecycle stats: ${error.message}`);
    }

    // Calculate statistics
    const totalContracts = contracts?.length || 0;
    const activeContracts = contracts?.filter(c => 
      !['expired', 'cancelled'].includes(c.status)
    ).length || 0;
    const expiredContracts = contracts?.filter(c => c.status === 'expired').length || 0;
    const pendingSignature = contracts?.filter(c => 
      c.signature_status === 'pending' || c.signature_status === 'sent'
    ).length || 0;
    const fullySignedContracts = contracts?.filter(c => 
      c.signature_status === 'fully_signed'
    ) || [];

    // Calculate average signing time
    const signingTimes = fullySignedContracts
      .filter(c => c.signed_at)
      .map(c => {
        const created = new Date(c.created_at);
        const signed = new Date(c.signed_at);
        return (signed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      });

    const averageSigningTime = signingTimes.length > 0 
      ? signingTimes.reduce((sum, time) => sum + time, 0) / signingTimes.length
      : 0;

    // Count contracts by status
    const contractsByStatus = contracts?.reduce((acc, contract) => {
      acc[contract.status as ContractStatus] = (acc[contract.status as ContractStatus] || 0) + 1;
      return acc;
    }, {} as Record<ContractStatus, number>) || {};

    // Get monthly creation trend (last 12 months)
    const monthlyTrend = this.calculateMonthlyTrend(contracts || []);

    // Get alert counts
    const renewalAlerts = await this.getRenewalAlerts();
    const expirationAlerts = await this.getExpirationAlerts();

    return {
      total_contracts: totalContracts,
      active_contracts: activeContracts,
      expired_contracts: expiredContracts,
      pending_signature: pendingSignature,
      fully_signed: fullySignedContracts.length,
      average_signing_time_days: Math.round(averageSigningTime * 10) / 10,
      renewal_alerts: renewalAlerts.length,
      expiration_alerts: expirationAlerts.length,
      contracts_by_status: contractsByStatus,
      monthly_creation_trend: monthlyTrend
    };
  }

  /**
   * List contracts with lifecycle filters
   */
  async listContracts(filters?: ContractLifecycleFilters): Promise<GeneratedContract[]> {
    let query = this.supabase
      .from('generated_contracts')
      .select(`
        *,
        template:contract_templates(name, category),
        customer:leads(contact_info)
      `)
      .eq('tenant_id', this.tenantContext.tenant_id);

    // Apply filters
    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters?.signature_status?.length) {
      query = query.in('signature_status', filters.signature_status);
    }
    if (filters?.date_range) {
      query = query
        .gte('created_at', filters.date_range.start.toISOString())
        .lte('created_at', filters.date_range.end.toISOString());
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters?.template_id) {
      query = query.eq('template_id', filters.template_id);
    }
    if (filters?.expires_within_days) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.expires_within_days);
      query = query.lte('expires_at', futureDate.toISOString());
    }
    if (filters?.renewal_within_days) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.renewal_within_days);
      query = query.lte('renewal_date', futureDate.toISOString());
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list contracts: ${error.message}`);
    }

    return data?.map(this.mapDatabaseToGeneratedContract) || [];
  }

  // Private helper methods
  private getEventTypeFromStatusChange(
    previousStatus: ContractStatus,
    newStatus: ContractStatus
  ): ContractLifecycleEvent {
    const statusEventMap: Record<ContractStatus, ContractLifecycleEvent> = {
      'draft': 'created',
      'pending_approval': 'created',
      'approved': 'approved',
      'sent': 'sent_for_signature',
      'signed': 'fully_signed',
      'cancelled': 'cancelled',
      'expired': 'expired'
    };

    return statusEventMap[newStatus] || 'created';
  }

  private calculateMonthlyTrend(contracts: any[]): Array<{ month: string; count: number }> {
    const monthCounts: Record<string, number> = {};
    const now = new Date();
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
      monthCounts[monthKey] = 0;
    }

    // Count contracts by month
    contracts.forEach(contract => {
      const monthKey = contract.created_at.substring(0, 7);
      if (monthCounts.hasOwnProperty(monthKey)) {
        monthCounts[monthKey]++;
      }
    });

    return Object.entries(monthCounts).map(([month, count]) => ({
      month,
      count
    }));
  }

  private mapDatabaseToLifecycleEntry(data: any): ContractLifecycleEntry {
    return {
      id: data.id,
      tenant_id: data.tenant_id,
      contract_id: data.contract_id,
      event_type: data.event_type,
      previous_status: data.previous_status,
      new_status: data.new_status,
      event_data: data.event_data || {},
      triggered_by: data.triggered_by,
      created_at: new Date(data.created_at)
    };
  }

  private mapDatabaseToGeneratedContract(data: any): GeneratedContract {
    return {
      id: data.id,
      tenant_id: data.tenant_id,
      generation_request_id: data.generation_request_id,
      contract_number: data.contract_number,
      template_id: data.template_id,
      template_version: data.template_version,
      customer_id: data.customer_id,
      customer_data: data.customer_data || {},
      contract_content: data.contract_content,
      contract_variables: data.contract_variables || {},
      file_url: data.file_url,
      file_size: data.file_size,
      file_format: data.file_format,
      file_hash: data.file_hash,
      status: data.status,
      is_final: data.is_final,
      signature_status: data.signature_status,
      signature_requests: data.signature_requests || [],
      signed_at: data.signed_at ? new Date(data.signed_at) : undefined,
      expires_at: data.expires_at ? new Date(data.expires_at) : undefined,
      renewal_date: data.renewal_date ? new Date(data.renewal_date) : undefined,
      created_by: data.created_by,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }
}

/**
 * Create a contract lifecycle service instance
 */
export const createContractLifecycleService = (tenantContext: TenantContext) => {
  return new ContractLifecycleService(tenantContext);
};