/**
 * Red Bull Racing - User Management
 * Super Admin interface for managing all system users with DataTable
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { UserFormDialog } from '@/components/admin/UserFormDialog';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import {
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  ChefHat,
  UserCog,
  User as UserIcon,
  MoreVertical,
  Mail,
  Calendar,
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
import type { User } from '@prisma/client';

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return <Shield className="h-4 w-4" />;
    case 'KITCHEN_ADMIN':
      return <ChefHat className="h-4 w-4" />;
    case 'CUSTOMER_ADMIN':
      return <UserCog className="h-4 w-4" />;
    default:
      return <UserIcon className="h-4 w-4" />;
  }
};

const getRoleBadge = (role: string) => {
  const styles: Record<string, string> = {
    'SUPER_ADMIN': 'bg-rbr-red/20 text-rbr-red border-rbr-red/30',
    'KITCHEN_ADMIN': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    'CUSTOMER_ADMIN': 'bg-rbr-navy/20 text-rbr-navy border-rbr-navy/30',
    'END_USER': 'bg-gray-500/20 text-gray-500 border-gray-500/30',
  };

  const labels: Record<string, string> = {
    'SUPER_ADMIN': 'Super Admin',
    'KITCHEN_ADMIN': 'Admin Cucina',
    'CUSTOMER_ADMIN': 'Admin Cliente',
    'END_USER': 'Utente',
  };

  return (
    <Badge className={`gap-1 ${styles[role] || styles.END_USER}`}>
      {getRoleIcon(role)}
      {labels[role] || role}
    </Badge>
  );
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/users');

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      toast.error('Errore nel caricamento utenti');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handlers
  const handleAddUser = () => {
    setSelectedUser(undefined);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo utente?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      toast.success('Utente eliminato con successo');
      fetchUsers(); // Refresh list
    } catch (error) {
      toast.error("Errore nell'eliminazione dell'utente");
    }
  };

  const handleDialogSuccess = () => {
    fetchUsers(); // Refresh list after create/update
    setIsDialogOpen(false);
  };

  // Column Definitions
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Utente',
      cell: ({ row }) => {
        const user = row.original;
        if (!user) return <span className="text-rbr-text-muted">N/A</span>;

        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';

        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-racing-red-gradient flex items-center justify-center text-white font-heading font-bold">
              {user.firstName?.[0]?.toUpperCase() || '?'}
              {user.lastName?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-medium text-rbr-text-primary">
                {fullName}
              </p>
              <div className="flex items-center gap-1 text-sm text-rbr-text-muted">
                <Mail className="h-3 w-3" />
                {user.email || 'N/A'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Ruolo',
      cell: ({ row }) => {
        const user = row.original;
        if (!user?.role) return <span className="text-rbr-text-muted">N/A</span>;
        return getRoleBadge(user.role);
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'department',
      header: 'Dipartimento',
      cell: ({ row }) => (
        <span className="text-rbr-text-secondary">
          {row.original?.department || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Data Creazione',
      cell: ({ row }) => {
        const user = row.original;
        if (!user?.createdAt) return <span className="text-rbr-text-muted">N/A</span>;
        return (
          <div className="flex items-center gap-1 text-sm text-rbr-text-secondary">
            <Calendar className="h-3 w-3" />
            {new Date(user.createdAt).toLocaleDateString('it-IT')}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Azioni',
      cell: ({ row }) => {
        const user = row.original;
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
            <DropdownMenuContent
              align="end"
              className="bg-rbr-dark-elevated border-rbr-border"
            >
              <DropdownMenuLabel className="text-rbr-text-primary">
                Azioni
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-rbr-border" />
              <DropdownMenuItem
                className="cursor-pointer hover:bg-rbr-navy/10 text-rbr-text-secondary"
                onClick={() => handleEditUser(user)}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Modifica
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer hover:bg-rbr-red/10 text-rbr-red"
                onClick={() => handleDeleteUser(user.id)}
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Gestione Utenti" subtitle="Caricamento..." />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-rbr-red" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-racing-slide-up">
      <PageHeader
        title="Gestione Utenti"
        subtitle="Gestisci tutti gli utenti del sistema"
        action={
          <Button
            onClick={handleAddUser}
            className="bg-racing-red-gradient hover:opacity-90 gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Nuovo Utente
          </Button>
        }
        breadcrumbs={[{ label: 'Super Admin' }, { label: 'Utenti' }]}
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="racing-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rbr-text-muted">Totale Utenti</p>
              <p className="text-2xl font-heading font-bold text-rbr-text-primary">
                {users.length}
              </p>
            </div>
            <UserIcon className="h-8 w-8 text-rbr-navy opacity-50" />
          </div>
        </div>
        <div className="racing-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rbr-text-muted">Super Admin</p>
              <p className="text-2xl font-heading font-bold text-rbr-red">
                {users.filter((u) => u.role === 'SUPER_ADMIN').length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-rbr-red opacity-50" />
          </div>
        </div>
        <div className="racing-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rbr-text-muted">Amministratori</p>
              <p className="text-2xl font-heading font-bold text-yellow-500">
                {users.filter((u) => u.role.includes('ADMIN') && u.role !== 'SUPER_ADMIN')
                  .length}
              </p>
            </div>
            <UserCog className="h-8 w-8 text-yellow-500 opacity-50" />
          </div>
        </div>
        <div className="racing-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rbr-text-muted">Utenti Standard</p>
              <p className="text-2xl font-heading font-bold text-rbr-navy">
                {users.filter((u) => u.role === 'END_USER').length}
              </p>
            </div>
            <UserIcon className="h-8 w-8 text-rbr-navy opacity-50" />
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Cerca per nome, email, dipartimento..."
        showExport={true}
        showColumnVisibility={true}
        pageSize={10}
      />

      {/* User Form Dialog */}
      <UserFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={selectedUser}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
