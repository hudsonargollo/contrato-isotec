'use client';

/**
 * Admin Settings Page
 * 
 * Main settings dashboard with navigation to different setting categories
 * Provides access to branding, white-label, and system configurations
 */

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Palette, 
  Building, 
  Shield, 
  Bell, 
  Database, 
  Users,
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react';

interface SettingCategory {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}

const settingCategories: SettingCategory[] = [
  {
    title: 'Marca e Identidade',
    description: 'Configure logotipos, cores e identidade visual da empresa',
    href: '/admin/settings/branding',
    icon: Palette,
    available: true,
  },
  {
    title: 'White Label',
    description: 'Personalizações avançadas para marca própria',
    href: '/admin/settings/white-label',
    icon: Building,
    available: true,
  },
  {
    title: 'Segurança',
    description: 'Configurações de autenticação e permissões',
    href: '/admin/settings/security',
    icon: Shield,
    available: false,
  },
  {
    title: 'Notificações',
    description: 'Configure alertas e notificações do sistema',
    href: '/admin/settings/notifications',
    icon: Bell,
    available: false,
  },
  {
    title: 'Usuários e Equipe',
    description: 'Gerencie usuários, funções e permissões',
    href: '/admin/settings/users',
    icon: Users,
    available: false,
  },
  {
    title: 'Sistema',
    description: 'Configurações gerais do sistema e integrações',
    href: '/admin/settings/system',
    icon: Database,
    available: false,
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-solar-400" />
          <h1 className="text-3xl font-bold text-white">Configurações</h1>
        </div>
        <p className="text-neutral-400">
          Gerencie as configurações do sistema, personalização e preferências
        </p>
      </div>

      {/* Settings Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingCategories.map((category) => (
          <Card 
            key={category.href}
            className={`bg-neutral-800/50 border-neutral-700 transition-all duration-200 ${
              category.available 
                ? 'hover:bg-neutral-800/70 hover:border-solar-500/30 cursor-pointer' 
                : 'opacity-60 cursor-not-allowed'
            }`}
          >
            {category.available ? (
              <Link href={category.href} className="block h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-solar-500/10 rounded-lg">
                        <category.icon className="w-6 h-6 text-solar-400" />
                      </div>
                      <CardTitle className="text-lg text-white">
                        {category.title}
                      </CardTitle>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-400">
                    {category.description}
                  </p>
                </CardContent>
              </Link>
            ) : (
              <div className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-neutral-600/20 rounded-lg">
                        <category.icon className="w-6 h-6 text-neutral-500" />
                      </div>
                      <CardTitle className="text-lg text-neutral-400">
                        {category.title}
                      </CardTitle>
                    </div>
                    <div className="px-2 py-1 bg-neutral-700 text-xs text-neutral-400 rounded">
                      Em breve
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-500">
                    {category.description}
                  </p>
                </CardContent>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Quick Settings */}
      <Card className="bg-neutral-800/50 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Configurações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-neutral-700/30 rounded-lg">
              <h4 className="font-medium text-white mb-2">Tema</h4>
              <p className="text-sm text-neutral-400 mb-3">Modo escuro ativo</p>
              <div className="w-full bg-neutral-600 rounded-full h-2">
                <div className="bg-solar-500 h-2 rounded-full w-full"></div>
              </div>
            </div>

            <div className="p-4 bg-neutral-700/30 rounded-lg">
              <h4 className="font-medium text-white mb-2">Idioma</h4>
              <p className="text-sm text-neutral-400 mb-3">Português (BR)</p>
              <div className="text-xs text-solar-400">✓ Configurado</div>
            </div>

            <div className="p-4 bg-neutral-700/30 rounded-lg">
              <h4 className="font-medium text-white mb-2">Fuso Horário</h4>
              <p className="text-sm text-neutral-400 mb-3">America/Sao_Paulo</p>
              <div className="text-xs text-solar-400">✓ Configurado</div>
            </div>

            <div className="p-4 bg-neutral-700/30 rounded-lg">
              <h4 className="font-medium text-white mb-2">Moeda</h4>
              <p className="text-sm text-neutral-400 mb-3">Real Brasileiro (BRL)</p>
              <div className="text-xs text-solar-400">✓ Configurado</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="bg-neutral-800/50 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white">Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-white mb-2">Versão</h4>
              <p className="text-sm text-neutral-400">SolarCRM Pro v2.0.0</p>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">Última Atualização</h4>
              <p className="text-sm text-neutral-400">14 de Fevereiro, 2025</p>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">Status</h4>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-400">Sistema Operacional</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}