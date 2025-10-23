/**
 * Red Bull Racing - Command Palette
 * Global command palette for quick navigation (Cmd+K / Ctrl+K)
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Home,
  Users,
  ChefHat,
  ShoppingCart,
  Settings,
  Bell,
  User,
  FileText,
  BarChart3,
  Ticket,
  Calendar,
  UsersRound,
  ClipboardList,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
      setSearch('');
    },
    [router, onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Cerca pagine, azioni..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Nessun risultato trovato.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Azioni Rapide">
          <CommandItem onSelect={() => navigate('/booking/new')}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Nuova Prenotazione</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/kitchen/recipes')}>
            <ChefHat className="mr-2 h-4 w-4" />
            <span>Nuova Ricetta</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/super-admin/users')}>
            <Users className="mr-2 h-4 w-4" />
            <span>Nuovo Utente</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation - Super Admin */}
        <CommandGroup heading="Super Admin">
          <CommandItem onSelect={() => navigate('/super-admin')}>
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/super-admin/users')}>
            <Users className="mr-2 h-4 w-4" />
            <span>Gestione Utenti</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/super-admin/payment-gateways')}>
            <Ticket className="mr-2 h-4 w-4" />
            <span>Gateway Pagamento</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/super-admin/audit')}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Audit Log</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/super-admin/reports')}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Report</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/super-admin/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Impostazioni</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation - Kitchen */}
        <CommandGroup heading="Cucina">
          <CommandItem onSelect={() => navigate('/kitchen')}>
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard Cucina</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/kitchen/recipes')}>
            <ChefHat className="mr-2 h-4 w-4" />
            <span>Ricette</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/kitchen/menus')}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Menu</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/kitchen/orders')}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Ordini</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/kitchen/reports')}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Report Cucina</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation - Customer Admin */}
        <CommandGroup heading="Customer Admin">
          <CommandItem onSelect={() => navigate('/customer-admin')}>
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard Customer</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/customer-admin/employees')}>
            <Users className="mr-2 h-4 w-4" />
            <span>Dipendenti</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/customer-admin/groups')}>
            <UsersRound className="mr-2 h-4 w-4" />
            <span>Gruppi</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/customer-admin/orders')}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Ordini</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/customer-admin/reports')}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Report</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation - Booking */}
        <CommandGroup heading="Prenotazioni">
          <CommandItem onSelect={() => navigate('/booking')}>
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard Prenotazioni</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/booking/new')}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Nuova Prenotazione</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/booking/orders')}>
            <ClipboardList className="mr-2 h-4 w-4" />
            <span>Mie Prenotazioni</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/booking/notifications')}>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifiche</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* User */}
        <CommandGroup heading="Account">
          <CommandItem onSelect={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>Profilo</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
