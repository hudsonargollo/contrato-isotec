/**
 * Contract Template Management Service
 * 
 * Service layer for managing contract templates, versions, and customizations
 * with multi-tenant support and comprehensive validation.
 * 
 * Requirements: 7.2 - Contract template management
 */

import { createClient } from '@/lib/supabase/server';
import { 
  ContractTemplate, 
  ContractTemplateVersion, 
  ContractTemplateCustomization,
  CreateContractTemplate,
  UpdateContractTemplate,
  CreateTemplateVersion,
  CreateTemplateCustomization,
  UpdateTemplateCustomization,
  TemplateFilters,
  TemplateWithVersions,
  PaginatedTemplates,
  TemplateUsageStats,
  validateTemplateContent,
  getNextVersion,
  compareVersions
} from '@/lib/types/contract-templates';
import { TenantContext } from '@/lib/types/tenant';

export class ContractTemplateService {
  private supabase;
  private tenantContext: TenantContext;

  constructor(tenantContext: TenantContext) {
    this.supabase = createClient();
    this.tenantContext = tenantContext;
  }

  /**
   * Create a new contract template
   */
  async createTemplate(data: CreateContractTemplate): Promise<ContractTemplate> {
    // Validate template content against variables
    const validationErrors = validateTemplateContent(data.template_content, data.template_variables || []);
    if (validationErrors.length > 0) {
      throw new Error(`Template validation failed: ${validationErrors.join(', ')}`);
    }

    // Set tenant context
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const templateData = {
      ...data,
      tenant_id: this.tenantContext.tenant_id,
      created_by: this.tenantContext.user_id
    };

    const { data: template, error } = await this.supabase
      .from('contract_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }

    // Create initial version
    await this.createVersion({
      template_id: template.id,
      version: template.version,
      version_notes: 'Initial version',
      template_content: template.template_content,
      template_variables: template.template_variables,
      signature_fields: template.signature_fields,
      approval_workflow: template.approval_workflow,
      is_published: true,
      published_at: new Date(),
      created_by: this.tenantContext.user_id
    });

    return this.mapDatabaseToTemplate(template);
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string): Promise<TemplateWithVersions | null> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: template, error } = await this.supabase
      .from('contract_templates')
      .select(`
        *,
        versions:contract_template_versions(*),
        customization:contract_template_customizations(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get template: ${error.message}`);
    }

    return this.mapDatabaseToTemplateWithVersions(template);
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, data: UpdateContractTemplate): Promise<ContractTemplate> {
    // Validate template content if provided
    if (data.template_content && data.template_variables) {
      const validationErrors = validateTemplateContent(data.template_content, data.template_variables);
      if (validationErrors.length > 0) {
        throw new Error(`Template validation failed: ${validationErrors.join(', ')}`);
      }
    }

    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    // Get current template to check if version should be incremented
    const currentTemplate = await this.getTemplate(id);
    if (!currentTemplate) {
      throw new Error('Template not found');
    }

    let updateData = { ...data };

    // Auto-increment version if content changed
    if (data.template_content && data.template_content !== currentTemplate.template_content) {
      updateData.version = getNextVersion(currentTemplate.version, 'patch');
    }

    const { data: template, error } = await this.supabase
      .from('contract_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }

    return this.mapDatabaseToTemplate(template);
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<void> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { error } = await this.supabase
      .from('contract_templates')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  /**
   * List templates with filtering and pagination
   */
  async listTemplates(filters: TemplateFilters = {}): Promise<PaginatedTemplates> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    let query = this.supabase
      .from('contract_templates')
      .select(`
        *,
        versions:contract_template_versions(*),
        customization:contract_template_customizations(*)
      `, { count: 'exact' });

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.is_default !== undefined) {
      query = query.eq('is_default', filters.is_default);
    }

    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after.toISOString());
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before.toISOString());
    }

    if (filters.search_query) {
      query = query.or(`name.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    // Apply pagination
    const offset = (filters.page - 1) * filters.limit;
    query = query.range(offset, offset + filters.limit - 1);

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data: templates, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list templates: ${error.message}`);
    }

    const mappedTemplates = templates?.map(template => 
      this.mapDatabaseToTemplateWithVersions(template)
    ) || [];

    return {
      templates: mappedTemplates,
      total: count || 0,
      page: filters.page,
      limit: filters.limit,
      total_pages: Math.ceil((count || 0) / filters.limit)
    };
  }

  /**
   * Create template version
   */
  async createVersion(data: CreateTemplateVersion): Promise<ContractTemplateVersion> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const versionData = {
      ...data,
      created_by: this.tenantContext.user_id
    };

    const { data: version, error } = await this.supabase
      .from('contract_template_versions')
      .insert(versionData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create template version: ${error.message}`);
    }

    return this.mapDatabaseToVersion(version);
  }

  /**
   * Get template versions
   */
  async getTemplateVersions(templateId: string): Promise<ContractTemplateVersion[]> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: versions, error } = await this.supabase
      .from('contract_template_versions')
      .select('*')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get template versions: ${error.message}`);
    }

    return versions?.map(version => this.mapDatabaseToVersion(version)) || [];
  }

  /**
   * Publish template version
   */
  async publishVersion(versionId: string): Promise<ContractTemplateVersion> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: version, error } = await this.supabase
      .from('contract_template_versions')
      .update({
        is_published: true,
        published_at: new Date().toISOString()
      })
      .eq('id', versionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to publish version: ${error.message}`);
    }

    return this.mapDatabaseToVersion(version);
  }

  /**
   * Create or update template customization
   */
  async upsertCustomization(data: CreateTemplateCustomization): Promise<ContractTemplateCustomization> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const customizationData = {
      ...data,
      tenant_id: this.tenantContext.tenant_id,
      created_by: this.tenantContext.user_id
    };

    const { data: customization, error } = await this.supabase
      .from('contract_template_customizations')
      .upsert(customizationData, {
        onConflict: 'tenant_id,template_id'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert customization: ${error.message}`);
    }

    return this.mapDatabaseToCustomization(customization);
  }

  /**
   * Get template customization
   */
  async getCustomization(templateId: string): Promise<ContractTemplateCustomization | null> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: customization, error } = await this.supabase
      .from('contract_template_customizations')
      .select('*')
      .eq('template_id', templateId)
      .eq('tenant_id', this.tenantContext.tenant_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get customization: ${error.message}`);
    }

    return this.mapDatabaseToCustomization(customization);
  }

  /**
   * Set template as default
   */
  async setAsDefault(templateId: string): Promise<ContractTemplate> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: template, error } = await this.supabase
      .from('contract_templates')
      .update({ is_default: true })
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to set template as default: ${error.message}`);
    }

    return this.mapDatabaseToTemplate(template);
  }

  /**
   * Get default template
   */
  async getDefaultTemplate(): Promise<TemplateWithVersions | null> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: template, error } = await this.supabase
      .from('contract_templates')
      .select(`
        *,
        versions:contract_template_versions(*),
        customization:contract_template_customizations(*)
      `)
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get default template: ${error.message}`);
    }

    return this.mapDatabaseToTemplateWithVersions(template);
  }

  /**
   * Get template usage statistics
   */
  async getUsageStats(templateId: string): Promise<TemplateUsageStats> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    // This would typically query contract generation records
    // For now, returning mock data structure
    const stats: TemplateUsageStats = {
      template_id: templateId,
      total_contracts: 0,
      contracts_this_month: 0,
      contracts_this_year: 0,
      success_rate: 100,
      last_used: undefined
    };

    // TODO: Implement actual statistics queries when contract generation is implemented
    return stats;
  }

  /**
   * Clone template
   */
  async cloneTemplate(templateId: string, newName: string): Promise<ContractTemplate> {
    const originalTemplate = await this.getTemplate(templateId);
    if (!originalTemplate) {
      throw new Error('Template not found');
    }

    const cloneData: CreateContractTemplate = {
      tenant_id: this.tenantContext.tenant_id,
      name: newName,
      description: `Clone of ${originalTemplate.name}`,
      version: '1.0.0',
      template_content: originalTemplate.template_content,
      template_variables: originalTemplate.template_variables,
      category: originalTemplate.category,
      is_default: false,
      is_active: true,
      signature_fields: originalTemplate.signature_fields,
      approval_workflow: originalTemplate.approval_workflow,
      tags: [...originalTemplate.tags, 'cloned'],
      metadata: { ...originalTemplate.metadata, cloned_from: templateId }
    };

    return this.createTemplate(cloneData);
  }

  /**
   * Validate template
   */
  async validateTemplate(templateId: string): Promise<{ isValid: boolean; errors: string[] }> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      return { isValid: false, errors: ['Template not found'] };
    }

    const errors = validateTemplateContent(template.template_content, template.template_variables);
    
    // Additional validations
    if (template.signature_fields.length === 0) {
      errors.push('Template must have at least one signature field');
    }

    // Validate signature field positions don't overlap
    const positions = template.signature_fields.map(field => field.position);
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const pos1 = positions[i];
        const pos2 = positions[j];
        
        if (pos1.page === pos2.page) {
          const overlap = !(
            pos1.x + pos1.width < pos2.x ||
            pos2.x + pos2.width < pos1.x ||
            pos1.y + pos1.height < pos2.y ||
            pos2.y + pos2.height < pos1.y
          );
          
          if (overlap) {
            errors.push(`Signature fields overlap on page ${pos1.page}`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Private mapping methods
  private mapDatabaseToTemplate(data: any): ContractTemplate {
    return {
      id: data.id,
      tenant_id: data.tenant_id,
      name: data.name,
      description: data.description,
      version: data.version,
      template_content: data.template_content,
      template_variables: data.template_variables || [],
      category: data.category,
      is_default: data.is_default,
      is_active: data.is_active,
      signature_fields: data.signature_fields || [],
      approval_workflow: data.approval_workflow || [],
      tags: data.tags || [],
      metadata: data.metadata || {},
      created_by: data.created_by,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  private mapDatabaseToTemplateWithVersions(data: any): TemplateWithVersions {
    const template = this.mapDatabaseToTemplate(data);
    
    return {
      ...template,
      versions: data.versions?.map((v: any) => this.mapDatabaseToVersion(v)) || [],
      customization: data.customization ? this.mapDatabaseToCustomization(data.customization) : undefined
    };
  }

  private mapDatabaseToVersion(data: any): ContractTemplateVersion {
    return {
      id: data.id,
      template_id: data.template_id,
      version: data.version,
      version_notes: data.version_notes,
      template_content: data.template_content,
      template_variables: data.template_variables || [],
      signature_fields: data.signature_fields || [],
      approval_workflow: data.approval_workflow || [],
      is_published: data.is_published,
      published_at: data.published_at ? new Date(data.published_at) : undefined,
      created_by: data.created_by,
      created_at: new Date(data.created_at)
    };
  }

  private mapDatabaseToCustomization(data: any): ContractTemplateCustomization {
    return {
      id: data.id,
      tenant_id: data.tenant_id,
      template_id: data.template_id,
      custom_variables: data.custom_variables || {},
      custom_styling: data.custom_styling || {},
      custom_content_overrides: data.custom_content_overrides || {},
      is_active: data.is_active,
      created_by: data.created_by,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }
}

// Utility functions for template management
export const createTemplateService = (tenantContext: TenantContext) => {
  return new ContractTemplateService(tenantContext);
};

export const getTemplateVariableValue = (
  variableName: string, 
  contractData: Record<string, any>, 
  customVariables: Record<string, any> = {}
): string => {
  // Check custom variables first, then contract data
  const value = customVariables[variableName] ?? contractData[variableName];
  
  if (value === undefined || value === null) {
    return `{{${variableName}}}`;
  }
  
  return String(value);
};

export const populateTemplate = (
  templateContent: string,
  contractData: Record<string, any>,
  customVariables: Record<string, any> = {}
): string => {
  return templateContent.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
    const trimmedName = variableName.trim();
    return getTemplateVariableValue(trimmedName, contractData, customVariables);
  });
};