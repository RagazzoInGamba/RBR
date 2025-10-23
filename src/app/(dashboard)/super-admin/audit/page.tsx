/**
 * Red Bull Racing - Audit Logs
 * Super Admin interface for viewing system audit trail
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
import { Search, Download, Shield, AlertCircle, CheckCircle, Info, Clock } from 'lucide-react';

// Simulated audit log data
const auditLogs = [
  {
    id: '1',
    action: 'user.login',
    user: 'admin@redbullracing.com',
    entity: 'User',
    entityId: '1',
    changes: { email: 'admin@redbullracing.com', role: 'SUPER_ADMIN' },
    timestamp: '2025-01-20 18:30:15',
    ipAddress: '192.168.1.100',
    severity: 'info',
  },
  {
    id: '2',
    action: 'payment_gateway.update',
    user: 'admin@redbullracing.com',
    entity: 'PaymentGatewayConfig',
    entityId: 'nexy-prod',
    changes: { environment: 'PRODUCTION', isActive: true },
    timestamp: '2025-01-20 17:45:30',
    ipAddress: '192.168.1.100',
    severity: 'warning',
  },
  {
    id: '3',
    action: 'user.create',
    user: 'admin@redbullracing.com',
    entity: 'User',
    entityId: '5',
    changes: { email: 'john.doe@redbullracing.com', role: 'END_USER' },
    timestamp: '2025-01-20 16:20:00',
    ipAddress: '192.168.1.100',
    severity: 'info',
  },
  {
    id: '4',
    action: 'system.settings.update',
    user: 'admin@redbullracing.com',
    entity: 'Settings',
    entityId: 'general',
    changes: { maxBookingsPerDay: 3, minAdvanceHours: 2 },
    timestamp: '2025-01-20 15:10:45',
    ipAddress: '192.168.1.100',
    severity: 'warning',
  },
  {
    id: '5',
    action: 'user.delete',
    user: 'admin@redbullracing.com',
    entity: 'User',
    entityId: '8',
    changes: { email: 'old.user@redbullracing.com', deleted: true },
    timestamp: '2025-01-20 14:05:20',
    ipAddress: '192.168.1.100',
    severity: 'error',
  },
];

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'error':
      return <AlertCircle className="h-4 w-4 text-rbr-red" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Info className="h-4 w-4 text-rbr-accent-blue" />;
  }
};

const getSeverityBadge = (severity: string) => {
  const styles: Record<string, string> = {
    error: 'bg-rbr-red/20 text-rbr-red border-rbr-red/30',
    warning: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    success: 'bg-green-500/20 text-green-500 border-green-500/30',
    info: 'bg-rbr-accent-blue/20 text-rbr-accent-blue border-rbr-accent-blue/30',
  };

  const labels: Record<string, string> = {
    error: 'Errore',
    warning: 'Avviso',
    success: 'Successo',
    info: 'Info',
  };

  return (
    <Badge className={`gap-1 ${styles[severity] || styles.info}`}>
      {getSeverityIcon(severity)}
      {labels[severity] || severity}
    </Badge>
  );
};

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    'user.login': 'Accesso Utente',
    'user.create': 'Creazione Utente',
    'user.update': 'Modifica Utente',
    'user.delete': 'Eliminazione Utente',
    'payment_gateway.update': 'Aggiornamento Gateway Pagamento',
    'system.settings.update': 'Aggiornamento Impostazioni',
  };

  return labels[action] || action;
};

export default function AuditPage() {
  return (
    <div className="space-y-6 animate-racing-slide-up">
      <PageHeader
        title="Log Audit Sistema"
        subtitle="Traccia completa di tutte le attività del sistema"
        action={
          <Button variant="outline" className="border-rbr-navy text-rbr-navy gap-2">
            <Download className="h-4 w-4" />
            Esporta Logs
          </Button>
        }
        breadcrumbs={[
          { label: 'Super Admin' },
          { label: 'Audit' },
        ]}
      />

      {/* Filters */}
      <div className="racing-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rbr-text-muted" />
            <Input
              placeholder="Cerca per azione, utente, entità..."
              className="pl-10"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Severità" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le Severità</SelectItem>
              <SelectItem value="error">Errore</SelectItem>
              <SelectItem value="warning">Avviso</SelectItem>
              <SelectItem value="success">Successo</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="today">Oggi</SelectItem>
              <SelectItem value="week">Ultima Settimana</SelectItem>
              <SelectItem value="month">Ultimo Mese</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="racing-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-rbr-border">
              <TableHead>Timestamp</TableHead>
              <TableHead>Azione</TableHead>
              <TableHead>Utente</TableHead>
              <TableHead>Entità</TableHead>
              <TableHead>Severità</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id} className="border-rbr-border hover:bg-rbr-card-overlay">
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-rbr-text-secondary">
                    <Clock className="h-3 w-3" />
                    {log.timestamp}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-rbr-text-primary">
                    {getActionLabel(log.action)}
                  </p>
                  <p className="text-xs text-rbr-text-muted font-mono">
                    {log.action}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-rbr-text-secondary">
                    {log.user}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-rbr-text-primary">
                    {log.entity}
                  </p>
                  <p className="text-xs text-rbr-text-muted font-mono">
                    ID: {log.entityId}
                  </p>
                </TableCell>
                <TableCell>
                  {getSeverityBadge(log.severity)}
                </TableCell>
                <TableCell>
                  <p className="text-xs text-rbr-text-muted font-mono">
                    {log.ipAddress}
                  </p>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="racing-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rbr-text-muted">Log Totali</p>
              <p className="text-2xl font-heading font-bold text-rbr-text-primary">
                45,892
              </p>
            </div>
            <Shield className="h-8 w-8 text-rbr-navy opacity-50" />
          </div>
        </div>
        <div className="racing-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rbr-text-muted">Errori</p>
              <p className="text-2xl font-heading font-bold text-rbr-red">
                124
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-rbr-red opacity-50" />
          </div>
        </div>
        <div className="racing-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rbr-text-muted">Avvisi</p>
              <p className="text-2xl font-heading font-bold text-yellow-500">
                456
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500 opacity-50" />
          </div>
        </div>
        <div className="racing-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rbr-text-muted">Info</p>
              <p className="text-2xl font-heading font-bold text-rbr-accent-blue">
                45,312
              </p>
            </div>
            <Info className="h-8 w-8 text-rbr-accent-blue opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}








