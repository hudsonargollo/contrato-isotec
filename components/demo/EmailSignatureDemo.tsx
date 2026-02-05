/**
 * EmailSignature Demo Component
 * Demonstrates the enhanced error handling for the signature flow
 * 
 * Requirements: 12.5, 9.2, 9.3
 */

'use client';

import React, { useState } from 'react';
import { EmailSignature } from '@/components/contract/EmailSignature';
import { ToastProvider } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Wifi } from 'lucide-react';

// Mock API responses for demo
const mockResponses = {
  success: {
    send: { ok: true, json: async () => ({ expiresAt: '2024-01-01T12:00:00Z', code: '123456' }) },
    verify: { ok: true, json: async () => ({ success: true }) }
  },
  networkError: {
    send: Promise.reject(new Error('Network error')),
    verify: Promise.reject(new Error('Network error'))
  },
  rateLimitError: {
    send: { ok: false, status: 429, json: async () => ({ error: 'Too many requests' }) },
    verify: { ok: false, status: 429, json: async () => ({ error: 'Too many requests' }) }
  },
  invalidCodeError: {
    send: { ok: true, json: async () => ({ expiresAt: '2024-01-01T12:00:00Z' }) },
    verify: { ok: false, status: 422, json: async () => ({ error: 'Invalid code' }) }
  },
  expiredCodeError: {
    send: { ok: true, json: async () => ({ expiresAt: '2024-01-01T12:00:00Z' }) },
    verify: { ok: false, status: 410, json: async () => ({ error: 'Code expired' }) }
  },
  serverError: {
    send: { ok: false, status: 500, json: async () => ({ error: 'Internal server error' }) },
    verify: { ok: false, status: 500, json: async () => ({ error: 'Internal server error' }) }
  }
};

export function EmailSignatureDemo() {
  const [selectedScenario, setSelectedScenario] = useState<keyof typeof mockResponses>('success');
  const [key, setKey] = useState(0); // Force re-render of EmailSignature

  // Mock fetch function
  const mockFetch = (scenario: keyof typeof mockResponses) => {
    return ((url: string) => {
      if (url.includes('/send')) {
        const response = mockResponses[scenario].send;
        return Promise.resolve(response);
      } else if (url.includes('/verify')) {
        const response = mockResponses[scenario].verify;
        return Promise.resolve(response);
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  };

  const handleScenarioChange = (scenario: keyof typeof mockResponses) => {
    setSelectedScenario(scenario);
    setKey(prev => prev + 1); // Force re-render
    
    // Mock the fetch function
    global.fetch = mockFetch(scenario) as any;
  };

  const scenarios = [
    { key: 'success', label: 'Sucesso', description: 'Fluxo normal de assinatura', color: 'bg-green-100 text-green-800' },
    { key: 'networkError', label: 'Erro de Rede', description: 'Falha na conexão', color: 'bg-red-100 text-red-800' },
    { key: 'rateLimitError', label: 'Rate Limit', description: 'Muitas tentativas', color: 'bg-yellow-100 text-yellow-800' },
    { key: 'invalidCodeError', label: 'Código Inválido', description: 'Código incorreto', color: 'bg-orange-100 text-orange-800' },
    { key: 'expiredCodeError', label: 'Código Expirado', description: 'Código vencido', color: 'bg-purple-100 text-purple-800' },
    { key: 'serverError', label: 'Erro do Servidor', description: 'Erro interno', color: 'bg-red-100 text-red-800' }
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-neutral-900">
              EmailSignature Error Handling Demo
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Demonstração das melhorias no tratamento de erros do componente de assinatura por e-mail.
              Selecione um cenário para testar diferentes tipos de erro e opções de recuperação.
            </p>
          </div>

          {/* Scenario Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-solar-500" />
                Cenários de Teste
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scenarios.map((scenario) => (
                  <Button
                    key={scenario.key}
                    onClick={() => handleScenarioChange(scenario.key as keyof typeof mockResponses)}
                    variant={selectedScenario === scenario.key ? 'primary' : 'outline'}
                    className="h-auto p-4 flex flex-col items-start space-y-2"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold">{scenario.label}</span>
                      <Badge className={scenario.color}>
                        {selectedScenario === scenario.key ? 'Ativo' : 'Teste'}
                      </Badge>
                    </div>
                    <span className="text-sm text-left opacity-75">
                      {scenario.description}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Features Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="w-5 h-5 text-energy-500" />
                  Mensagens Claras
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-neutral-600">
                  • Mensagens de erro específicas e contextuais
                </p>
                <p className="text-sm text-neutral-600">
                  • Estilização consistente com o design system
                </p>
                <p className="text-sm text-neutral-600">
                  • Ícones e cores apropriadas para cada tipo de erro
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="w-5 h-5 text-solar-500" />
                  Opções de Recuperação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-neutral-600">
                  • Botão "Tentar Novamente" para erros recuperáveis
                </p>
                <p className="text-sm text-neutral-600">
                  • Opção "Reenviar Código" quando apropriado
                </p>
                <p className="text-sm text-neutral-600">
                  • Botão "Recarregar Página" para erros críticos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wifi className="w-5 h-5 text-ocean-500" />
                  Detecção de Conectividade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-neutral-600">
                  • Detecção automática de status de rede
                </p>
                <p className="text-sm text-neutral-600">
                  • Indicador visual quando offline
                </p>
                <p className="text-sm text-neutral-600">
                  • Notificações toast para mudanças de conectividade
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Demo Component */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Componente de Assinatura</span>
                <Badge variant="outline">
                  Cenário: {scenarios.find(s => s.key === selectedScenario)?.label}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl mx-auto">
                <EmailSignature
                  key={key}
                  contractId="demo-contract"
                  contractorEmail=""
                  onSignatureComplete={() => {
                    console.log('Signature completed!');
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-solar-50 border-solar-200">
            <CardHeader>
              <CardTitle className="text-solar-800">Como Testar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-solar-700">
              <p>
                <strong>1.</strong> Selecione um cenário de teste acima
              </p>
              <p>
                <strong>2.</strong> Insira um e-mail válido (ex: teste@exemplo.com)
              </p>
              <p>
                <strong>3.</strong> Clique em "Enviar Código de Verificação"
              </p>
              <p>
                <strong>4.</strong> Para cenários de sucesso, use o código: <code className="bg-solar-100 px-2 py-1 rounded">123456</code>
              </p>
              <p>
                <strong>5.</strong> Observe as mensagens de erro e opções de recuperação
              </p>
              <p className="text-sm mt-4 p-3 bg-solar-100 rounded-lg">
                <strong>Dica:</strong> Abra o console do navegador para ver logs adicionais e notificações toast.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToastProvider>
  );
}