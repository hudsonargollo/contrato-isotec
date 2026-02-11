/**
 * Authentication System Test Page
 * 
 * Demonstrates the enhanced authentication system with MFA support,
 * session management, and tenant context integration.
 */

'use client';

import React from 'react';
import { useSession } from '@/components/auth/SessionProvider';
import { useTenant } from '@/lib/contexts/tenant-context';
import { MFAManager } from '@/components/auth/MFAManager';
import { AuthGuard, RequireAuth } from '@/components/auth/AuthGuard';

function AuthTestContent() {
  const { 
    user, 
    session, 
    profile, 
    loading, 
    isAuthenticated, 
    isAdmin, 
    isSuperAdmin, 
    hasMFA,
    signOut 
  } = useSession();

  const { 
    tenant, 
    tenantUser, 
    loading: tenantLoading,
    hasPermission,
    hasFeature,
    isOwner,
    isAdmin: isTenantAdmin
  } = useTenant();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                Sistema de Autenticação - Teste
              </h1>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Session Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informações da Sessão
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Autenticado:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isAuthenticated ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Admin:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      isAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isAdmin ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Super Admin:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      isSuperAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isSuperAdmin ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">MFA Ativo:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      hasMFA ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {hasMFA ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Information */}
            {user && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Informações do Usuário
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="font-medium text-gray-500">ID</dt>
                      <dd className="mt-1 text-gray-900 font-mono text-sm">{user.id}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-gray-900">{user.email}</dd>
                    </div>
                    {profile && (
                      <>
                        <div>
                          <dt className="font-medium text-gray-500">Nome</dt>
                          <dd className="mt-1 text-gray-900">{profile.full_name}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-500">Função</dt>
                          <dd className="mt-1 text-gray-900">{profile.role}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                </div>
              </div>
            )}

            {/* Tenant Information */}
            {tenant && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Informações do Tenant
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="font-medium text-gray-500">Nome</dt>
                      <dd className="mt-1 text-gray-900">{tenant.name}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">Domínio</dt>
                      <dd className="mt-1 text-gray-900">{tenant.domain}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">Subdomínio</dt>
                      <dd className="mt-1 text-gray-900">{tenant.subdomain}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">Status</dt>
                      <dd className="mt-1 text-gray-900">{tenant.status}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* Tenant User Information */}
            {tenantUser && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Função no Tenant
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Função:</span>
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {tenantUser.role}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {tenantUser.status}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Permissões de Teste:</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">users.create:</span>
                        <span className={`ml-2 ${hasPermission('users.create') ? 'text-green-600' : 'text-red-600'}`}>
                          {hasPermission('users.create') ? '✓' : '✗'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">leads.view:</span>
                        <span className={`ml-2 ${hasPermission('leads.view') ? 'text-green-600' : 'text-red-600'}`}>
                          {hasPermission('leads.view') ? '✓' : '✗'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">contracts.create:</span>
                        <span className={`ml-2 ${hasPermission('contracts.create') ? 'text-green-600' : 'text-red-600'}`}>
                          {hasPermission('contracts.create') ? '✓' : '✗'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">analytics.view:</span>
                        <span className={`ml-2 ${hasPermission('analytics.view') ? 'text-green-600' : 'text-red-600'}`}>
                          {hasPermission('analytics.view') ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Features do Tenant:</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">CRM:</span>
                        <span className={`ml-2 ${hasFeature('crm') ? 'text-green-600' : 'text-red-600'}`}>
                          {hasFeature('crm') ? '✓' : '✗'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">WhatsApp:</span>
                        <span className={`ml-2 ${hasFeature('whatsapp') ? 'text-green-600' : 'text-red-600'}`}>
                          {hasFeature('whatsapp') ? '✓' : '✗'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Analytics:</span>
                        <span className={`ml-2 ${hasFeature('analytics') ? 'text-green-600' : 'text-red-600'}`}>
                          {hasFeature('analytics') ? '✓' : '✗'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">API:</span>
                        <span className={`ml-2 ${hasFeature('api') ? 'text-green-600' : 'text-red-600'}`}>
                          {hasFeature('api') ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MFA Management */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Gerenciamento MFA
              </h2>
              <MFAManager />
            </div>

            {/* Session Data */}
            {session && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Dados da Sessão (Debug)
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs text-gray-600 overflow-auto">
                    {JSON.stringify({
                      expires_at: session.expires_at,
                      expires_in: session.expires_in,
                      token_type: session.token_type,
                      user_id: session.user.id,
                      user_email: session.user.email
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthTestPage() {
  return (
    <RequireAuth>
      <AuthTestContent />
    </RequireAuth>
  );
}