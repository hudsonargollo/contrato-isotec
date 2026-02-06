/**
 * Error Handling Demo Component
 * 
 * Demonstrates all the error handling components and functionality
 * implemented in task 13.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  NetworkErrorMessage, 
  ValidationErrorMessage, 
  NotFoundErrorMessage, 
  ServerErrorMessage,
  PermissionErrorMessage 
} from '@/components/ui/error-message';
import { useToast } from '@/components/ui/toast';
import { FormField } from '@/components/ui/form-field';
import { NetworkStatus, NetworkStatusIndicator } from '@/components/ui/network-status';
import { useFormValidation } from '@/lib/hooks/use-form-validation';
import { useNetworkErrorHandling } from '@/lib/hooks/use-network-error-handling';
import { useFormPersistence } from '@/lib/utils/form-persistence';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function ErrorHandlingDemo() {
  const toast = useToast();
  const [showNetworkStatus, setShowNetworkStatus] = useState(false);
  
  // Form validation demo
  const [formState, formActions] = useFormValidation(
    { email: '', password: '', name: '' },
    {
      email: {
        rules: {
          required: { message: 'Email é obrigatório' },
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Digite um email válido'
          }
        },
        validateOnBlur: true,
        clearErrorOnChange: true,
      },
      password: {
        rules: {
          required: { message: 'Senha é obrigatória' },
          minLength: { value: 8, message: 'Senha deve ter pelo menos 8 caracteres' }
        },
        validateOnBlur: true,
      },
      name: {
        rules: {
          required: { message: 'Nome é obrigatório' },
          minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' }
        },
      }
    }
  );

  // Network error handling demo
  const { networkFetch, isOnline, isRetrying } = useNetworkErrorHandling({
    showToastNotifications: true,
  });

  // Form persistence demo
  const { saveData, loadData, clearData, hasData } = useFormPersistence({
    key: 'demo_form',
    enableAutoSave: true,
    enableRecovery: true,
    onRestore: (data) => {
      formActions.setValues(data);
    },
  });

  // Save form data when it changes
  React.useEffect(() => {
    saveData(formState.values);
  }, [formState.values, saveData]);

  const handleToastDemo = (variant: 'success' | 'error' | 'warning' | 'info') => {
    switch (variant) {
      case 'success':
        toast.success('Operação Bem-sucedida', 'Sua ação foi concluída com sucesso!');
        break;
      case 'error':
        toast.error('Erro Encontrado', 'Algo deu errado. Tente novamente.', { persistent: true });
        break;
      case 'warning':
        toast.warning('Atenção Necessária', 'Verifique os dados antes de continuar.');
        break;
      case 'info':
        toast.info('Informação', 'Esta é uma mensagem informativa.');
        break;
    }
  };

  const handleNetworkTest = async () => {
    try {
      const response = await networkFetch('https://jsonplaceholder.typicode.com/posts/1', {}, 'buscar dados de teste');
      await response.json();
      toast.success('Sucesso', 'Dados carregados com sucesso!');
    } catch (error) {
      console.error('Network test failed:', error);
    }
  };

  const handleFormSubmit = formActions.handleSubmit(async () => {
    toast.success('Formulário Enviado', 'Dados validados e enviados com sucesso!');
    clearData(); // Clear cached data after successful submission
  });

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Demo: Sistema de Tratamento de Erros
        </h1>
        <p className="text-neutral-600">
          Demonstração completa dos componentes de erro implementados
        </p>
      </div>

      {/* Toast Notifications Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações Toast</CardTitle>
          <CardDescription>
            Sistema de notificações com diferentes variantes e funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={() => handleToastDemo('success')} variant="outline">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Sucesso
            </Button>
            <Button onClick={() => handleToastDemo('error')} variant="outline">
              <AlertCircle className="h-4 w-4 mr-2" />
              Erro
            </Button>
            <Button onClick={() => handleToastDemo('warning')} variant="outline">
              <AlertCircle className="h-4 w-4 mr-2" />
              Aviso
            </Button>
            <Button onClick={() => handleToastDemo('info')} variant="outline">
              <AlertCircle className="h-4 w-4 mr-2" />
              Info
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message Components Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Componentes de Mensagem de Erro</CardTitle>
          <CardDescription>
            Diferentes tipos de mensagens de erro com ações de recuperação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NetworkErrorMessage 
            onRetry={() => toast.info('Tentando novamente...', 'Simulando nova tentativa')}
            onDismiss={() => toast.info('Erro dispensado')}
          />
          
          <ValidationErrorMessage 
            description="Os dados inseridos não atendem aos critérios de validação."
            onDismiss={() => toast.info('Erro de validação dispensado')}
          />
          
          <ServerErrorMessage 
            onRetry={() => toast.info('Tentando novamente...', 'Simulando nova tentativa')}
            onContactSupport={() => toast.info('Abrindo suporte...', 'Redirecionando para contato')}
          />
        </CardContent>
      </Card>

      {/* Form Validation Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Validação de Formulário</CardTitle>
          <CardDescription>
            Demonstração de validação em tempo real com persistência de dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <FormField
              label="Nome Completo"
              required
              error={formState.errors.name}
              htmlFor="name"
            >
              <Input
                id="name"
                value={formState.values.name}
                onChange={(e) => formActions.setValue('name', e.target.value)}
                placeholder="Digite seu nome completo"
              />
            </FormField>

            <FormField
              label="Email"
              required
              error={formState.errors.email}
              htmlFor="email"
            >
              <Input
                id="email"
                type="email"
                value={formState.values.email}
                onChange={(e) => formActions.setValue('email', e.target.value)}
                placeholder="Digite seu email"
              />
            </FormField>

            <FormField
              label="Senha"
              required
              error={formState.errors.password}
              helperText="Mínimo de 8 caracteres"
              htmlFor="password"
            >
              <Input
                id="password"
                type="password"
                value={formState.values.password}
                onChange={(e) => formActions.setValue('password', e.target.value)}
                placeholder="Digite sua senha"
              />
            </FormField>

            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={formState.isSubmitting || !formState.isValid}
              >
                {formState.isSubmitting ? 'Enviando...' : 'Enviar Formulário'}
              </Button>
              
              {hasData() && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    const data = loadData();
                    if (data) {
                      formActions.setValues(data);
                      toast.info('Dados Carregados', 'Dados salvos foram restaurados');
                    }
                  }}
                >
                  Carregar Dados Salvos
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Network Status Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Status de Rede e Tratamento de Erros</CardTitle>
          <CardDescription>
            Demonstração de detecção de conectividade e retry automático
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <NetworkStatusIndicator />
            <span className="text-sm text-neutral-600">
              Status: {isOnline ? 'Online' : 'Offline'}
              {isRetrying && ' (Reconectando...)'}
            </span>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleNetworkTest}>
              Testar Conexão de Rede
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setShowNetworkStatus(!showNetworkStatus)}
            >
              {showNetworkStatus ? 'Ocultar' : 'Mostrar'} Status de Rede
            </Button>
          </div>

          {showNetworkStatus && (
            <NetworkStatus 
              position="bottom-right"
              showWhenOnline={true}
              onRetry={() => toast.info('Tentando reconectar...', 'Simulando reconexão')}
            />
          )}
        </CardContent>
      </Card>

      {/* Error State Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplos de Estados de Erro</CardTitle>
          <CardDescription>
            Diferentes cenários de erro com opções de recuperação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NotFoundErrorMessage 
            onGoBack={() => toast.info('Voltando...', 'Simulando navegação')}
            onGoHome={() => toast.info('Indo para início...', 'Simulando navegação')}
          />
          
          <PermissionErrorMessage 
            onLogin={() => toast.info('Redirecionando para login...', 'Simulando redirecionamento')}
            onGoBack={() => toast.info('Voltando...', 'Simulando navegação')}
          />
        </CardContent>
      </Card>
    </div>
  );
}