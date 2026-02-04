/**
 * Global Error Page
 * 
 * Next.js error page for handling unhandled errors.
 * Displays user-friendly error messages.
 * 
 * Requirements: All error handling requirements
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logError, ErrorLevel, ErrorCategory } from '@/lib/services/error-logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    logError({
      level: ErrorLevel.ERROR,
      category: ErrorCategory.UNKNOWN,
      message: error.message,
      error,
      context: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-red-600">
            Algo deu errado
          </CardTitle>
          <CardDescription>
            Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-mono text-red-800 mb-2">
                {error.message}
              </p>
              {error.stack && (
                <pre className="text-xs text-red-700 overflow-auto max-h-40">
                  {error.stack}
                </pre>
              )}
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <Button onClick={reset} variant="default">
              Tentar Novamente
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
            >
              Voltar para Início
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Se o problema persistir, entre em contato com nosso suporte:
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <a
                href="mailto:suporte@isotec.com.br"
                className="text-blue-600 hover:underline"
              >
                suporte@isotec.com.br
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
