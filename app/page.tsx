'use client';

// SolarCRM Pro - Multi-tenant SaaS Landing Page

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SkipLink } from '@/components/ui/keyboard-navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Hero,
  HeroSection,
  HeroContent,
  HeroLogo,
  HeroHeading,
  HeroDescription,
  HeroActions,
  HeroMascot,
} from '@/components/ui/hero';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (user && !error) {
        // Check if user has admin role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile && ['admin', 'super_admin'].includes(profile.role)) {
          setIsRedirecting(true);
          // Use replace to avoid back button issues
          router.replace('/admin');
          return;
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-ocean-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neutral-700 border-t-solar-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-400">
            {isRedirecting ? 'Redirecionando para o painel...' : 'Carregando...'}
          </p>
        </div>
      </div>
    );
  }
  return (
    <>
      {/* Skip Links for Accessibility */}
      <SkipLink href="#main-content">
        Pular para o conteúdo principal
      </SkipLink>
      <SkipLink href="#main-actions">
        Pular para as ações principais
      </SkipLink>

      <Hero>
        <HeroSection>
          <HeroContent>
            {/* Logo */}
            <HeroLogo
              src="/isotec-logo.webp"
              alt="SolarCRM Pro Logo"
            />

            {/* Main Content */}
            <main id="main-content">
              {/* Heading */}
              <HeroHeading>
                SolarCRM Pro
              </HeroHeading>
              
              <div className="text-solar-400 text-xl font-medium mb-4">
                Plataforma SaaS Multi-tenant para Energia Solar
              </div>

              {/* Description */}
              <HeroDescription>
                Plataforma completa de CRM, gestão de contratos, pagamentos e integração WhatsApp 
                para empresas de energia solar fotovoltaica. Solução enterprise com arquitetura multi-tenant.
              </HeroDescription>
            </main>

            {/* CTA Buttons */}
            <HeroActions id="main-actions">
              <Link href="/signup">
                <Button variant="primary" size="lg" className="px-8" aria-describedby="signup-desc">
                  Começar Gratuitamente
                </Button>
              </Link>
              <span id="signup-desc" className="sr-only">
                Criar conta gratuita na plataforma SolarCRM Pro
              </span>
              
              <Link href="/login">
                <Button variant="secondary" size="lg" className="px-8" aria-describedby="login-desc">
                  🔐 Fazer Login
                </Button>
              </Link>
              <span id="login-desc" className="sr-only">
                Acessar sua conta na plataforma SolarCRM Pro
              </span>
            </HeroActions>

            {/* Enterprise Features */}
            <section 
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-600"
              aria-label="Principais funcionalidades da plataforma"
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200 focus-within:ring-2 focus-within:ring-solar-500/50">
                <div className="text-solar-400 text-3xl mb-3" role="img" aria-label="Ícone de CRM">👥</div>
                <h3 className="text-white font-semibold mb-2">CRM Avançado</h3>
                <p className="text-neutral-400 text-sm">Gestão completa de leads com scoring automático e pipeline de vendas</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200 focus-within:ring-2 focus-within:ring-solar-500/50">
                <div className="text-solar-400 text-3xl mb-3" role="img" aria-label="Ícone de contratos">📋</div>
                <h3 className="text-white font-semibold mb-2">Contratos Digitais</h3>
                <p className="text-neutral-400 text-sm">Geração e assinatura digital com integração Gov.br</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200 focus-within:ring-2 focus-within:ring-solar-500/50">
                <div className="text-solar-400 text-3xl mb-3" role="img" aria-label="Ícone de pagamentos">💳</div>
                <h3 className="text-white font-semibold mb-2">Pagamentos</h3>
                <p className="text-neutral-400 text-sm">Processamento automático com Stripe e cobrança recorrente</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200 focus-within:ring-2 focus-within:ring-solar-500/50">
                <div className="text-solar-400 text-3xl mb-3" role="img" aria-label="Ícone de WhatsApp">💬</div>
                <h3 className="text-white font-semibold mb-2">WhatsApp Business</h3>
                <p className="text-neutral-400 text-sm">Integração completa para comunicação e campanhas automatizadas</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200 focus-within:ring-2 focus-within:ring-solar-500/50">
                <div className="text-solar-400 text-3xl mb-3" role="img" aria-label="Ícone de analytics">📊</div>
                <h3 className="text-white font-semibold mb-2">Analytics</h3>
                <p className="text-neutral-400 text-sm">Dashboard em tempo real com relatórios avançados e forecasting</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200 focus-within:ring-2 focus-within:ring-solar-500/50">
                <div className="text-solar-400 text-3xl mb-3" role="img" aria-label="Ícone de API">🔌</div>
                <h3 className="text-white font-semibold mb-2">API-First</h3>
                <p className="text-neutral-400 text-sm">Arquitetura API-first com versionamento e documentação completa</p>
              </div>
            </section>

            {/* Quick Access Links */}
            <section className="mt-12 w-full max-w-4xl">
              <h2 className="text-white text-xl font-semibold mb-6 text-center">Acesso Rápido</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/admin" className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200 text-center">
                  <div className="text-2xl mb-2">🏢</div>
                  <div className="text-white text-sm font-medium">Admin</div>
                </Link>
                <Link href="/api-docs" className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200 text-center">
                  <div className="text-2xl mb-2">📚</div>
                  <div className="text-white text-sm font-medium">API Docs</div>
                </Link>
                <Link href="/analytics-demo" className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200 text-center">
                  <div className="text-2xl mb-2">📈</div>
                  <div className="text-white text-sm font-medium">Analytics</div>
                </Link>
                <Link href="/wizard" className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200 text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="text-white text-sm font-medium">Contrato</div>
                </Link>
              </div>
            </section>
          </HeroContent>
        </HeroSection>

        {/* Integrated Mascot - Part of Hero Composition */}
        <HeroMascot
          src="/mascote.webp"
          alt="SolarCRM Pro Mascot"
        />
      </Hero>
    </>
  );
}
