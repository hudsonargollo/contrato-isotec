'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    tenantName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.fullName || !formData.tenantName) {
      setError('Todos os campos obrigatórios devem ser preenchidos');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    if (formData.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido');
      return false;
    }

    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          tenantName: formData.tenantName
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao criar conta. Tente novamente.');
        setLoading(false);
        return;
      }

      if (data.success) {
        setSuccess(true);
        // Redirect to login after successful signup
        setTimeout(() => {
          router.push('/login?message=account_created');
        }, 2000);
      }
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-800 to-neutral-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-solar-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-solar-600/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-24">
          <div className="w-full max-w-md">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Organização Criada com Sucesso!
              </h1>
              <p className="text-neutral-400 mb-6">
                Sua organização foi criada e você pode fazer login para começar a usar o SolarCRM Pro.
              </p>
              <p className="text-sm text-neutral-500">
                Redirecionando para o login...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

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
              alt="SolarCRM Pro Logo"
              width={200}
              height={80}
              priority
              className="w-48"
            />
          </div>

          {/* Signup Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
            <h1 className="text-2xl font-bold text-white mb-2 text-center">
              Criar Conta
            </h1>
            <p className="text-neutral-400 text-center mb-8">
              Cadastre-se no SolarCRM Pro
            </p>

            <form onSubmit={handleSignup} className="space-y-6">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-neutral-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-all"
                  placeholder="Seu nome completo"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-all"
                  placeholder="seu@email.com"
                  disabled={loading}
                />
              </div>

              {/* Tenant Name */}
              <div>
                <label htmlFor="tenantName" className="block text-sm font-medium text-neutral-300 mb-2">
                  Nome da Empresa *
                </label>
                <input
                  id="tenantName"
                  name="tenantName"
                  type="text"
                  value={formData.tenantName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-all"
                  placeholder="Nome da sua empresa"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-2">
                  Senha *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-all"
                  placeholder="Mínimo 8 caracteres"
                  disabled={loading}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-300 mb-2">
                  Confirmar Senha *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-all"
                  placeholder="Confirme sua senha"
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
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-neutral-400 text-sm">
                Já tem uma conta?{' '}
                <Link
                  href="/login"
                  className="text-solar-400 hover:text-solar-300 transition-colors"
                >
                  Fazer login
                </Link>
              </p>
            </div>

            {/* Back to Home */}
            <div className="mt-4 text-center">
              <Link
                href="/"
                className="text-neutral-500 hover:text-neutral-400 text-sm transition-colors"
              >
                ← Voltar ao início
              </Link>
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-neutral-500 text-sm">
              SolarCRM Pro - Plataforma de Gestão Solar
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}