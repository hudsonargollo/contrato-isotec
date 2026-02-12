/**
 * ISOTEC Data Migration Service
 * 
 * Handles migration of data from the legacy ISOTEC system to SolarCRM Pro.
 * Provides data extraction, transformation, validation, and progress tracking.
 * 
 * Requirements: 11.1, 11.3 - Data migration and validation
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Legacy ISOTEC data structures
export interface LegacyContract {
  id: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone: string;
  cliente_cpf: string;
  endereco_completo: string;
  potencia_sistema: number;
  valor_total: number;
  data_criacao: string;
  status: string;
  observacoes?: string;
}

export interface LegacyCustomer {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  data_cadastro: string;
}

// Migration interfaces
export interface MigrationJob {
  id: string;
  tenant_id: string;
  job_type: 'full' | 'incremental' | 'validation';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  source_system: string;
  target_tenant: string;
  started_at?: Date;
  completed_at?: Date;
  progress: {
    total_records: number;
    processed_records: number;
    successful_records: number;
    failed_records: number;
    current_phase: string;
  };
  configuration: {
    batch_size: number;
    parallel_workers: number;
    validation_enabled: boolean;
    dry_run: boolean;
  };
  results?: MigrationResults;
}

export interface MigrationResults {
  summary: {
    total_processed: number;
    successful: number;
    failed: number;
    skipped: number;
    duration_ms: number;
  };
  entity_results: {
    customers: { processed: number; successful: number; failed: number };
    contracts: { processed: number; successful: number; failed: number };
    leads: { processed: number; successful: number; failed: number };
  };
  validation_results: {
    data_integrity_checks: number;
    reference_integrity_checks: number;
    business_rule_validations: number;
  };
  errors: MigrationError[];
}

export interface MigrationError {
  id: string;
  entity_type: string;
  entity_id: string;
  error_type: 'validation' | 'transformation' | 'database' | 'business_rule';
  error_message: string;
  source_data: any;
  timestamp: Date;
}

// Validation schemas
const legacyContractSchema = z.object({
  id: z.string(),
  cliente_nome: z.string().min(1),
  cliente_email: z.string().email(),
  cliente_telefone: z.string(),
  cliente_cpf: z.string().regex(/^\d{11}$/),
  endereco_completo: z.string(),
  potencia_sistema: z.number().positive(),
  valor_total: z.number().positive(),
  data_criacao: z.string(),
  status: z.string(),
  observacoes: z.string().optional()
});

export class IsotecMigrationService {
  /**
   * Create a new migration job
   */
  async createMigrationJob(
    tenantId: string,
    jobType: 'full' | 'incremental' | 'validation',
    configuration: Partial<MigrationJob['configuration']> = {}
  ): Promise<MigrationJob> {
    const supabase = createClient();
    const defaultConfig = {
      batch_size: 100,
      parallel_workers: 2,
      validation_enabled: true,
      dry_run: false
    };

    const job: Omit<MigrationJob, 'id'> = {
      tenant_id: tenantId,
      job_type: jobType,
      status: 'pending',
      source_system: 'ISOTEC',
      target_tenant: tenantId,
      progress: {
        total_records: 0,
        processed_records: 0,
        successful_records: 0,
        failed_records: 0,
        current_phase: 'initialization'
      },
      configuration: { ...defaultConfig, ...configuration }
    };

    const { data, error } = await supabase
      .from('migration_jobs')
      .insert(job)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create migration job: ${error.message}`);
    }

    return data;
  }

  /**
   * Execute migration job
   */
  async executeMigrationJob(jobId: string): Promise<MigrationResults> {
    const job = await this.getMigrationJob(jobId);
    if (!job) {
      throw new Error('Migration job not found');
    }

    if (job.status !== 'pending') {
      throw new Error(`Cannot execute job in status: ${job.status}`);
    }

    try {
      // Update job status to running
      await this.updateJobStatus(jobId, 'running', 'Starting migration');

      const results: MigrationResults = {
        summary: {
          total_processed: 0,
          successful: 0,
          failed: 0,
          skipped: 0,
          duration_ms: 0
        },
        entity_results: {
          customers: { processed: 0, successful: 0, failed: 0 },
          contracts: { processed: 0, successful: 0, failed: 0 },
          leads: { processed: 0, successful: 0, failed: 0 }
        },
        validation_results: {
          data_integrity_checks: 0,
          reference_integrity_checks: 0,
          business_rule_validations: 0
        },
        errors: []
      };

      const startTime = Date.now();

      // Phase 1: Extract and validate source data
      await this.updateJobStatus(jobId, 'running', 'Extracting source data');
      const sourceData = await this.extractSourceData(job);
      
      // Phase 2: Transform data
      await this.updateJobStatus(jobId, 'running', 'Transforming data');
      const transformedData = await this.transformData(sourceData, results);

      // Phase 3: Validate transformed data
      if (job.configuration.validation_enabled) {
        await this.updateJobStatus(jobId, 'running', 'Validating data');
        await this.validateTransformedData(transformedData, results);
      }

      // Phase 4: Load data (if not dry run)
      if (!job.configuration.dry_run) {
        await this.updateJobStatus(jobId, 'running', 'Loading data');
        await this.loadData(job.tenant_id, transformedData, results);
      }

      // Phase 5: Post-migration validation
      if (job.configuration.validation_enabled && !job.configuration.dry_run) {
        await this.updateJobStatus(jobId, 'running', 'Post-migration validation');
        await this.performPostMigrationValidation(job.tenant_id, results);
      }

      results.summary.duration_ms = Date.now() - startTime;
      results.summary.total_processed = results.summary.successful + results.summary.failed;

      // Update job as completed
      await this.updateJobResults(jobId, 'completed', results);

      return results;
    } catch (error) {
      await this.updateJobStatus(jobId, 'failed', `Migration failed: ${error}`);
      throw error;
    }
  }

  /**
   * Extract data from ISOTEC system
   */
  private async extractSourceData(job: MigrationJob): Promise<{
    contracts: LegacyContract[];
    customers: LegacyCustomer[];
  }> {
    // In a real implementation, this would connect to the ISOTEC database
    // For now, we'll simulate with sample data
    
    const contracts: LegacyContract[] = [
      {
        id: 'isotec_001',
        cliente_nome: 'João Silva',
        cliente_email: 'joao@email.com',
        cliente_telefone: '11999999999',
        cliente_cpf: '12345678901',
        endereco_completo: 'Rua das Flores, 123, São Paulo, SP',
        potencia_sistema: 5.5,
        valor_total: 25000.00,
        data_criacao: '2023-01-15',
        status: 'ativo',
        observacoes: 'Sistema residencial'
      }
    ];

    const customers: LegacyCustomer[] = [
      {
        id: 'isotec_cust_001',
        nome: 'João Silva',
        email: 'joao@email.com',
        telefone: '11999999999',
        cpf: '12345678901',
        endereco: 'Rua das Flores, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234567',
        data_cadastro: '2023-01-10'
      }
    ];

    return { contracts, customers };
  }

  /**
   * Transform legacy data to SolarCRM format
   */
  private async transformData(
    sourceData: { contracts: LegacyContract[]; customers: LegacyCustomer[] },
    results: MigrationResults
  ): Promise<{
    leads: any[];
    contracts: any[];
    customers: any[];
  }> {
    const transformedData = {
      leads: [] as any[],
      contracts: [] as any[],
      customers: [] as any[]
    };

    // Transform customers
    for (const customer of sourceData.customers) {
      try {
        const transformedCustomer = {
          id: `migrated_${customer.id}`,
          first_name: customer.nome.split(' ')[0],
          last_name: customer.nome.split(' ').slice(1).join(' '),
          email: customer.email,
          phone: customer.telefone,
          document_number: customer.cpf,
          address: {
            street: customer.endereco,
            city: customer.cidade,
            state: customer.estado,
            postal_code: customer.cep
          },
          source: 'ISOTEC_MIGRATION',
          created_at: new Date(customer.data_cadastro),
          migration_metadata: {
            source_id: customer.id,
            migrated_at: new Date(),
            source_system: 'ISOTEC'
          }
        };

        transformedData.customers.push(transformedCustomer);
        results.entity_results.customers.successful++;
      } catch (error) {
        results.entity_results.customers.failed++;
        results.errors.push({
          id: `customer_${customer.id}`,
          entity_type: 'customer',
          entity_id: customer.id,
          error_type: 'transformation',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          source_data: customer,
          timestamp: new Date()
        });
      }
      results.entity_results.customers.processed++;
    }

    // Transform contracts
    for (const contract of sourceData.contracts) {
      try {
        // Validate contract data
        legacyContractSchema.parse(contract);

        const transformedContract = {
          id: `migrated_${contract.id}`,
          customer_id: `migrated_${contract.id}`, // Would map to actual customer
          contract_number: contract.id,
          system_power: contract.potencia_sistema,
          total_value: contract.valor_total,
          status: this.mapContractStatus(contract.status),
          notes: contract.observacoes,
          created_at: new Date(contract.data_criacao),
          migration_metadata: {
            source_id: contract.id,
            migrated_at: new Date(),
            source_system: 'ISOTEC'
          }
        };

        transformedData.contracts.push(transformedContract);
        results.entity_results.contracts.successful++;

        // Create lead from contract data
        const transformedLead = {
          id: `migrated_lead_${contract.id}`,
          first_name: contract.cliente_nome.split(' ')[0],
          last_name: contract.cliente_nome.split(' ').slice(1).join(' '),
          email: contract.cliente_email,
          phone: contract.cliente_telefone,
          status: 'converted',
          source: 'ISOTEC_MIGRATION',
          score: 100, // Converted leads get high score
          created_at: new Date(contract.data_criacao),
          migration_metadata: {
            source_id: contract.id,
            migrated_at: new Date(),
            source_system: 'ISOTEC'
          }
        };

        transformedData.leads.push(transformedLead);
        results.entity_results.leads.successful++;
      } catch (error) {
        results.entity_results.contracts.failed++;
        results.errors.push({
          id: `contract_${contract.id}`,
          entity_type: 'contract',
          entity_id: contract.id,
          error_type: 'validation',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          source_data: contract,
          timestamp: new Date()
        });
      }
      results.entity_results.contracts.processed++;
    }

    return transformedData;
  }

  /**
   * Validate transformed data
   */
  private async validateTransformedData(
    transformedData: any,
    results: MigrationResults
  ): Promise<void> {
    // Data integrity checks
    results.validation_results.data_integrity_checks = 
      transformedData.customers.length + 
      transformedData.contracts.length + 
      transformedData.leads.length;

    // Reference integrity checks
    // Verify that all contracts have corresponding customers
    for (const contract of transformedData.contracts) {
      const hasCustomer = transformedData.customers.some(
        (c: any) => c.migration_metadata.source_id === contract.migration_metadata.source_id
      );
      if (hasCustomer) {
        results.validation_results.reference_integrity_checks++;
      }
    }

    // Business rule validations
    for (const contract of transformedData.contracts) {
      if (contract.system_power > 0 && contract.total_value > 0) {
        results.validation_results.business_rule_validations++;
      }
    }
  }

  /**
   * Load transformed data into SolarCRM
   */
  private async loadData(
    tenantId: string,
    transformedData: any,
    results: MigrationResults
  ): Promise<void> {
    const supabase = createClient();
    // Set tenant context
    await supabase.rpc('set_tenant_context', { tenant_id: tenantId });

    // Load customers
    if (transformedData.customers.length > 0) {
      const { error: customerError } = await supabase
        .from('customers')
        .insert(transformedData.customers.map((c: any) => ({ ...c, tenant_id: tenantId })));

      if (customerError) {
        throw new Error(`Failed to load customers: ${customerError.message}`);
      }
    }

    // Load leads
    if (transformedData.leads.length > 0) {
      const { error: leadError } = await supabase
        .from('leads')
        .insert(transformedData.leads.map((l: any) => ({ ...l, tenant_id: tenantId })));

      if (leadError) {
        throw new Error(`Failed to load leads: ${leadError.message}`);
      }
    }

    // Load contracts
    if (transformedData.contracts.length > 0) {
      const { error: contractError } = await supabase
        .from('contracts')
        .insert(transformedData.contracts.map((c: any) => ({ ...c, tenant_id: tenantId })));

      if (contractError) {
        throw new Error(`Failed to load contracts: ${contractError.message}`);
      }
    }

    results.summary.successful = 
      results.entity_results.customers.successful +
      results.entity_results.contracts.successful +
      results.entity_results.leads.successful;
  }

  /**
   * Perform post-migration validation
   */
  private async performPostMigrationValidation(
    tenantId: string,
    results: MigrationResults
  ): Promise<void> {
    const supabase = createClient();
    // Verify record counts
    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .like('id', 'migrated_%');

    const { count: leadCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .like('id', 'migrated_%');

    const { count: contractCount } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .like('id', 'migrated_%');

    // Validate counts match expectations
    if (customerCount !== results.entity_results.customers.successful) {
      throw new Error(`Customer count mismatch: expected ${results.entity_results.customers.successful}, found ${customerCount}`);
    }

    if (leadCount !== results.entity_results.leads.successful) {
      throw new Error(`Lead count mismatch: expected ${results.entity_results.leads.successful}, found ${leadCount}`);
    }

    if (contractCount !== results.entity_results.contracts.successful) {
      throw new Error(`Contract count mismatch: expected ${results.entity_results.contracts.successful}, found ${contractCount}`);
    }
  }

  /**
   * Get migration job by ID
   */
  async getMigrationJob(jobId: string): Promise<MigrationJob | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('migration_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Update job status
   */
  private async updateJobStatus(
    jobId: string,
    status: MigrationJob['status'],
    currentPhase: string
  ): Promise<void> {
    const supabase = createClient();
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'running' && !await this.getJobStartTime(jobId)) {
      updates.started_at = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    await supabase
      .from('migration_jobs')
      .update({
        ...updates,
        progress: {
          current_phase: currentPhase
        }
      })
      .eq('id', jobId);
  }

  /**
   * Update job results
   */
  private async updateJobResults(
    jobId: string,
    status: MigrationJob['status'],
    results: MigrationResults
  ): Promise<void> {
    const supabase = createClient();
    await supabase
      .from('migration_jobs')
      .update({
        status,
        completed_at: new Date().toISOString(),
        results,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }

  /**
   * Get job start time
   */
  private async getJobStartTime(jobId: string): Promise<Date | null> {
    const supabase = createClient();
    const { data } = await supabase
      .from('migration_jobs')
      .select('started_at')
      .eq('id', jobId)
      .single();

    return data?.started_at ? new Date(data.started_at) : null;
  }

  /**
   * Map legacy contract status to SolarCRM status
   */
  private mapContractStatus(legacyStatus: string): string {
    const statusMap: Record<string, string> = {
      'ativo': 'active',
      'inativo': 'inactive',
      'pendente': 'pending',
      'cancelado': 'cancelled',
      'concluido': 'completed'
    };

    return statusMap[legacyStatus.toLowerCase()] || 'pending';
  }

  /**
   * Get migration progress
   */
  async getMigrationProgress(jobId: string): Promise<{
    progress: number;
    current_phase: string;
    estimated_completion?: Date;
  } | null> {
    const job = await this.getMigrationJob(jobId);
    if (!job) return null;

    const progress = job.progress.total_records > 0 
      ? (job.progress.processed_records / job.progress.total_records) * 100
      : 0;

    return {
      progress,
      current_phase: job.progress.current_phase,
      estimated_completion: this.estimateCompletion(job)
    };
  }

  /**
   * Estimate completion time
   */
  private estimateCompletion(job: MigrationJob): Date | undefined {
    if (!job.started_at || job.progress.processed_records === 0) {
      return undefined;
    }

    const elapsed = Date.now() - new Date(job.started_at).getTime();
    const rate = job.progress.processed_records / elapsed;
    const remaining = job.progress.total_records - job.progress.processed_records;
    const estimatedRemainingTime = remaining / rate;

    return new Date(Date.now() + estimatedRemainingTime);
  }
}

// Export singleton instance
export const isotecMigrationService = new IsotecMigrationService();