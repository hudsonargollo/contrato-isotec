/**
 * Role-Based Access Control (RBAC) Service
 * 
 * Comprehensive RBAC system for managing user roles, permissions, and access control.
 * Supports tenant-specific permissions, role hierarchies, and dynamic permission checking.
 * 
 * Requirements: 8.1, 8.4 - User Management and Permissions
 */

import { createClient } from '@/lib/supabase/server';
import { 
  UserRole, 
  Permission, 
  PERMISSIONS, 
  ROLE_PERMISSIONS, 
  getUserPermissions, 
  hasPermission,
  TenantUser 
} from '@/lib/types/tenant';

export interface UserContext {
  user_id: string;
  tenant_id: string;
  role: UserRole;
  permissions: string[];
  is_active: boolean;
}

export interface PermissionCheck {
  permission: string;
  resource_id?: string;
  resource_type?: string;
  context?: Record<string, any>;
}

export interface RoleHierarchy {
  role: UserRole;
  inherits_from: UserRole[];
  level: number;
}

/**
 * RBAC Service Class
 * Manages role-based access control for the platform
 */
export class RBACService {
  private static instance: RBACService;
  private roleHierarchy: Record<UserRole, RoleHierarchy>;

  private constructor() {
    // Define role hierarchy (higher level = more permissions)
    this.roleHierarchy = {
      viewer: { role: 'viewer', inherits_from: [], level: 1 },
      user: { role: 'user', inherits_from: ['viewer'], level: 2 },
      manager: { role: 'manager', inherits_from: ['user'], level: 3 },
      admin: { role: 'admin', inherits_from: ['manager'], level: 4 },
      owner: { role: 'owner', inherits_from: ['admin'], level: 5 },
    };
  }

  public static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  /**
   * Get user context with permissions
   */
  async getUserContext(userId: string, tenantId: string): Promise<UserContext | null> {
    const supabase = await createClient();

    const { data: tenantUser, error } = await supabase
      .from('tenant_users')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single();

    if (error || !tenantUser) {
      return null;
    }

    const permissions = getUserPermissions(
      tenantUser.role as UserRole,
      tenantUser.permissions || []
    );

    return {
      user_id: userId,
      tenant_id: tenantId,
      role: tenantUser.role as UserRole,
      permissions,
      is_active: tenantUser.status === 'active',
    };
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(
    userId: string,
    tenantId: string,
    permissionCheck: PermissionCheck
  ): Promise<boolean> {
    const userContext = await this.getUserContext(userId, tenantId);
    
    if (!userContext || !userContext.is_active) {
      return false;
    }

    // Check basic permission
    if (!hasPermission(userContext.permissions, permissionCheck.permission)) {
      return false;
    }

    // Additional context-based checks
    if (permissionCheck.resource_id && permissionCheck.resource_type) {
      return this.checkResourcePermission(userContext, permissionCheck);
    }

    return true;
  }

  /**
   * Check resource-specific permissions
   */
  private async checkResourcePermission(
    userContext: UserContext,
    permissionCheck: PermissionCheck
  ): Promise<boolean> {
    const { resource_type, resource_id, context } = permissionCheck;

    // Resource ownership checks
    if (resource_type && resource_id) {
      const supabase = await createClient();

      // Check if user owns or is assigned to the resource
      switch (resource_type) {
        case 'lead':
          const { data: lead } = await supabase
            .from('leads')
            .select('assigned_to, created_by')
            .eq('id', resource_id)
            .eq('tenant_id', userContext.tenant_id)
            .single();

          if (lead && (lead.assigned_to === userContext.user_id || lead.created_by === userContext.user_id)) {
            return true;
          }
          break;

        case 'contract':
          const { data: contract } = await supabase
            .from('contracts')
            .select('assigned_to, created_by')
            .eq('id', resource_id)
            .eq('tenant_id', userContext.tenant_id)
            .single();

          if (contract && (contract.assigned_to === userContext.user_id || contract.created_by === userContext.user_id)) {
            return true;
          }
          break;

        case 'invoice':
          const { data: invoice } = await supabase
            .from('invoices')
            .select('created_by')
            .eq('id', resource_id)
            .eq('tenant_id', userContext.tenant_id)
            .single();

          if (invoice && invoice.created_by === userContext.user_id) {
            return true;
          }
          break;
      }
    }

    // Role-based access for sensitive operations
    const sensitivePermissions = [
      'users.delete',
      'billing.manage',
      'settings.branding',
      'analytics.export'
    ];

    if (sensitivePermissions.includes(permissionCheck.permission)) {
      return this.roleHierarchy[userContext.role].level >= 3; // Manager level or above
    }

    return true;
  }

  /**
   * Check if user can perform action on another user
   */
  async canManageUser(
    managerId: string,
    targetUserId: string,
    tenantId: string,
    action: string
  ): Promise<boolean> {
    const managerContext = await this.getUserContext(managerId, tenantId);
    const targetContext = await this.getUserContext(targetUserId, tenantId);

    if (!managerContext || !targetContext) {
      return false;
    }

    // Can't manage users of equal or higher role level
    const managerLevel = this.roleHierarchy[managerContext.role].level;
    const targetLevel = this.roleHierarchy[targetContext.role].level;

    if (targetLevel >= managerLevel) {
      return false;
    }

    // Check specific action permissions
    const actionPermissions: Record<string, string> = {
      'invite': 'users.invite',
      'update': 'users.update',
      'delete': 'users.delete',
      'view': 'users.view',
    };

    const requiredPermission = actionPermissions[action];
    if (!requiredPermission) {
      return false;
    }

    return hasPermission(managerContext.permissions, requiredPermission);
  }

  /**
   * Get all permissions for a role including inherited permissions
   */
  getRolePermissions(role: UserRole): string[] {
    const directPermissions = ROLE_PERMISSIONS[role] || [];
    const inheritedPermissions: string[] = [];

    // Get permissions from inherited roles
    const hierarchy = this.roleHierarchy[role];
    if (hierarchy.inherits_from.length > 0) {
      hierarchy.inherits_from.forEach(inheritedRole => {
        inheritedPermissions.push(...this.getRolePermissions(inheritedRole));
      });
    }

    // Combine and deduplicate permissions
    return [...new Set([...directPermissions, ...inheritedPermissions])];
  }

  /**
   * Validate role assignment
   */
  canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
    const assignerLevel = this.roleHierarchy[assignerRole].level;
    const targetLevel = this.roleHierarchy[targetRole].level;

    // Can only assign roles of lower level
    return assignerLevel > targetLevel;
  }

  /**
   * Get available roles for assignment
   */
  getAssignableRoles(assignerRole: UserRole): UserRole[] {
    const assignerLevel = this.roleHierarchy[assignerRole].level;
    
    return Object.values(this.roleHierarchy)
      .filter(hierarchy => hierarchy.level < assignerLevel)
      .map(hierarchy => hierarchy.role);
  }

  /**
   * Audit permission check
   */
  async auditPermissionCheck(
    userId: string,
    tenantId: string,
    permissionCheck: PermissionCheck,
    result: boolean,
    context?: Record<string, any>
  ): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('audit_logs')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        action: 'permission.check',
        resource_type: 'permission',
        resource_id: permissionCheck.permission,
        metadata: {
          permission: permissionCheck.permission,
          resource_type: permissionCheck.resource_type,
          resource_id: permissionCheck.resource_id,
          result,
          context: context || permissionCheck.context
        }
      });
  }

  /**
   * Bulk permission check
   */
  async checkMultiplePermissions(
    userId: string,
    tenantId: string,
    permissions: string[]
  ): Promise<Record<string, boolean>> {
    const userContext = await this.getUserContext(userId, tenantId);
    const results: Record<string, boolean> = {};

    if (!userContext || !userContext.is_active) {
      permissions.forEach(permission => {
        results[permission] = false;
      });
      return results;
    }

    permissions.forEach(permission => {
      results[permission] = hasPermission(userContext.permissions, permission);
    });

    return results;
  }

  /**
   * Get permission groups for UI organization
   */
  getPermissionGroups(): Record<string, { label: string; permissions: Permission[] }> {
    return {
      users: {
        label: 'Gerenciamento de Usuários',
        permissions: Object.keys(PERMISSIONS).filter(p => p.startsWith('users.')) as Permission[]
      },
      leads: {
        label: 'Gerenciamento de Leads',
        permissions: Object.keys(PERMISSIONS).filter(p => p.startsWith('leads.')) as Permission[]
      },
      contracts: {
        label: 'Gerenciamento de Contratos',
        permissions: Object.keys(PERMISSIONS).filter(p => p.startsWith('contracts.')) as Permission[]
      },
      invoices: {
        label: 'Gerenciamento de Faturas',
        permissions: Object.keys(PERMISSIONS).filter(p => p.startsWith('invoices.')) as Permission[]
      },
      analytics: {
        label: 'Relatórios e Analytics',
        permissions: Object.keys(PERMISSIONS).filter(p => p.startsWith('analytics.')) as Permission[]
      },
      settings: {
        label: 'Configurações',
        permissions: Object.keys(PERMISSIONS).filter(p => p.startsWith('settings.')) as Permission[]
      },
      billing: {
        label: 'Cobrança',
        permissions: Object.keys(PERMISSIONS).filter(p => p.startsWith('billing.')) as Permission[]
      }
    };
  }
}

// Export singleton instance
export const rbacService = RBACService.getInstance();

// Utility functions
export const checkUserPermission = async (
  userId: string,
  tenantId: string,
  permission: string,
  resourceId?: string,
  resourceType?: string
): Promise<boolean> => {
  return rbacService.checkPermission(userId, tenantId, {
    permission,
    resource_id: resourceId,
    resource_type: resourceType
  });
};

export const getUserRoleLevel = (role: UserRole): number => {
  const service = RBACService.getInstance();
  return service['roleHierarchy'][role].level;
};

export const canUserManageRole = (userRole: UserRole, targetRole: UserRole): boolean => {
  const service = RBACService.getInstance();
  return service.canAssignRole(userRole, targetRole);
};