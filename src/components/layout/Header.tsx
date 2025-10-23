/**
 * Red Bull Racing - Header Component
 * Top navigation bar with user menu and racing aesthetics
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Menu, User, LogOut, Settings, Bell, Search } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  // Fetch unread notifications count
  useEffect(() => {
    if (!session?.user) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications?unreadOnly=true&limit=1');
        const data = await response.json();
        if (response.ok) {
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        // Silently fail
      }
    };

    fetchUnreadCount();

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-rbr-red text-white';
      case 'KITCHEN_ADMIN':
        return 'bg-rbr-accent-yellow text-rbr-dark';
      case 'CUSTOMER_ADMIN':
        return 'bg-rbr-navy text-white';
      default:
        return 'bg-rbr-dark-elevated text-rbr-text-primary';
    }
  };

  const formatRole = (role: string) => {
    const roleNames: Record<string, string> = {
      'SUPER_ADMIN': 'Super Admin',
      'KITCHEN_ADMIN': 'Admin Cucina',
      'CUSTOMER_ADMIN': 'Admin Cliente',
      'END_USER': 'Utente',
    };
    return roleNames[role] || role;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-rbr-red/20 bg-rbr-dark-card/95 backdrop-blur-lg supports-[backdrop-filter]:bg-rbr-dark-card/80">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-rbr-text-primary hover:text-rbr-red hover:bg-rbr-red/10"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Logo and brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-racing-red-gradient flex items-center justify-center font-display text-white text-sm">
            RBR
          </div>
          <div className="hidden md:block">
            <h1 className="text-sm font-heading font-bold text-rbr-text-primary">
              Red Bull Racing
            </h1>
            <p className="text-xs text-rbr-text-muted">Piattaforma Prenotazione Pasti</p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Search / Command Palette Hint */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rbr-dark-elevated border border-rbr-border text-rbr-text-muted hover:border-rbr-red/30 transition-colors cursor-pointer group">
            <Search className="h-4 w-4 group-hover:text-rbr-red transition-colors" />
            <span className="text-sm">Cerca...</span>
            <div className="flex items-center gap-1 ml-4">
              <kbd className="px-2 py-0.5 text-xs rounded bg-rbr-dark border border-rbr-border font-mono">
                {isMac ? '⌘' : 'Ctrl'}
              </kbd>
              <kbd className="px-2 py-0.5 text-xs rounded bg-rbr-dark border border-rbr-border font-mono">
                K
              </kbd>
            </div>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/booking/notifications')}
            className="relative text-rbr-text-primary hover:text-rbr-red hover:bg-rbr-red/10"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rbr-red text-white text-xs flex items-center justify-center font-bold border-2 border-rbr-dark animate-pulse-glow">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <span className="sr-only">Notifiche ({unreadCount})</span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 hover:bg-rbr-red/10 transition-colors"
              >
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-rbr-text-primary">
                    {user?.name || 'User'}
                  </p>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getRoleBadgeVariant(user?.role || '')}`}
                  >
                    {formatRole(user?.role || 'User')}
                  </Badge>
                </div>
                <Avatar className="h-9 w-9 border-2 border-rbr-red/30">
                  <AvatarFallback className="bg-racing-red-gradient text-white font-heading">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-rbr-dark-elevated border-rbr-red/20"
            >
              <DropdownMenuLabel className="text-rbr-text-primary">
                Il Mio Account
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-rbr-red/20" />
              <DropdownMenuItem
                onClick={() => router.push('/profile')}
                className="text-rbr-text-secondary hover:text-rbr-text-primary hover:bg-rbr-red/10 cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profilo</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/profile')}
                className="text-rbr-text-secondary hover:text-rbr-text-primary hover:bg-rbr-red/10 cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Impostazioni</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-rbr-red/20" />
              <DropdownMenuItem
                className="text-rbr-red hover:text-rbr-red-bright hover:bg-rbr-red/10 cursor-pointer"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Esci</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Racing border effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rbr-red to-transparent" />
      </div>
    </header>
  );
}

