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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div>
      <Link
        href={hasChildren ? '#' : item.href}
        onClick={hasChildren ? (e) => { e.preventDefault(); handleClick(); } : onItemClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
          level > 0 && 'ml-4 pl-8',
          isActive
            ? 'bg-solar-500/10 text-solar-400 border border-solar-500/20'
            : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50',
          'focus:outline-none focus:ring-2 focus:ring-solar-500/50'
        )}
        role={hasChildren ? 'button' : 'menuitem'}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-current={isActive ? 'page' : undefined}
        aria-label={hasChildren ? `${item.name} (expandir submenu)` : item.name}
      >
        <div className="flex items-center gap-3">
          <item.icon 
            className={cn(
              'w-5 h-5 transition-colors',
              isActive ? 'text-solar-400' : 'text-neutral-500 group-hover:text-neutral-300'
            )}
            aria-hidden="true"
          />
          <span>{item.name}</span>
          {item.badge && (
            <span className="px-2 py-0.5 text-xs font-medium bg-solar-500/20 text-solar-400 rounded-full" aria-label={`${item.badge} itens`}>
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
            aria-hidden="true"
          />
        )}
      </Link>

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1" role="menu" aria-label={`Submenu de ${item.name}`}>
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
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900/95 backdrop-blur-sm border-r border-neutral-700 transform transition-transform duration-300 ease-in-out',
          'lg:relative lg:translate-x-0 lg:z-auto lg:w-64 lg:flex-shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Menu de navegação principal"
        role="navigation"
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <Image
              src="/isotec-logo.webp"
              alt="ISOTEC - Painel Administrativo"
              width={32}
              height={32}
              priority
              sizes="32px"
              className="w-8 h-8"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
            <span className="text-lg font-semibold text-white">Admin</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden text-neutral-400 hover:text-white"
            aria-label="Fechar menu de navegação"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto" role="menubar" aria-label="Menu principal">
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
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-400 rounded-lg hover:text-white hover:bg-neutral-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-solar-500/50"
            aria-label="Voltar ao site principal"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
            <span>Voltar ao Site</span>
          </Link>
        </div>
      </aside>
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
    <header className="h-16 bg-neutral-900/50 backdrop-blur-sm border-b border-neutral-700 flex items-center justify-between px-4 lg:px-6" role="banner">
      {/* Left side - Menu button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden text-neutral-400 hover:text-white"
          aria-label="Abrir menu de navegação"
          aria-expanded="false"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Right side - Actions and user */}
      <div className="flex items-center gap-3">
        {/* Quick action */}
        <Link href="/wizard">
          <Button size="sm" className="bg-solar-500 hover:bg-solar-600 text-neutral-900" aria-label="Criar novo contrato">
            Novo Contrato
          </Button>
        </Link>

        {/* User avatar */}
        <div 
          className="w-8 h-8 bg-gradient-to-br from-solar-500 to-solar-600 rounded-full flex items-center justify-center"
          role="img"
          aria-label={`Avatar do usuário ${userInfo?.name || 'Admin'}`}
        >
          <span className="text-sm font-semibold text-neutral-900" aria-hidden="true">
            {userInfo?.name?.charAt(0) || 'A'}
          </span>
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
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar} 
          pathname={pathname} 
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
          {/* Header */}
          <Header onMenuClick={openSidebar} userInfo={userInfo} />

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;