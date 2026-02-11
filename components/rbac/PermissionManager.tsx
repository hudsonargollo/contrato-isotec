/**
 * Permission Manager Component
 * 
 * Interface for managing user permissions and role assignments.
 * Provides granular permission control and role-based access management.
 * 
 * Requirements: 8.1, 8.4 - User Management and Permissions
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRBAC, usePermissionGroups } from '@/lib/hooks/use-rbac';
import { UserRole, PERMISSIONS, ROLE_PERMISSIONS } from '@/lib/types/tenant';

interface PermissionManagerProps {
  userId?: string;
  currentRole?: UserRole;
  currentPermissions?: string[];
  onPermissionsChange?: (permissions: string[]) => void;
  onRoleChange?: (role: UserRole) => void;
  readOnly?: boolean;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  userId,
  currentRole = 'user',
  currentPermissions = [],
  onPermissionsChange,
  onRoleChange,
  readOnly = false,
}) => {
  const { userRole, canManageUser } = useRBAC();
  const permissionGroups = usePermissionGroups();
  
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [customPermissions, setCustomPermissions] = useState<string[]>(currentPermissions);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  // Update role permissions when selected role changes
  useEffect(() => {
    const permissions = ROLE_PERMISSIONS[selectedRole] || [];
    setRolePermissions(permissions);
  }, [selectedRole]);

  // Get all effective permissions (role + custom)
  const effectivePermissions = [...new Set([...rolePermissions, ...customPermissions])];

  // Handle role change
  const handleRoleChange = (newRole: UserRole) => {
    if (readOnly || !canManageUser(newRole)) return;
    
    setSelectedRole(newRole);
    onRoleChange?.(newRole);
  };

  // Handle custom permission toggle
  const handlePermissionToggle = (permission: string) => {
    if (readOnly) return;

    const isRolePermission = rolePermissions.includes(permission);
    const isCustomPermission = customPermissions.includes(permission);

    let newCustomPermissions: string[];

    if (isRolePermission) {
      // If it's a role permission, we can only remove it by adding it to custom permissions as "denied"
      // For simplicity, we'll just show it as non-toggleable
      return;
    }

    if (isCustomPermission) {
      // Remove from custom permissions
      newCustomPermissions = customPermissions.filter(p => p !== permission);
    } else {
      // Add to custom permissions
      newCustomPermissions = [...customPermissions, permission];
    }

    setCustomPermissions(newCustomPermissions);
    onPermissionsChange?.(newCustomPermissions);
  };

  // Check if permission is enabled
  const isPermissionEnabled = (permission: string) => {
    return effectivePermissions.includes(permission);
  };

  // Check if permission can be toggled
  const canTogglePermission = (permission: string) => {
    if (readOnly) return false;
    
    // Can't toggle role-based permissions (they come with the role)
    const isRolePermission = rolePermissions.includes(permission);
    return !isRolePermission;
  };

  // Get available roles for assignment
  const getAvailableRoles = (): UserRole[] => {
    if (!userRole) return [];
    
    const allRoles: UserRole[] = ['viewer', 'user', 'manager', 'admin', 'owner'];
    return allRoles.filter(role => canManageUser(role));
  };

  return (
    <div className="space-y-6">
      {/* Role Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Função do Usuário</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {getAvailableRoles().map((role) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                disabled={readOnly}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  selectedRole === role
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                } ${readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="font-medium capitalize">{role}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {ROLE_PERMISSIONS[role]?.length || 0} permissões
                </div>
              </button>
            ))}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <strong>Função atual:</strong> {selectedRole}
            <br />
            <strong>Permissões da função:</strong> {rolePermissions.length}
            <br />
            <strong>Permissões personalizadas:</strong> {customPermissions.length}
            <br />
            <strong>Total de permissões:</strong> {effectivePermissions.length}
          </div>
        </div>
      </Card>

      {/* Permission Groups */}
      <div className="space-y-4">
        {Object.entries(permissionGroups).map(([groupKey, group]) => (
          <Card key={groupKey} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{group.label}</h3>
              <Badge variant={group.hasAny ? 'default' : 'secondary'}>
                {group.permissions.filter(p => isPermissionEnabled(p)).length} / {group.permissions.length}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.permissions.map((permission) => {
                const isEnabled = isPermissionEnabled(permission);
                const canToggle = canTogglePermission(permission);
                const isRolePermission = rolePermissions.includes(permission);
                
                return (
                  <div
                    key={permission}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {PERMISSIONS[permission as keyof typeof PERMISSIONS]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {permission}
                      </div>
                      {isRolePermission && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Função
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {canToggle ? (
                        <button
                          onClick={() => handlePermissionToggle(permission)}
                          className={`w-10 h-6 rounded-full transition-colors ${
                            isEnabled
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full transition-transform ${
                              isEnabled ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      ) : (
                        <div
                          className={`w-10 h-6 rounded-full ${
                            isEnabled ? 'bg-green-500' : 'bg-gray-300'
                          } opacity-50`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full ${
                              isEnabled ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Permission Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Resumo das Permissões</h3>
        <div className="space-y-3">
          <div>
            <strong>Permissões da Função ({selectedRole}):</strong>
            <div className="flex flex-wrap gap-1 mt-2">
              {rolePermissions.map((permission) => (
                <Badge key={permission} variant="secondary" className="text-xs">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
          
          {customPermissions.length > 0 && (
            <div>
              <strong>Permissões Personalizadas:</strong>
              <div className="flex flex-wrap gap-1 mt-2">
                {customPermissions.map((permission) => (
                  <Badge key={permission} variant="default" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-3 border-t">
            <strong>Total de Permissões Ativas: {effectivePermissions.length}</strong>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PermissionManager;