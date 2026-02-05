/**
 * Admin Layout Component
 * A responsive admin layout with sidebar navigation and header
 * 
 * Features:
 * - Sidebar navigation with menu items
 * - Header with user info and logo
 * - Responsive design (drawer on mobile)
 * - Consistent styling with ISOTEC design system
 * 
 * Requirements: 7.4, 7.6
 */

'use client';

import * as React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Home, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: React.ReactNode;
  userInfo?: {
    name?: string;
    email?: string;
    role?: string;
  };
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: Home,
  },
  {
    name: 'Contratos',
    href: '/admin/contracts',
    icon: FileText,
    children: [
      {
        name: 'Todos os Contratos',
        href: '/admin/contracts',
        icon: FileText,
      },
      {
        name: 'Aguardando Assinatura',
        href: '/admin/contracts?status=pending_signature',
        icon: FileText,
      },
      {
        name: 'Assinados',
        href: '/admin/contracts?status=signed',
        icon: FileText,
      },
    ],
  },
  {
    name: 'Clientes',
    href: '/admin/clients',
    icon: Users,
  },
  {
    name: 'Relatórios',
    href: '/admin/reports',
    icon: BarChart3,
  },
  {
    name: 'Configurações',
    href: '/admin/settings',
    icon: Settings,
  },
];

function NavigationItem({ 
  item, 
  pathname, 
  level = 0,
  onItemClick 
}: { 
  item: NavigationItem; 
  pathname: string; 
  level?: number;
  onItemClick?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <div>
      <Link
        href={hasChildren ? '#' : item.href}
        onClick={hasChildren ? (e) => { e.preventDefault(); handleClick(); } : onItemClick}
        className={cn(
          'group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
          level > 0 && 'ml-4 pl-8',
          isActive
            ? 'bg-solar-500/10 text-solar-400 border border-solar-500/20'
            : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50',
          'focus:outline-none focus:ring-2 focus:ring-solar-500/50'
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon 
            className={cn(
              'w-5 h-5 transition-colors',
              isActive ? 'text-solar-400' : 'text-neutral-500 group-hover:text-neutral-300'
            )} 
          />
          <span>{item.name}</span>
          {item.badge && (
            <span className="px-2 py-0.5 text-xs font-medium bg-solar-500/20 text-solar-400 rounded-full">
              {item.badge}
            </span>
          )}
        </div>
        
        {hasChildren && (
          <ChevronRight 
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              isExpanded && 'rotate-90',
              isActive ? 'text-solar-400' : 'text-neutral-500'
            )} 
          />
        )}
      </Link>

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {item.children?.map((child) => (
            <NavigationItem
              key={child.href}
              item={child}
              pathname={pathname}
              level={level + 1}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar({ 
  isOpen, 
  onClose, 
  pathname 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  pathname: string;
}) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900/95 backdrop-blur-sm border-r border-neutral-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <Image
              src="/isotec-logo.webp"
              alt="ISOTEC Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-lg font-semibold text-white">Admin</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => (
            <NavigationItem
              key={item.href}
              item={item}
              pathname={pathname}
              onItemClick={onClose}
            />
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-neutral-700">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-400 rounded-lg hover:text-white hover:bg-neutral-700/50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Voltar ao Site</span>
          </Link>
        </div>
      </div>
    </>
  );
}

function Header({ 
  onMenuClick, 
  userInfo 
}: { 
  onMenuClick: () => void; 
  userInfo?: AdminLayoutProps['userInfo'];
}) {
  return (
    <header className="h-16 bg-neutral-900/50 backdrop-blur-sm border-b border-neutral-700 flex items-center justify-between px-4 lg:px-6">
      {/* Left side - Menu button and breadcrumb */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden text-neutral-400 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-white">
            Dashboard Administrativo
          </h1>
          <p className="text-sm text-neutral-400">
            Sistema de Gestão ISOTEC
          </p>
        </div>
      </div>

      {/* Right side - User info and actions */}
      <div className="flex items-center gap-4">
        {/* Quick actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/wizard">
            <Button size="sm" className="bg-solar-500 hover:bg-solar-600 text-neutral-900">
              Novo Contrato
            </Button>
          </Link>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3">
          {userInfo && (
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">
                {userInfo.name || 'Administrador'}
              </p>
              <p className="text-xs text-neutral-400">
                {userInfo.role || 'Admin'}
              </p>
            </div>
          )}
          
          {/* User avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-solar-500 to-solar-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-neutral-900">
              {userInfo?.name?.charAt(0) || 'A'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export function AdminLayout({ children, userInfo }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const closeSidebar = () => setSidebarOpen(false);
  const openSidebar = () => setSidebarOpen(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-ocean-900">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={closeSidebar} 
        pathname={pathname} 
      />

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header onMenuClick={openSidebar} userInfo={userInfo} />

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Floating mascot - only on desktop */}
      <div className="fixed bottom-8 right-8 hidden xl:block animate-float pointer-events-none">
        <Image
          src="/mascote.webp"
          alt="ISOTEC Mascot"
          width={100}
          height={100}
          className="drop-shadow-2xl opacity-80"
        />
      </div>
    </div>
  );
}

export default AdminLayout;