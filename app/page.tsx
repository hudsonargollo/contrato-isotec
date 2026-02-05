import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
    <Hero>
      <HeroSection>
        <HeroContent>
          {/* Logo */}
          <HeroLogo
            src="/isotec-logo.webp"
            alt="ISOTEC Logo"
          />

          {/* Heading */}
          <HeroHeading>
            Sistema de Contratos Fotovoltaicos
          </HeroHeading>

          {/* Description */}
          <HeroDescription>
            Gestão completa de contratos para instalação de energia solar fotovoltaica. 
            Crie, gerencie e assine contratos de forma digital e segura.
          </HeroDescription>

          {/* CTA Buttons */}
          <HeroActions>
            <Link href="/wizard">
              <Button variant="primary" size="lg" className="px-8">
                Criar Novo Contrato
              </Button>
            </Link>
            
            <Link href="/login">
              <Button variant="secondary" size="lg" className="px-8">
                🔐 Login Admin
              </Button>
            </Link>
          </HeroActions>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-600">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
              <div className="text-solar-400 text-3xl mb-3">⚡</div>
              <h3 className="text-white font-semibold mb-2">Rápido e Fácil</h3>
              <p className="text-neutral-400 text-sm">Wizard intuitivo em 7 etapas para criação de contratos</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
              <div className="text-solar-400 text-3xl mb-3">🔒</div>
              <h3 className="text-white font-semibold mb-2">Seguro</h3>
              <p className="text-neutral-400 text-sm">Assinatura digital por email com código de verificação</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
              <div className="text-solar-400 text-3xl mb-3">📊</div>
              <h3 className="text-white font-semibold mb-2">Completo</h3>
              <p className="text-neutral-400 text-sm">Gestão completa com auditoria e rastreamento</p>
            </div>
          </div>
        </HeroContent>
      </HeroSection>

      {/* Floating Mascot */}
      <HeroMascot
        src="/mascote.webp"
        alt="ISOTEC Mascot"
      />
    </Hero>
  );
}
