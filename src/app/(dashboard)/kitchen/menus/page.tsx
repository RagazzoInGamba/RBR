/**
 * Red Bull Racing - Menu Management
 * Kitchen Admin interface for managing weekly menus with DataTable
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { StatsCard } from '@/components/ui/StatsCard';
import { MenuFormDialog } from '@/components/kitchen/MenuFormDialog';
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  UtensilsCrossed,
  MoreVertical,
  Clock,
  Users,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Menu } from '@prisma/client';

const getMealTypeBadge = (mealType: string) => {
  const styles: Record<string, string> = {
    BREAKFAST: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    LUNCH: 'bg-rbr-red/20 text-rbr-red border-rbr-red/30',
    DINNER: 'bg-rbr-navy/20 text-rbr-navy border-rbr-navy/30',
    SNACK: 'bg-green-500/20 text-green-500 border-green-500/30',
  };

  const labels: Record<string, string> = {
    BREAKFAST: 'Colazione',
    LUNCH: 'Pranzo',
    DINNER: 'Cena',
    SNACK: 'Snack',
  };

  return (
    <Badge className={styles[mealType] || 'bg-gray-500/20 text-gray-500'}>
      {labels[mealType] || mealType}
    </Badge>
  );
};

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | undefined>(undefined);

  // Fetch menus from API
  const fetchMenus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/kitchen/menus');

      if (!response.ok) {
        throw new Error('Failed to fetch menus');
      }

      const data = await response.json();
      setMenus(data.menus || []);
    } catch (error) {
      toast.error('Errore nel caricamento menu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // Handlers
  const handleAddMenu = () => {
    setSelectedMenu(undefined);
    setIsDialogOpen(true);
  };

  const handleEditMenu = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsDialogOpen(true);
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo menu?')) {
      return;
    }

    try {
      const response = await fetch(`/api/kitchen/menus/${menuId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete menu');
      }

      toast.success('Menu eliminato con successo');
      fetchMenus(); // Refresh list
    } catch (error) {
      toast.error('Errore nell\'eliminazione del menu');
    }
  };

  const handleDialogSuccess = () => {
    fetchMenus(); // Refresh list after create/update
    setIsDialogOpen(false);
  };

  // Column Definitions
  const columns: ColumnDef<Menu>[] = [
    {
      accessorKey: 'name',
      header: 'Nome Menu',
      cell: ({ row }) => {
        const menu = row.original;
        if (!menu) return <span className="text-rbr-text-muted">N/A</span>;

        return (
          <div>
            <p className="font-medium text-rbr-text-primary">{menu.name || 'N/A'}</p>
            {menu.courses && typeof menu.courses === 'object' && (
              <p className="text-xs text-rbr-text-muted">
                {Object.values(menu.courses as Record<string, any[]>).flat().length} ricette
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'startDate',
      header: 'Periodo Validità',
      cell: ({ row }) => {
        const menu = row.original;
        if (!menu?.startDate) return <span className="text-rbr-text-muted">N/A</span>;
        const startDate = format(new Date(menu.startDate), 'dd/MM/yyyy', { locale: it });
        const endDate = menu.endDate ? format(new Date(menu.endDate), 'dd/MM/yyyy', { locale: it }) : startDate;
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-rbr-text-muted" />
            <span className="text-rbr-text-secondary text-sm">
              {startDate === endDate ? startDate : `${startDate} - ${endDate}`}
            </span>
          </div>
        );
      },
      sortingFn: 'datetime',
    },
    {
      accessorKey: 'mealType',
      header: 'Tipo Pasto',
      cell: ({ row }) => {
        const menu = row.original;
        if (!menu?.mealType) return <span className="text-rbr-text-muted">N/A</span>;
        return getMealTypeBadge(menu.mealType);
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'maxBookings',
      header: 'Max Posti',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-rbr-text-secondary">
          <Users className="h-3 w-3" />
          <span>{row.original?.maxBookings ?? 0}</span>
        </div>
      ),
    },
    {
      accessorKey: 'currentBookings',
      header: 'Prenotazioni',
      cell: ({ row }) => {
        const current = row.original.currentBookings || 0;
        const max = row.original.maxBookings;
        const percentage = max > 0 ? (current / max) * 100 : 0;

        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-rbr-text-secondary">
              {current}/{max}
            </span>
            <div className="w-20 h-2 bg-rbr-dark-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-rbr-navy transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Stato',
      cell: ({ row }) => (
        <Badge
          variant={row.original.isActive ? 'default' : 'secondary'}
          className={
            row.original.isActive
              ? 'bg-green-500/20 text-green-500 border-green-500/30'
              : ''
          }
        >
          {row.original.isActive ? 'Attivo' : 'Inattivo'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Creato',
      cell: ({ row }) => {
        const menu = row.original;
        if (!menu?.createdAt) return <span className="text-rbr-text-muted">N/A</span>;
        return (
          <div className="flex items-center gap-1 text-sm text-rbr-text-secondary">
            <Clock className="h-3 w-3" />
            {format(new Date(menu.createdAt), 'dd/MM/yyyy')}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Azioni',
      cell: ({ row }) => {
        const menu = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-rbr-text-primary hover:bg-rbr-dark-elevated"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Azioni</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-rbr-dark-elevated border-rbr-border">
              <DropdownMenuLabel className="text-rbr-text-primary">Azioni</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-rbr-border" />
              <DropdownMenuItem
                className="cursor-pointer hover:bg-rbr-navy/10 text-rbr-text-secondary"
                onClick={() => handleEditMenu(menu)}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Modifica
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer hover:bg-rbr-red/10 text-rbr-red"
                onClick={() => handleDeleteMenu(menu.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Stats calculations
  const now = new Date();
  const stats = {
    total: menus.length,
    active: menus.filter((m) => m.isActive).length,
    upcoming: menus.filter((m) => m.startDate && new Date(m.startDate) > now).length,
    today: menus.filter(
      (m) =>
        m.startDate &&
        format(new Date(m.startDate), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
    ).length,
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Gestione Menu" subtitle="Caricamento..." />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-rbr-red" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-racing-slide-up">
      <PageHeader
        title="Gestione Menu"
        subtitle="Crea e gestisci i menu giornalieri"
        action={
          <Button onClick={handleAddMenu} className="bg-racing-red-gradient hover:opacity-90 gap-2">
            <Plus className="h-4 w-4" />
            Nuovo Menu
          </Button>
        }
        breadcrumbs={[{ label: 'Cucina' }, { label: 'Menu' }]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={UtensilsCrossed} label="Totale Menu" value={stats.total} />
        <StatsCard icon={Calendar} label="Attivi" value={stats.active} variant="accent" />
        <StatsCard icon={Clock} label="Futuri" value={stats.upcoming} variant="navy" />
        <StatsCard icon={Calendar} label="Oggi" value={stats.today} variant="red" />
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={menus}
        searchPlaceholder="Cerca menu per nome, data..."
        showExport={true}
        showColumnVisibility={true}
        pageSize={10}
      />

      {/* Menu Form Dialog */}
      <MenuFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        menu={selectedMenu as any}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
