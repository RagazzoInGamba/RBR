/**
 * Red Bull Racing - Sidebar Navigation
 * Role-based collapsible sidebar with F1 aesthetics
 */

'use client';

import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  Settings,
  ChefHat,
  UtensilsCrossed,
  FileText,
  ShoppingCart,
  CreditCard,
  Shield,
  BarChart3,
  UserCog,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SidebarProps {
  userRole: string;
  className?: string;
}

const navigationByRole = {
  SUPER_ADMIN: [
    { label: 'Dashboard', href: '/super-admin', icon: Home },
    { label: 'Gestione Utenti', href: '/super-admin/users', icon: Users },
    { label: 'Gateway Pagamento', href: '/super-admin/payment-gateways', icon: CreditCard },
    { label: 'Impostazioni', href: '/super-admin/settings', icon: Settings },
    { label: 'Log Audit', href: '/super-admin/audit', icon: Shield },
    { label: 'Report', href: '/super-admin/reports', icon: BarChart3 },
  ],
  KITCHEN_ADMIN: [
    { label: 'Dashboard', href: '/kitchen', icon: Home },
    { label: 'Ricette', href: '/kitchen/recipes', icon: ChefHat },
    { label: 'Menu', href: '/kitchen/menus', icon: UtensilsCrossed },
    { label: 'Ordini', href: '/kitchen/orders', icon: ShoppingCart },
    { label: 'Report', href: '/kitchen/reports', icon: FileText },
  ],
  CUSTOMER_ADMIN: [
    { label: 'Dashboard', href: '/customer-admin', icon: Home },
    { label: 'Dipendenti', href: '/customer-admin/employees', icon: Users },
    { label: 'Gruppi', href: '/customer-admin/groups', icon: UserCog },
    { label: 'Ordini', href: '/customer-admin/orders', icon: ShoppingCart },
    { label: 'Report', href: '/customer-admin/reports', icon: BarChart3 },
  ],
  END_USER: [
    { label: 'Dashboard', href: '/booking', icon: Home },
    { label: 'Prenota Pasto', href: '/booking/new', icon: UtensilsCrossed },
    { label: 'I Miei Ordini', href: '/booking/orders', icon: ShoppingCart },
    { label: 'Notifiche', href: '/booking/notifications', icon: Bell },
  ],
};

export function Sidebar({ userRole, className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = navigationByRole[userRole as keyof typeof navigationByRole] || [];

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-rbr-red/20 bg-rbr-dark-card transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Sidebar header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-rbr-red/20">
        {!isCollapsed && (
          <span className="font-heading font-bold text-rbr-text-primary text-lg">
            Navigazione
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-rbr-text-muted hover:text-rbr-red hover:bg-rbr-red/10"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'hover:bg-rbr-red/10 hover:text-rbr-red',
                isActive
                  ? 'bg-racing-red-gradient text-white shadow-racing-md'
                  : 'text-rbr-text-secondary',
                isCollapsed && 'justify-center'
              )}
            >
              <Icon className={cn('flex-shrink-0', isCollapsed ? 'h-6 w-6' : 'h-5 w-5')} />
              {!isCollapsed && <span>{item.label}</span>}
              {isActive && !isCollapsed && (
                <span className="ml-auto h-2 w-2 rounded-full bg-rbr-accent-blue animate-pulse-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar footer */}
      <div className="border-t border-rbr-red/20 p-3">
        <div
          className={cn(
            'rounded-lg bg-rbr-navy/20 p-3 border border-rbr-navy/30',
            isCollapsed && 'p-2'
          )}
        >
          {!isCollapsed ? (
            <>
              <p className="text-xs font-medium text-rbr-text-primary mb-1">
                Oracle Red Bull Racing
              </p>
              <p className="text-xs text-rbr-text-muted">Tecnologia F1</p>
            </>
          ) : (
            <div className="h-6 w-6 mx-auto rounded bg-racing-gradient flex items-center justify-center text-white text-xs font-bold">
              F1
            </div>
          )}
        </div>
      </div>

      {/* Racing border effect */}
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-rbr-red/30 to-transparent" />
    </aside>
  );
}

