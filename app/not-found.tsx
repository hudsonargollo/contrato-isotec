/**
 * Enhanced 404 Not Found Page
 * 
 * Custom 404 page with ISOTEC branding, clear error message,
 * navigation options, and full responsiveness.
 * 
 * Validates: Requirements 9.6
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, Search, Mail, Sun } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-800 to-neutral-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-solar-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-energy-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* ISOTEC Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <Image
              src="/isotec-logo.webp"
              alt="ISOTEC"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">ISOTEC Solar</h1>
        </div>

        {/* Main Error Card */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            {/* 404 Visual */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <span className="text-8xl md:text-9xl font-bold text-solar-500/20 select-none">
                  404
                </span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sun className="h-16 w-16 md:h-20 md:w-20 text-solar-500 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
              </div>
            </div>

            <CardTitle className="text-2xl md:text-3xl text-neutral-900 mb-2">
              Página Não Encontrada
            </CardTitle>
            <CardDescription className="text-lg text-neutral-600">
              A página que você está procurando não existe ou foi movida para outro local.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Helpful suggestions */}
            <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-4">
              <h3 className="font-semibold text-ocean-900 mb-2">O que você pode fazer:</h3>
              <ul className="text-sm text-ocean-800 space-y-1">
                <li>• Verifique se o endereço foi digitado corretamente</li>
                <li>• Use os botões abaixo para navegar</li>
                <li>• Entre em contato conosco se precisar de ajuda</li>
              </ul>
            </div>

            {/* Navigation buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/" className="w-full">
                <Button variant="primary" size="lg" className="w-full">
                  <Home className="h-5 w-5 mr-2" />
                  Página Inicial
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => window.history.back()}
                className="w-full"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Voltar
              </Button>
            </div>

            {/* Additional navigation options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/wizard" className="w-full">
                <Button variant="ghost" size="lg" className="w-full">
                  <Sun className="h-5 w-5 mr-2" />
                  Criar Contrato
                </Button>
              </Link>
              
              <Link href="/admin" className="w-full">
                <Button variant="ghost" size="lg" className="w-full">
                  <Search className="h-5 w-5 mr-2" />
                  Área Administrativa
                </Button>
              </Link>
            </div>

            {/* Contact support */}
            <div className="pt-6 border-t border-neutral-200">
              <div className="text-center">
                <p className="text-sm text-neutral-600 mb-3">
                  Precisa de ajuda? Nossa equipe está pronta para atendê-lo.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="mailto:suporte@isotec.com.br"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-ocean-600 hover:text-ocean-700 transition-colors"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    suporte@isotec.com.br
                  </a>
                  <a
                    href="tel:+5511999999999"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-ocean-600 hover:text-ocean-700 transition-colors"
                  >
                    📞 (11) 99999-9999
                  </a>
                </div>
              </div>
            </div>

            {/* Footer message */}
            <div className="text-center pt-4">
              <p className="text-xs text-neutral-500">
                ISOTEC - Energia Solar Sustentável
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Floating mascot for larger screens */}
        <div className="hidden lg:block fixed bottom-8 right-8 z-20">
          <div className="relative">
            <Image
              src="/mascote.webp"
              alt="ISOTEC Mascot"
              width={120}
              height={120}
              className="object-contain animate-float"
            />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
