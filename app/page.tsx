import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-800 to-neutral-900 relative overflow-hidden">
      {/* Solar glow effect */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-solar-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-solar-600/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-24 md:py-32">
        <div className="max-w-5xl w-full flex flex-col items-center gap-8 text-center">
          {/* Logo */}
          <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
            <Image
              src="/isotec-logo.webp"
              alt="ISOTEC Logo"
              width={240}
              height={96}
              priority
              className="w-48 md:w-64"
            />
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white animate-in fade-in slide-in-from-top-4 duration-1000 delay-150">
            Sistema de Contratos Fotovoltaicos
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-neutral-300 max-w-2xl animate-in fade-in slide-in-from-top-4 duration-1000 delay-300">
            Gestão completa de contratos para instalação de energia solar fotovoltaica. 
            Crie, gerencie e assine contratos de forma digital e segura.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-top-4 duration-1000 delay-450">
            <Link
              href="/wizard"
              className="group relative px-8 py-4 bg-gradient-to-r from-solar-500 to-solar-600 text-neutral-900 font-semibold rounded-lg shadow-lg shadow-solar-500/30 hover:shadow-solar-500/50 hover:from-solar-600 hover:to-solar-700 transition-all duration-200 active:scale-95"
            >
              <span className="relative z-10">Criar Novo Contrato</span>
            </Link>
            
            <Link
              href="/login"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg shadow-md hover:bg-white/20 transition-all duration-200 active:scale-95"
            >
              🔐 Login Admin
            </Link>
          </div>

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
        </div>
      </div>

      {/* Floating Mascot */}
      <div className="fixed bottom-8 right-8 hidden lg:block animate-float">
        <Image
          src="/mascote.webp"
          alt="ISOTEC Mascot"
          width={120}
          height={120}
          className="drop-shadow-2xl"
        />
      </div>
    </main>
  );
}
