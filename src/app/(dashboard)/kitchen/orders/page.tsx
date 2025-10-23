/**
 * Red Bull Racing - Kitchen Orders
 * Kitchen Admin interface for managing orders with DataTable
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
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  MoreVertical,
  Calendar,
  Loader2,
  ChefHat,
  Eye,
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
import type { Booking, User as PrismaUser } from '@prisma/client';

type BookingWithUser = Booking & {
  user: PrismaUser;
  priority?: number;
};

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    CONFIRMED: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    PREPARING: 'bg-rbr-navy/20 text-rbr-navy border-rbr-navy/30',
    READY: 'bg-green-500/20 text-green-500 border-green-500/30',
    COMPLETED: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
    CANCELLED: 'bg-rbr-red/20 text-rbr-red border-rbr-red/30',
  };

  const labels: Record<string, string> = {
    PENDING: 'In Attesa',
    CONFIRMED: 'Confermato',
    PREPARING: 'In Preparazione',
    READY: 'Pronto',
    COMPLETED: 'Completato',
    CANCELLED: 'Annullato',
  };

  return (
    <Badge className={styles[status] || 'bg-gray-500/20 text-gray-500'}>
      {labels[status] || status}
    </Badge>
  );
};

const getMealTypeBadge = (mealType: string) => {
  const labels: Record<string, string> = {
    BREAKFAST: 'Colazione',
    LUNCH: 'Pranzo',
    DINNER: 'Cena',
    SNACK: 'Snack',
  };

  return (
    <Badge variant="outline" className="text-xs">
      {labels[mealType] || mealType}
    </Badge>
  );
};

export default function KitchenOrdersPage() {
  const [orders, setOrders] = useState<BookingWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/kitchen/orders');

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      toast.error('Errore nel caricamento ordini');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update order status
  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      toast.success('Stato aggiornato');
      fetchOrders();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Errore durante l\'aggiornamento'
      );
    }
  };

  // View order details
  const viewDetails = (order: BookingWithUser) => {
    // Could open a modal with full order details
    toast.info(`Dettagli ordine #${order.id.slice(0, 8)}...`);
  };

  // Column Definitions
  const columns: ColumnDef<BookingWithUser>[] = [
    {
      accessorKey: 'id',
      header: 'ID Ordine',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-rbr-text-muted">
          #{row.original.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      header: 'Cliente',
      cell: ({ row }) => {
        const user = row.original?.user;
        if (!user) return <span className="text-rbr-text-muted">N/A</span>;

        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';

        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-rbr-navy/20 flex items-center justify-center text-rbr-navy text-xs font-bold">
              {user.firstName?.[0]?.toUpperCase() || '?'}
              {user.lastName?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-medium text-rbr-text-primary text-sm">
                {fullName}
              </p>
              <p className="text-xs text-rbr-text-muted">{user.email || 'N/A'}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'date',
      header: 'Data Pasto',
      cell: ({ row }) => {
        const order = row.original;
        if (!order?.date) return <span className="text-rbr-text-muted">N/A</span>;
        return (
          <div className="flex items-center gap-1 text-sm text-rbr-text-secondary">
            <Calendar className="h-3 w-3" />
            {format(new Date(order.date), 'dd/MM/yyyy')}
          </div>
        );
      },
    },
    {
      accessorKey: 'mealType',
      header: 'Pasto',
      cell: ({ row }) => {
        const order = row.original;
        if (!order?.mealType) return <span className="text-rbr-text-muted">N/A</span>;
        return getMealTypeBadge(order.mealType);
      },
    },
    {
      accessorKey: 'totalPrice',
      header: 'Totale',
      cell: ({ row }) => {
        const order = row.original;
        if (!order?.totalPrice) return <span className="text-rbr-text-muted">€0.00</span>;
        const price = order.totalPrice / 100;
        return (
          <span className="font-medium text-rbr-text-primary">
            €{price.toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Stato',
      cell: ({ row }) => {
        const order = row.original;
        if (!order?.status) return <span className="text-rbr-text-muted">N/A</span>;
        return getStatusBadge(order.status);
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'bookedAt',
      header: 'Prenotato',
      cell: ({ row }) => {
        const order = row.original;
        if (!order?.bookedAt) return <span className="text-rbr-text-muted">N/A</span>;
        return (
          <div className="flex items-center gap-1 text-xs text-rbr-text-secondary">
            <Clock className="h-3 w-3" />
            {format(new Date(order.bookedAt), 'dd/MM HH:mm')}
          </div>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priorità',
      cell: ({ row }) => {
        const priority = row.original.priority || 0;
        let color = 'text-gray-500';
        if (priority > 20) color = 'text-rbr-red';
        else if (priority > 10) color = 'text-yellow-500';

        return (
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-3 w-1 rounded-full ${
                    priority > i * 10
                      ? i === 3
                        ? 'bg-rbr-red'
                        : i === 2
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                      : 'bg-rbr-dark-elevated'
                  }`}
                />
              ))}
            </div>
            <span className={`text-xs font-medium ${color}`}>
              {Math.round(priority)}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Azioni',
      cell: ({ row }) => {
        const order = row.original;

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

              {order.status === 'CONFIRMED' && (
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-rbr-navy/10 text-rbr-text-secondary"
                  onClick={() => updateStatus(order.id, 'PREPARING')}
                >
                  <ChefHat className="mr-2 h-4 w-4" />
                  Inizia Preparazione
                </DropdownMenuItem>
              )}

              {order.status === 'PREPARING' && (
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-green-500/10 text-green-500"
                  onClick={() => updateStatus(order.id, 'READY')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Segna Pronto
                </DropdownMenuItem>
              )}

              {order.status === 'READY' && (
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-green-500/10 text-green-500"
                  onClick={() => updateStatus(order.id, 'COMPLETED')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Completa
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                className="cursor-pointer hover:bg-rbr-navy/10 text-rbr-text-secondary"
                onClick={() => viewDetails(order)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Dettagli
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Stats calculations
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'PENDING').length,
    preparing: orders.filter((o) => o.status === 'PREPARING').length,
    ready: orders.filter((o) => o.status === 'READY').length,
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ordini Cucina" subtitle="Caricamento..." />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-rbr-red" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-racing-slide-up">
      <PageHeader
        title="Ordini Cucina"
        subtitle="Gestisci gli ordini in tempo reale"
        breadcrumbs={[{ label: 'Cucina' }, { label: 'Ordini' }]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={Package} label="Totale Ordini" value={stats.total} />
        <StatsCard
          icon={Clock}
          label="In Attesa"
          value={stats.pending}
          variant="red"
        />
        <StatsCard
          icon={AlertCircle}
          label="In Preparazione"
          value={stats.preparing}
          variant="navy"
        />
        <StatsCard
          icon={CheckCircle}
          label="Pronti"
          value={stats.ready}
          variant="accent"
        />
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={orders}
        searchPlaceholder="Cerca per cliente, ID ordine..."
        showExport={true}
        showColumnVisibility={true}
        pageSize={20}
      />
    </div>
  );
}
