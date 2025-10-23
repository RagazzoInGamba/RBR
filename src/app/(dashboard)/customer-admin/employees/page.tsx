/**
 * Red Bull Racing - Employee Management
 * Customer Admin interface for managing company employees with DataTable
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { EmployeeFormDialog } from '@/components/customer-admin/EmployeeFormDialog';
import {
  Plus,
  Edit2,
  Trash2,
  Mail,
  Building,
  Euro,
  MoreVertical,
  Loader2,
  Users,
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

interface Employee {
  id: string;
  userId: string;
  department: string | null;
  position: string | null;
  monthlyBudget: number | null;
  spentThisMonth: number | null;
  isActive: boolean;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  createdAt: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/customer/employees');

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (error) {
      toast.error('Errore nel caricamento dipendenti');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAdd = () => {
    setSelectedEmployee(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo dipendente?')) {
      return;
    }

    try {
      const response = await fetch(`/api/customer/employees/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      toast.success('Dipendente eliminato con successo');
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error("Errore nell'eliminazione");
    }
  };

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: 'user',
      header: 'Dipendente',
      cell: ({ row }) => {
        const employee = row.original;
        const fullName = `${employee.user.firstName || ''} ${employee.user.lastName || ''}`.trim();
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-racing-red-gradient flex items-center justify-center text-white font-heading font-bold">
              {employee.user.firstName?.[0]?.toUpperCase() || 'U'}
              {employee.user.lastName?.[0]?.toUpperCase() || ''}
            </div>
            <div>
              <p className="font-medium text-rbr-text-primary">{fullName || 'N/A'}</p>
              <div className="flex items-center gap-1 text-sm text-rbr-text-muted">
                <Mail className="h-3 w-3" />
                {employee.user.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'department',
      header: 'Dipartimento',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-rbr-text-secondary">
          <Building className="h-3 w-3" />
          {row.original.department || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'position',
      header: 'Posizione',
      cell: ({ row }) => (
        <span className="text-rbr-text-secondary">{row.original.position || '-'}</span>
      ),
    },
    {
      accessorKey: 'budget',
      header: 'Budget',
      cell: ({ row }) => {
        const budget = row.original.monthlyBudget || 0;
        const spent = row.original.spentThisMonth || 0;
        // const remaining = budget - spent; // Reserved for future budget tracking
        const percentage = budget > 0 ? (spent / budget) * 100 : 0;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Euro className="h-3 w-3 text-rbr-text-muted" />
              <span className="text-sm text-rbr-text-primary font-medium">
                {spent.toFixed(2)} / {budget.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-rbr-dark-elevated rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${
                  percentage > 90
                    ? 'bg-rbr-red'
                    : percentage > 70
                    ? 'bg-yellow-500'
                    : 'bg-rbr-accent-green'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
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
          className={
            row.original.isActive
              ? 'bg-green-500/20 text-green-500 border-green-500/30'
              : 'bg-gray-500/20 text-gray-500 border-gray-500/30'
          }
        >
          {row.original.isActive ? 'Attivo' : 'Inattivo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Azioni',
      cell: ({ row }) => {
        const employee = row.original;
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
                onClick={() => handleEdit(employee)}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Modifica
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer hover:bg-rbr-red/10 text-rbr-red"
                onClick={() => handleDelete(employee.id)}
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Gestione Dipendenti" subtitle="Caricamento..." />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-rbr-red" />
        </div>
      </div>
    );
  }

  const activeEmployees = employees.filter((e) => e.isActive).length;
  const totalBudget = employees.reduce((sum, e) => sum + (e.monthlyBudget || 0), 0);
  const totalSpent = employees.reduce((sum, e) => sum + (e.spentThisMonth || 0), 0);

  return (
    <div className="space-y-6 animate-racing-slide-up">
      <PageHeader
        title="Gestione Dipendenti"
        subtitle="Gestisci i dipendenti aziendali e i loro budget pasto"
        action={
          <Button onClick={handleAdd} className="bg-racing-red-gradient hover:opacity-90 gap-2">
            <Plus className="h-4 w-4" />
            Nuovo Dipendente
          </Button>
        }
        breadcrumbs={[{ label: 'Admin Cliente' }, { label: 'Dipendenti' }]}
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="racing-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rbr-text-muted">Totale Dipendenti</p>
              <p className="text-2xl font-heading font-bold text-rbr-text-primary">
                {employees.length}
              </p>
            </div>
            <Users className="h-8 w-8 text-rbr-navy opacity-50" />
          </div>
        </div>
        <div className="racing-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rbr-text-muted">Dipendenti Attivi</p>
              <p className="text-2xl font-heading font-bold text-rbr-accent-green">
                {activeEmployees}
              </p>
            </div>
            <Users className="h-8 w-8 text-rbr-accent-green opacity-50" />
          </div>
        </div>
        <div className="racing-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rbr-text-muted">Budget Mensile</p>
              <p className="text-2xl font-heading font-bold text-rbr-navy">
                {totalBudget.toFixed(0)}
              </p>
            </div>
            <Euro className="h-8 w-8 text-rbr-navy opacity-50" />
          </div>
        </div>
        <div className="racing-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rbr-text-muted">Spesa Corrente</p>
              <p className="text-2xl font-heading font-bold text-rbr-red">
                {totalSpent.toFixed(0)}
              </p>
            </div>
            <Euro className="h-8 w-8 text-rbr-red opacity-50" />
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={employees}
        searchPlaceholder="Cerca per nome, email, dipartimento..."
        showExport={true}
        showColumnVisibility={true}
        pageSize={10}
      />

      {/* Employee Form Dialog */}
      <EmployeeFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        employee={selectedEmployee as any}
        onSuccess={() => {
          fetchEmployees();
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
}
