/**
 * 404 Not Found Page
 * 
 * Custom 404 page for better user experience.
 * 
 * Requirements: All error handling requirements
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl">
            Página não encontrada
          </CardTitle>
          <CardDescription>
            A página que você está procurando não existe ou foi movida.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <p className="text-6xl font-bold text-gray-300">404</p>
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button variant="default">
                Voltar para Início
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">
                Ir para Dashboard
              </Button>
            </Link>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Se você acredita que isso é um erro, entre em contato com nosso suporte:
            </p>
            <p className="text-sm text-gray-600 mt-1 text-center">
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
