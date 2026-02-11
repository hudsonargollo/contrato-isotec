/**
 * User Management Component
 * 
 * Comprehensive interface for tenant administrators to manage users, roles, and permissions.
 * Provides user invitation, role assignment, permission management, and user activity monitoring.
 * 
 * Requirements: 8.1, 8.4 - User Management and Permissions
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { useRBAC, useUserManagement } from '@/lib/hooks/use-rbac';
import { useTenant } from '@/lib/contexts/tenant-context';
import { UserRole, TenantUser, PERMISSIONS } from '@/lib/types/tenant';

interface UserManagementProps {
  onUserUpdated?: (user: TenantUser) => void;
}

interface UserWithDetails extends TenantUser {
  email?: string;
  full_name?: string;
  last_sign_in_at?: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onUserUpdated }) => {
  const { tenant } = useTenant();
  const { userRole, isLoading: rbacLoading } = useRBAC();
  const { 
    canInviteUsers, 
    canViewUsers, 
    canUpdateUsers, 
    canDeleteUsers,
    canManageUser,
    getManageableRoles 
  } = useUserManagement();

  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);

  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'user' as UserRole,
    permissions: [] as string[],
    send_invitation: true,
  });

  // Load users
  const loadUsers = useCallback(async () => {
    if (!tenant || !canViewUsers) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/tenants/${tenant.id}/users`);
      
      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [tenant, canViewUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Invite user
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    try {
      const response = await fetch(`/api/tenants/${tenant.id}/users/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteForm),
      });

      if (!response.ok) {
        throw new Error('Failed to invite user');
      }

      // Reset form and reload users
      setInviteForm({
        email: '',
        role: 'user',
        permissions: [],
        send_invitation: true,
      });
      setShowInviteForm(false);
      await loadUsers();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite user');
    }
  };

  // Update user role
  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    if (!tenant) return;

    try {
      const response = await fetch(`/api/tenants/${tenant.id}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      await loadUsers();
      onUserUpdated?.(await response.json());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  // Remove user
  const handleRemoveUser = async (userId: string) => {
    if (!tenant || !confirm('Are you sure you want to remove this user?')) return;

    try {
      const response = await fetch(`/api/tenants/${tenant.id}/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove user');
      }

      await loadUsers();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user');
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: UserRole) => {
    const colors = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || colors.user;
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  if (rbacLoading || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando usuários...</p>
        </div>
      </div>
    );
  }

  if (!canViewUsers) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Você não tem permissão para visualizar usuários.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie usuários, funções e permissões do seu tenant.
          </p>
        </div>
        {canInviteUsers && (
          <Button onClick={() => setShowInviteForm(true)}>
            Convidar Usuário
          </Button>
        )}
      </div>

      {/* Invite User Form */}
      {showInviteForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Convidar Novo Usuário</h3>
          <form onSubmit={handleInviteUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="usuario@exemplo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <select
                  id="role"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {getManageableRoles().map(role => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="send_invitation"
                checked={inviteForm.send_invitation}
                onChange={(e) => setInviteForm(prev => ({ ...prev, send_invitation: e.target.checked }))}
              />
              <Label htmlFor="send_invitation">Enviar email de convite</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteForm(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Enviar Convite
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Users List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Usuários do Tenant</h3>
        
        {users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-medium">
                      {user.email?.charAt(0).toUpperCase() || user.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">
                      {user.full_name || user.email || 'Usuário sem nome'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                    {user.last_sign_in_at && (
                      <div className="text-xs text-muted-foreground">
                        Último acesso: {new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge className={getRoleBadgeColor(user.role as UserRole)}>
                    {user.role}
                  </Badge>
                  <Badge className={getStatusBadgeColor(user.status)}>
                    {user.status}
                  </Badge>

                  {canUpdateUsers && canManageUser(user.role as UserRole) && (
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateUserRole(user.user_id, e.target.value as UserRole)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      {getManageableRoles().map(role => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                  )}

                  {canDeleteUsers && canManageUser(user.role as UserRole) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveUser(user.user_id)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Role Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Informações sobre Funções</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="font-medium">Owner</div>
            <div className="text-sm text-muted-foreground">
              Acesso completo a todas as funcionalidades, incluindo cobrança e configurações críticas.
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Admin</div>
            <div className="text-sm text-muted-foreground">
              Acesso a todas as funcionalidades exceto cobrança e configurações de owner.
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Manager</div>
            <div className="text-sm text-muted-foreground">
              Pode gerenciar usuários, leads, contratos e visualizar relatórios.
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">User</div>
            <div className="text-sm text-muted-foreground">
              Pode criar e editar leads, contratos e faturas. Visualizar relatórios básicos.
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Viewer</div>
            <div className="text-sm text-muted-foreground">
              Acesso somente leitura a leads, contratos, faturas e relatórios.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserManagement;