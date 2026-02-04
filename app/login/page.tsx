'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('Email ou senha incorretos');
        setLoading(false);
        return;
      }

      if (data.user) {
        // Redirect to admin dashboard
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-800 to-neutral-900 relative overflow-hidden">
      {/* Solar glow effect */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-solar-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-solar-600/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
            <Image
              src="/isotec-logo.webp"
              alt="ISOTEC Logo"
              width={200}
              height={80}
              priority
              className="w-48"
            />
          </div>

          {/* Login Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
            <h1 className="text-2xl font-bold text-white mb-2 text-center">
              Login Admin
            </h1>
            <p className="text-neutral-400 text-center mb-8">
              Acesse o painel administrativo
            </p>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-all"
                  placeholder="seu@email.com"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-2">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-solar-500 to-solar-600 text-neutral-900 font-semibold rounded-lg shadow-lg shadow-solar-500/30 hover:shadow-solar-500/50 hover:from-solar-600 hover:to-solar-700 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-neutral-400 hover:text-white text-sm transition-colors"
              >
                ← Voltar ao início
              </Link>
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-neutral-500 text-sm">
              Sistema de Contratos Fotovoltaicos ISOTEC
            </p>
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
