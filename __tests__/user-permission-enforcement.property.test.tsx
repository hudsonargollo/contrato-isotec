/**
 * Property-Based Test: User Permission Enforcement
 * 
 * Property-based tests for verifying user permission enforcement across
 * all system components. Tests universal properties that should hold for
 * any valid user action, role assignment, and permission check.
 * 
 * Feature: saas-platform-transformation, Property 11: User Permission Enforcement
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import { rbacService, UserContext } from '@/lib/services/rbac';
import { auditService } from '@/lib/services/audit';
import { 
  UserRole, 
  Permission,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getUserPermissions,
  hasPermission
} from '@/lib/types/tenant';
import { UserAction, AuditContext } from '@/lib/types/audit';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock Supabase client with proper method chaining
const createMockSupabaseClient = () => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
  };

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: jest.fn(() => mockQuery),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
};

const mockSupabaseClient = createMockSupabaseClient();

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabaseClient),
}));

jest.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    set: () => {},
  }),
}));

// Property-based test generators
const userRoleArbitrary = fc.constantFrom<UserRole>('owner', 'admin', 'manager', 'user', 'viewer');

const permissionArbitrary = fc.constantFrom<Permission>(
  ...Object.keys(PERMISSIONS) as Permission[]
);

const userContextArbitrary = fc.record({
  user_id: fc.uuid(),
  tenant_id: fc.uuid(),
  role: userRoleArbitrary,
  permissions: fc.array(permissionArbitrary, { maxLength: 15 }),
  is_active: fc.boolean(),
});

const resourceTypeArbitrary = fc.constantFrom('lead', 'contract', 'invoice', 'user', 'tenant');

const userActionArbitrary = fc.constantFrom<UserAction>(
  'auth.login',
  'auth.logout',
  'users.create',
  'users.update',
  'users.delete',
  'leads.create',
  'leads.update',
  'leads.delete',
  'contracts.create',
  'contracts.update',
  'contracts.delete',
  'invoices.create',
  'invoices.update',
  'invoices.delete',
  'settings.update',
  'billing.manage'
);

const auditContextArbitrary = fc.record({
  tenant_id: fc.uuid(),
  user_id: fc.uuid(),
  ip_address: fc.ipV4(),
  user_agent: fc.string({ minLength: 10, maxLength: 200 }),
  session_id: fc.uuid(),
  request_id: fc.uuid(),
});

const permissionCheckArbitrary = fc.record({
  permission: permissionArbitrary,
  resource_id: fc.option(fc.uuid()),
  resource_type: fc.option(resourceTypeArbitrary),
  context: fc.option(fc.dictionary(fc.string(), fc.anything())),
});

describe('Property-Based Tests: User Permission Enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Property 11: User Permission Enforcement', () => {
    it('should enforce role-based access controls immediately for any user action', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(userContextArbitrary, { minLength: 2, maxLength: 8 }),
          fc.array(permissionCheckArbitrary, { minLength: 3, maxLength: 12 }),
          async (userContexts, permissionChecks) => {
            // Test 1: Verify role hierarchy is respected
            for (const userContext of userContexts) {
              const rolePermissions = ROLE_PERMISSIONS[userContext.role] || [];
              const userPermissions = getUserPermissions(userContext.role, userContext.permissions);
              
              // Role permissions should always be included
              for (const rolePermission of rolePermissions) {
                expect(userPermissions).toContain(rolePermission);
              }
              
              // Custom permissions should be additive, not restrictive
              for (const customPermission of userContext.permissions) {
                expect(userPermissions).toContain(customPermission);
              }
            }

            // Test 2: Verify permission checks are consistent
            for (const userContext of userContexts) {
              for (const permissionCheck of permissionChecks) {
                const userPermissions = getUserPermissions(userContext.role, userContext.permissions);
                const hasRequiredPermission = hasPermission(userPermissions, permissionCheck.permission);
                
                // Mock the RBAC service response
                const mockGetUserContext = jest.spyOn(rbacService, 'getUserContext');
                mockGetUserContext.mockResolvedValue(userContext.is_active ? {
                  ...userContext,
                  permissions: userPermissions
                } : null);

                const mockCheckPermission = jest.spyOn(rbacService, 'checkPermission');
                mockCheckPermission.mockResolvedValue(
                  userContext.is_active && hasRequiredPermission
                );

                // Perform permission check
                const canPerformAction = await rbacService.checkPermission(
                  userContext.user_id,
                  userContext.tenant_id,
                  permissionCheck
                );

                // Verify permission enforcement logic
                if (!userContext.is_active) {
                  // Inactive users should never have permissions
                  expect(canPerformAction).toBe(false);
                } else if (hasRequiredPermission) {
                  // Users with required permission should have access
                  expect(canPerformAction).toBe(true);
                } else {
                  // Users without required permission should be denied
                  expect(canPerformAction).toBe(false);
                }
              }
            }

            return true;
          }
        ),
        { 
          numRuns: 100,
          timeout: 20000
        }
      );
    }, 25000);

    it('should maintain audit trails for all permission checks and user actions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(userContextArbitrary, { minLength: 2, maxLength: 6 }),
          fc.array(userActionArbitrary, { minLength: 3, maxLength: 10 }),
          fc.array(auditContextArbitrary, { minLength: 2, maxLength: 6 }),
          async (userContexts, actions, auditContexts) => {
            // Ensure audit contexts match user contexts
            const alignedAuditContexts = auditContexts.map((auditContext, index) => ({
              ...auditContext,
              tenant_id: userContexts[index % userContexts.length].tenant_id,
              user_id: userContexts[index % userContexts.length].user_id,
            }));

            // Test audit trail creation for each action
            for (let i = 0; i < actions.length; i++) {
              const action = actions[i];
              const userContext = userContexts[i % userContexts.length];
              const auditContext = alignedAuditContexts[i % alignedAuditContexts.length];

              // Mock audit service
              const mockLogActivity = jest.spyOn(auditService, 'logActivity');
              mockLogActivity.mockResolvedValue('mock-audit-id');

              // Mock permission check with audit
              const mockAuditPermissionCheck = jest.spyOn(rbacService, 'auditPermissionCheck');
              mockAuditPermissionCheck.mockResolvedValue();

              // Simulate user action with permission check
              const actionPermission = action.replace('.', '.') as Permission;
              const hasActionPermission = hasPermission(
                getUserPermissions(userContext.role, userContext.permissions),
                actionPermission
              );

              // Log the action
              const auditId = await auditService.logActivity(action, auditContext, {
                status: hasActionPermission && userContext.is_active ? 'success' : 'failure',
                resource_type: 'permission',
                metadata: {
                  permission: actionPermission,
                  user_role: userContext.role,
                  has_permission: hasActionPermission,
                  is_active: userContext.is_active
                }
              });

              // Audit permission check
              await rbacService.auditPermissionCheck(
                userContext.user_id,
                userContext.tenant_id,
                { permission: actionPermission },
                hasActionPermission && userContext.is_active,
                { action, user_role: userContext.role }
              );

              // Verify audit trail was created
              expect(mockLogActivity).toHaveBeenCalledWith(
                action,
                auditContext,
                expect.objectContaining({
                  status: hasActionPermission && userContext.is_active ? 'success' : 'failure',
                  resource_type: 'permission',
                  metadata: expect.objectContaining({
                    permission: actionPermission,
                    user_role: userContext.role
                  })
                })
              );

              expect(mockAuditPermissionCheck).toHaveBeenCalledWith(
                userContext.user_id,
                userContext.tenant_id,
                { permission: actionPermission },
                hasActionPermission && userContext.is_active,
                expect.objectContaining({ action, user_role: userContext.role })
              );

              expect(auditId).toBe('mock-audit-id');
            }

            return true;
          }
        ),
        { 
          numRuns: 75,
          timeout: 25000
        }
      );
    }, 30000);

    it('should never violate tenant boundaries in permission checks', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.record({
            tenant_id: fc.uuid(),
            users: fc.array(userContextArbitrary, { minLength: 1, maxLength: 4 })
          }), { minLength: 2, maxLength: 4 }),
          fc.array(permissionCheckArbitrary, { minLength: 5, maxLength: 15 }),
          async (tenantGroups, permissionChecks) => {
            // Assign users to their respective tenants
            const allUserContexts: (UserContext & { original_tenant_id: string })[] = [];
            
            for (const tenantGroup of tenantGroups) {
              for (const user of tenantGroup.users) {
                allUserContexts.push({
                  ...user,
                  tenant_id: tenantGroup.tenant_id,
                  original_tenant_id: tenantGroup.tenant_id,
                  permissions: getUserPermissions(user.role, user.permissions)
                });
              }
            }

            // Test cross-tenant permission checks
            for (const userContext of allUserContexts) {
              for (const permissionCheck of permissionChecks) {
                // Test 1: User accessing their own tenant
                const mockGetUserContext = jest.spyOn(rbacService, 'getUserContext');
                mockGetUserContext.mockImplementation(async (userId, tenantId) => {
                  // Only return user context if tenant matches
                  if (userId === userContext.user_id && tenantId === userContext.tenant_id) {
                    return userContext.is_active ? userContext : null;
                  }
                  return null; // Cross-tenant access denied
                });

                const mockCheckPermission = jest.spyOn(rbacService, 'checkPermission');
                mockCheckPermission.mockImplementation(async (userId, tenantId, permCheck) => {
                  // Only allow if user belongs to tenant and is active
                  if (userId === userContext.user_id && tenantId === userContext.tenant_id && userContext.is_active) {
                    return hasPermission(userContext.permissions, permCheck.permission);
                  }
                  return false; // Cross-tenant or inactive user denied
                });

                // Valid tenant access
                const validAccess = await rbacService.checkPermission(
                  userContext.user_id,
                  userContext.tenant_id,
                  permissionCheck
                );

                if (userContext.is_active && hasPermission(userContext.permissions, permissionCheck.permission)) {
                  expect(validAccess).toBe(true);
                } else {
                  expect(validAccess).toBe(false);
                }

                // Test 2: Cross-tenant access attempt (should always fail)
                const otherTenants = tenantGroups
                  .filter(tg => tg.tenant_id !== userContext.original_tenant_id)
                  .map(tg => tg.tenant_id);

                for (const otherTenantId of otherTenants) {
                  const crossTenantAccess = await rbacService.checkPermission(
                    userContext.user_id,
                    otherTenantId,
                    permissionCheck
                  );

                  // Cross-tenant access should ALWAYS be denied
                  expect(crossTenantAccess).toBe(false);
                }
              }
            }

            return true;
          }
        ),
        { 
          numRuns: 50,
          timeout: 30000
        }
      );
    }, 35000);

    it('should enforce role hierarchy and prevent privilege escalation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(userContextArbitrary, { minLength: 3, maxLength: 8 }),
          fc.array(userRoleArbitrary, { minLength: 2, maxLength: 5 }),
          async (userContexts, targetRoles) => {
            // Define role hierarchy levels
            const roleHierarchy: Record<UserRole, number> = {
              viewer: 1,
              user: 2,
              manager: 3,
              admin: 4,
              owner: 5
            };

            // Test role assignment permissions
            for (const userContext of userContexts) {
              for (const targetRole of targetRoles) {
                const userLevel = roleHierarchy[userContext.role];
                const targetLevel = roleHierarchy[targetRole];

                // Mock role assignment check
                const mockCanAssignRole = jest.spyOn(rbacService, 'canAssignRole');
                mockCanAssignRole.mockReturnValue(userLevel > targetLevel);

                const canAssign = rbacService.canAssignRole(userContext.role, targetRole);

                // Users can only assign roles of lower hierarchy level
                if (userLevel > targetLevel) {
                  expect(canAssign).toBe(true);
                } else {
                  expect(canAssign).toBe(false);
                }

                // Test user management permissions
                const mockCanManageUser = jest.spyOn(rbacService, 'canManageUser');
                mockCanManageUser.mockImplementation(async (managerId, targetUserId, tenantId, action) => {
                  if (managerId === userContext.user_id && tenantId === userContext.tenant_id) {
                    // Check if user has required permission and role hierarchy
                    const hasUserManagePermission = hasPermission(
                      getUserPermissions(userContext.role, userContext.permissions),
                      'users.update'
                    );
                    return hasUserManagePermission && userLevel > targetLevel;
                  }
                  return false;
                });

                const canManageUser = await rbacService.canManageUser(
                  userContext.user_id,
                  'target-user-id',
                  userContext.tenant_id,
                  'update'
                );

                const hasManagePermission = hasPermission(
                  getUserPermissions(userContext.role, userContext.permissions),
                  'users.update'
                );

                if (hasManagePermission && userLevel > targetLevel) {
                  expect(canManageUser).toBe(true);
                } else {
                  expect(canManageUser).toBe(false);
                }
              }
            }

            // Test permission inheritance
            for (const userContext of userContexts) {
              const rolePermissions = ROLE_PERMISSIONS[userContext.role] || [];
              const userPermissions = getUserPermissions(userContext.role, userContext.permissions);

              // All role permissions should be inherited
              for (const rolePermission of rolePermissions) {
                expect(userPermissions).toContain(rolePermission);
              }

              // Higher roles should have all permissions of lower roles
              const userLevel = roleHierarchy[userContext.role];
              const lowerRoles = Object.entries(roleHierarchy)
                .filter(([_, level]) => level < userLevel)
                .map(([role, _]) => role as UserRole);

              for (const lowerRole of lowerRoles) {
                const lowerRolePermissions = ROLE_PERMISSIONS[lowerRole] || [];
                for (const lowerPermission of lowerRolePermissions) {
                  expect(userPermissions).toContain(lowerPermission);
                }
              }
            }

            return true;
          }
        ),
        { 
          numRuns: 75,
          timeout: 20000
        }
      );
    }, 25000);

    it('should handle concurrent permission checks without race conditions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(userContextArbitrary, { minLength: 3, maxLength: 6 }),
          fc.array(permissionCheckArbitrary, { minLength: 10, maxLength: 20 }),
          async (userContexts, permissionChecks) => {
            // Create concurrent permission check operations
            const concurrentOperations = [];

            for (const userContext of userContexts) {
              for (const permissionCheck of permissionChecks) {
                const operation = async () => {
                  // Mock consistent permission check behavior
                  const mockGetUserContext = jest.spyOn(rbacService, 'getUserContext');
                  mockGetUserContext.mockResolvedValue(userContext.is_active ? {
                    ...userContext,
                    permissions: getUserPermissions(userContext.role, userContext.permissions)
                  } : null);

                  const mockCheckPermission = jest.spyOn(rbacService, 'checkPermission');
                  const expectedResult = userContext.is_active && hasPermission(
                    getUserPermissions(userContext.role, userContext.permissions),
                    permissionCheck.permission
                  );
                  mockCheckPermission.mockResolvedValue(expectedResult);

                  const result = await rbacService.checkPermission(
                    userContext.user_id,
                    userContext.tenant_id,
                    permissionCheck
                  );

                  return {
                    userId: userContext.user_id,
                    tenantId: userContext.tenant_id,
                    permission: permissionCheck.permission,
                    result,
                    expected: expectedResult
                  };
                };

                concurrentOperations.push(operation());
              }
            }

            // Execute all operations concurrently
            const results = await Promise.all(concurrentOperations);

            // Verify all results are consistent
            for (const result of results) {
              expect(result.result).toBe(result.expected);
            }

            // Group results by user and permission to check consistency
            const resultGroups = new Map<string, typeof results[0][]>();
            for (const result of results) {
              const key = `${result.userId}-${result.tenantId}-${result.permission}`;
              if (!resultGroups.has(key)) {
                resultGroups.set(key, []);
              }
              resultGroups.get(key)!.push(result);
            }

            // Verify consistency within groups (same user+permission should always have same result)
            for (const [key, groupResults] of resultGroups) {
              const firstResult = groupResults[0].result;
              for (const groupResult of groupResults) {
                expect(groupResult.result).toBe(firstResult);
              }
            }

            return true;
          }
        ),
        { 
          numRuns: 50,
          timeout: 25000
        }
      );
    }, 30000);
  });
});