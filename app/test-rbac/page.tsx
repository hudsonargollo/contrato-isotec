/**
 * RBAC Test Page
 * 
 * Test page for verifying role-based access control functionality.
 * Demonstrates permission checking, role management, and user access control.
 * 
 * Requirements: 8.1, 8.4 - User Management and Permissions
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRBAC, usePermissions, useRole, useUserManagement } from '@/lib/hooks/use-rbac';
import UserManagement from '@/components/rbac/UserManagement';
import PermissionManager from '@/components/rbac/PermissionManager';
import { UserRole, PERMISSIONS } from '@/lib/types/tenant';

// Force dynamic rendering for this test page since it uses authentication hooks
export const dynamic = 'force-dynamic';

export default function RBACTestPage() {
  const {
    userRole,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageUser,
    isOwner,
    isAdmin,
    isManager,
    isLoading,
    error,
    checkPermission,
  } = useRBAC();

  const { canInviteUsers, canViewUsers, canUpdateUsers, canDeleteUsers } = useUserManagement();
  
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'permissions'>('overview');

  // Test permission checking
  const testPermissionCheck = async (permission: string) => {
    const result = await checkPermission(permission);
    setTestResults(prev => ({
      ...prev,
      [permission]: result
    }));
  };

  // Test permissions to check
  const testPermissions = [
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'leads.view',
    'leads.create',
    'contracts.view',
    'contracts.create',
    'invoices.view',
    'analytics.view',
    'settings.view',
    'settings.branding',
    'billing.view',
    'billing.manage'
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando informações de RBAC...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Teste de RBAC</h1>
        <p className="text-muted-foreground">
          Teste o sistema de controle de acesso baseado em funções (RBAC).
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'users'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Gerenciar Usuários
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'permissions'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Permissões
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Current User Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Informações do Usuário Atual</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Função</div>
                <Badge className="text-sm">
                  {userRole || 'Não definida'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Permissões</div>
                <div className="text-sm">{permissions?.length || 0} permissões</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Nível de Acesso</div>
                <div className="text-sm">
                  {isOwner && 'Owner'}
                  {isAdmin && !isOwner && 'Admin'}
                  {isManager && !isAdmin && 'Manager'}
                  {!isManager && 'User/Viewer'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Gerenciamento</div>
                <div className="text-sm">
                  {canInviteUsers ? 'Pode convidar' : 'Não pode convidar'}
                </div>
              </div>
            </div>
          </Card>

          {/* Permission Testing */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Teste de Permissões</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {testPermissions.map((permission) => (
                  <Button
                    key={permission}
                    size="sm"
                    variant="outline"
                    onClick={() => testPermissionCheck(permission)}
                    className={`text-left justify-start ${
                      hasPermission(permission) ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                    }`}
                  >
                    {permission}
                  </Button>
                ))}
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Resultados dos Testes:</h3>
                <div className="space-y-1 text-sm">
                  {Object.entries(testResults).map(([permission, result]) => (
                    <div key={permission} className="flex justify-between">
                      <span>{permission}:</span>
                      <Badge variant={result ? 'default' : 'secondary'}>
                        {result ? 'Permitido' : 'Negado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Role Management Capabilities */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Capacidades de Gerenciamento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Gerenciamento de Usuários</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Visualizar usuários:</span>
                    <Badge variant={canViewUsers ? 'default' : 'secondary'}>
                      {canViewUsers ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Convidar usuários:</span>
                    <Badge variant={canInviteUsers ? 'default' : 'secondary'}>
                      {canInviteUsers ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Atualizar usuários:</span>
                    <Badge variant={canUpdateUsers ? 'default' : 'secondary'}>
                      {canUpdateUsers ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Remover usuários:</span>
                    <Badge variant={canDeleteUsers ? 'default' : 'secondary'}>
                      {canDeleteUsers ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Funções Gerenciáveis</h3>
                <div className="space-y-1 text-sm">
                  {(['viewer', 'user', 'manager', 'admin', 'owner'] as UserRole[]).map(role => (
                    <div key={role} className="flex justify-between">
                      <span>{role}:</span>
                      <Badge variant={canManageUser(role) ? 'default' : 'secondary'}>
                        {canManageUser(role) ? 'Pode gerenciar' : 'Não pode gerenciar'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* All Permissions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Todas as Permissões do Usuário</h2>
            <div className="flex flex-wrap gap-2">
              {permissions?.map((permission) => (
                <Badge key={permission} variant="outline" className="text-xs">
                  {permission}
                </Badge>
              )) || []}
            </div>
            {(!permissions || permissions.length === 0) && (
              <p className="text-muted-foreground">Nenhuma permissão atribuída.</p>
            )}
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <UserManagement />
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Gerenciador de Permissões</h2>
          <PermissionManager
            currentRole={userRole || 'user'}
            currentPermissions={permissions}
            readOnly={!isAdmin}
          />
        </Card>
      )}
    </div>
  );
}