import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { TenantProvider } from '@/lib/contexts/tenant-context';
import { createClient } from '@/lib/supabase/server';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SolarCRM Pro - Sistema de Gestão Solar',
  description: 'Plataforma completa de CRM e gestão de contratos para empresas de energia solar',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get initial session for SSR
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        <ErrorBoundary>
          <SessionProvider initialSession={session}>
            <TenantProvider>
              {children}
            </TenantProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
