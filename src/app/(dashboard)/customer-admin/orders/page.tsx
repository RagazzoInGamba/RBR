/**
 * Red Bull Racing - Customer Orders View
 * Customer Admin interface for viewing company orders
 */

export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Download, Clock, CheckCircle, Euro, Calendar } from 'lucide-react';

// Simulated orders data
const orders = [
  {
    id: 'ORD-2501',
    employee: 'Max Speedster',
    department: 'Engineering',
    items: ['Pasta Carbonara', 'Insalata'],
    total: 15.50,
    status: 'completed',
    date: '2025-01-20 12:30',
  },
  {
    id: 'ORD-2502',
    employee: 'Laura Rossi',
    department: 'Design',
    items: ['Bistecca', 'Patate'],
    total: 22.00,
    status: 'completed',
    date: '2025-01-20 12:15',
  },
  {
    id: 'ORD-2503',
    employee: 'Marco Ferrari',
    department: 'Marketing',
    items: ['Risotto', 'Tiramisù'],
    total: 18.75,
    status: 'preparing',
    date: '2025-01-20 12:45',
  },
  {
    id: 'ORD-2504',
    employee: 'Sofia Bianchi',
    department: 'HR',
    items: ['Lasagne'],
    total: 12.00,
    status: 'pending',
    date: '2025-01-20 13:00',
  },
];

const getStatusBadge = (status: string) => {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    completed: { bg: 'bg-green-500/20', text: 'text-green-500', label: 'Completato' },
    preparing: { bg: 'bg-rbr-navy/20', text: 'text-rbr-navy', label: 'In Preparazione' },
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', label: 'In Attesa' },
    cancelled: { bg: 'bg-rbr-red/20', text: 'text-rbr-red', label: 'Annullato' },
  };

  const style = styles[status] || styles.pending;

  return (
    <Badge className={`${style.bg} ${style.text} border-${style.text}/30`}>
      {style.label}
    </Badge>
  );
};

export default function CustomerOrdersPage() {
  return (
    <div className="space-y-6 animate-racing-slide-up">
      <PageHeader
        title="Ordini Aziendali"
        subtitle="Visualizza gli ordini dei dipendenti"
        action={
          <Button variant="outline" className="border-rbr-navy text-rbr-navy gap-2">
            <Download className="h-4 w-4" />
            Esporta Report
          </Button>
        }
        breadcrumbs={[
          { label: 'Admin Cliente' },
          { label: 'Ordini' },
        ]}
      />

      {/* Filters */}
      <div className="racing-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rbr-text-muted" />
            <Input placeholder="Cerca per ID ordine, dipendente..." className="pl-10" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Reparto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i Reparti</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="hr">HR</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli Stati</SelectItem>
              <SelectItem value="completed">Completato</SelectItem>
              <SelectItem value="preparing">In Preparazione</SelectItem>
              <SelectItem value="pending">In Attesa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="racing-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-rbr-border">
              <TableHead>ID Ordine</TableHead>
              <TableHead>Dipendente</TableHead>
              <TableHead>Piatti</TableHead>
              <TableHead>Totale</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Data/Ora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="border-rbr-border hover:bg-rbr-card-overlay">
                <TableCell>
                  <span className="font-mono text-sm font-medium text-rbr-text-primary">
                    {order.id}
                  </span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-rbr-text-primary">{order.employee}</p>
                    <p className="text-xs text-rbr-text-muted">{order.department}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <p key={idx} className="text-sm text-rbr-text-secondary">
                        • {item}
                      </p>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 font-medium text-rbr-text-primary">
                    <Euro className="h-4 w-4 text-green-500" />
                    €{order.total.toFixed(2)}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(order.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-rbr-text-secondary">
                    <Calendar className="h-3 w-3" />
                    {order.date}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="racing-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rbr-text-muted">Ordini Oggi</p>
              <p className="text-2xl font-heading font-bold text-rbr-text-primary">
                {orders.length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-rbr-navy opacity-50" />
          </div>
        </div>
        <div className="racing-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rbr-text-muted">In Preparazione</p>
              <p className="text-2xl font-heading font-bold text-rbr-navy">
                {orders.filter(o => o.status === 'preparing').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-rbr-navy opacity-50" />
          </div>
        </div>
        <div className="racing-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rbr-text-muted">Completati</p>
              <p className="text-2xl font-heading font-bold text-green-500">
                {orders.filter(o => o.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="racing-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rbr-text-muted">Spesa Oggi</p>
              <p className="text-2xl font-heading font-bold text-rbr-accent-blue">
                €{orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
              </p>
            </div>
            <Euro className="h-8 w-8 text-rbr-accent-blue opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}








