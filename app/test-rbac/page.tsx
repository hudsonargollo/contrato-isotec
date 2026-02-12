/**
 * RBAC Test Page
 * 
 * Test page for verifying role-based access control functionality.
 * Demonstrates permission checking, role management, and user access control.
 * 
 * Requirements: 8.1, 8.4 - User Management and Permissions
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Force dynamic rendering for this test page since it uses authentication hooks
export const dynamic = 'force-dynamic';

export default function RBACTestPage() {
  const [mounted, setMounted] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'permissions'>('overview');

  // Ensure component is mounted before accessing hooks
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock RBAC data for testing - this prevents build-time errors
  const mockRBACData = {
    userId: 'test-user-id',
    userRole: 'admin',
    tenantRole: 'owner',
    loading: false,
    error: null,
    isAdmin: true,
    isSuperAdmin: false,
    canAccessAdmin: true,
    isOwner: true,
    isTenantAdmin: true,
    canManageTenant: true,
    canInviteUsers: true,
  };

  // Test permission checking
  const testPermissionCheck = (permission: string) => {
    try {
      // Mock permission check - in real app this would use actual RBAC hooks
      const result = ['users.view', 'users.create', 'leads.view', 'contracts.view', 'analytics.view'].includes(permission);
      setTestResults(prev => ({
        ...prev,
        [permission]: result
      }));
    } catch (err) {
      console.error('Error checking permission:', err);
      setTestResults(prev => ({
        ...prev,
        [permission]: false
      }));
    }
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

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando informações de RBAC...</p>
        </div>
      </div>
    );
  }

  const safeTestResults = testResults || {};

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Teste de RBAC</h1>
        <p className="text-muted-foreground">
          Teste o sistema de controle de acesso baseado em funções (RBAC).
        </p>
      </div>

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
            <h2 className="text-xl font-semibold mb-4">Informações do Usuário Atual (Mock)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Função</div>
                <Badge className="text-sm">
                  {mockRBACData.userRole || mockRBACData.tenantRole || 'Não definida'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Tipo</div>
                <div className="text-sm">
                  {mockRBACData.userRole ? 'Sistema' : 'Tenant'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Nível de Acesso</div>
                <div className="text-sm">
                  {mockRBACData.isOwner && 'Owner'}
                  {mockRBACData.isAdmin && !mockRBACData.isOwner && 'Admin'}
                  {mockRBACData.isTenantAdmin && !mockRBACData.isAdmin && 'Tenant Admin'}
                  {!mockRBACData.isTenantAdmin && !mockRBACData.isAdmin && 'User'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Gerenciamento</div>
                <div className="text-sm">
                  {mockRBACData.canInviteUsers ? 'Pode convidar' : 'Não pode convidar'}
                </div>
              </div>
            </div>
          </Card>

          {/* Permission Testing */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Teste de Permissões</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {testPermissions.map((permission) => {
                  const hasPermission = ['users.view', 'users.create', 'leads.view', 'contracts.view', 'analytics.view'].includes(permission);
                  return (
                    <Button
                      key={permission}
                      size="sm"
                      variant="outline"
                      onClick={() => testPermissionCheck(permission)}
                      className={`text-left justify-start ${
                        hasPermission ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                      }`}
                    >
                      {permission}
                    </Button>
                  );
                })}
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Resultados dos Testes:</h3>
                <div className="space-y-1 text-sm">
                  {Object.entries(safeTestResults).map(([permission, result]) => (
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
                    <Badge variant="default">Sim</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Convidar usuários:</span>
                    <Badge variant={mockRBACData.canInviteUsers ? 'default' : 'secondary'}>
                      {mockRBACData.canInviteUsers ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Gerenciar usuários:</span>
                    <Badge variant="default">Sim</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Gerenciar configurações:</span>
                    <Badge variant="default">Sim</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Funções Gerenciáveis</h3>
                <div className="space-y-1 text-sm">
                  {(['viewer', 'user', 'manager', 'admin', 'owner']).map(role => (
                    <div key={role} className="flex justify-between">
                      <span>{role}:</span>
                      <Badge variant={role === mockRBACData.userRole || role === mockRBACData.tenantRole ? 'default' : 'secondary'}>
                        {role === mockRBACData.userRole || role === mockRBACData.tenantRole ? 'Tem função' : 'Não tem função'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* All Permissions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Informações de Acesso</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Funções do Sistema</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Admin do Sistema:</span>
                    <Badge variant={mockRBACData.isAdmin ? 'default' : 'secondary'}>
                      {mockRBACData.isAdmin ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Super Admin:</span>
                    <Badge variant={mockRBACData.isSuperAdmin ? 'default' : 'secondary'}>
                      {mockRBACData.isSuperAdmin ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Acesso Admin:</span>
                    <Badge variant={mockRBACData.canAccessAdmin ? 'default' : 'secondary'}>
                      {mockRBACData.canAccessAdmin ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Funções do Tenant</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Owner do Tenant:</span>
                    <Badge variant={mockRBACData.isOwner ? 'default' : 'secondary'}>
                      {mockRBACData.isOwner ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Admin do Tenant:</span>
                    <Badge variant={mockRBACData.isTenantAdmin ? 'default' : 'secondary'}>
                      {mockRBACData.isTenantAdmin ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Pode Gerenciar Tenant:</span>
                    <Badge variant={mockRBACData.canManageTenant ? 'default' : 'secondary'}>
                      {mockRBACData.canManageTenant ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">
            Funcionalidade de gerenciamento de usuários será implementada aqui.
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Esta é uma página de teste que demonstra a funcionalidade RBAC.
              Em produção, esta página carregaria os hooks reais de RBAC e exibiria dados reais do usuário.
            </p>
          </div>
        </Card>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Gerenciador de Permissões</h2>
          <p className="text-muted-foreground">
            Funcionalidade de gerenciamento de permissões será implementada aqui.
          </p>
          <div className="mt-4">
            <h3 className="font-medium mb-2">Informações Atuais (Mock):</h3>
            <div className="space-y-1 text-sm">
              <div>Função do Sistema: {mockRBACData.userRole || 'Nenhuma'}</div>
              <div>Função do Tenant: {mockRBACData.tenantRole || 'Nenhuma'}</div>
              <div>ID do Usuário: {mockRBACData.userId || 'Não disponível'}</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Aviso:</strong> Esta página usa dados mock para evitar erros de build.
              Em produção, conecte aos hooks reais de RBAC para funcionalidade completa.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}