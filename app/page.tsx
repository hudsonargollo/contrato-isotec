'use client';

// Client component for landing page

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SkipLink } from '@/components/ui/keyboard-navigation';
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
              alt="ISOTEC Logo"
            />

            {/* Main Content */}
            <main id="main-content">
              {/* Heading */}
              <HeroHeading>
                Sistema de Contratos Fotovoltaicos
              </HeroHeading>

              {/* Description */}
              <HeroDescription>
                Gestão completa de contratos para instalação de energia solar fotovoltaica. 
                Crie, gerencie e assine contratos de forma digital e segura.
              </HeroDescription>
            </main>

            {/* CTA Buttons */}
            <HeroActions id="main-actions">
              <Link href="/wizard">
                <Button variant="primary" size="lg" className="px-8" aria-describedby="create-contract-desc">
                  Criar Novo Contrato
                </Button>
              </Link>
              <span id="create-contract-desc" className="sr-only">
                Inicia o processo de criação de um novo contrato fotovoltaico em 7 etapas
              </span>
              
              <Link href="/login">
                <Button variant="secondary" size="lg" className="px-8" aria-describedby="admin-login-desc">
                  🔐 Login Admin
                </Button>
              </Link>
              <span id="admin-login-desc" className="sr-only">
                Acesso administrativo para gerenciar contratos e configurações do sistema
              </span>
            </HeroActions>

            {/* Features */}
            <section 
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-600"
              aria-label="Principais funcionalidades do sistema"
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200 focus-within:ring-2 focus-within:ring-solar-500/50">
                <div className="text-solar-400 text-3xl mb-3" role="img" aria-label="Ícone de velocidade">⚡</div>
                <h3 className="text-white font-semibold mb-2">Rápido e Fácil</h3>
                <p className="text-neutral-400 text-sm">Wizard intuitivo em 7 etapas para criação de contratos</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200 focus-within:ring-2 focus-within:ring-solar-500/50">
                <div className="text-solar-400 text-3xl mb-3" role="img" aria-label="Ícone de segurança">🔒</div>
                <h3 className="text-white font-semibold mb-2">Seguro</h3>
                <p className="text-neutral-400 text-sm">Assinatura digital por email com código de verificação</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200 focus-within:ring-2 focus-within:ring-solar-500/50">
                <div className="text-solar-400 text-3xl mb-3" role="img" aria-label="Ícone de relatórios">📊</div>
                <h3 className="text-white font-semibold mb-2">Completo</h3>
                <p className="text-neutral-400 text-sm">Gestão completa com auditoria e rastreamento</p>
              </div>
            </section>
          </HeroContent>
        </HeroSection>

        {/* Floating Mascot */}
        <HeroMascot
          src="/mascote.webp"
          alt="ISOTEC Mascot"
        />
      </Hero>
    </>
  );
}
