/**
 * Red Bull Racing - Payment Gateway Debug Console
 * Real-time console for monitoring payment gateway requests and responses
 */

export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Terminal,
  Download,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

// Simulated debug logs
const debugLogs = [
  {
    id: '1',
    timestamp: '2025-01-20 20:45:32',
    gateway: 'Nexy',
    method: 'POST',
    endpoint: '/api/v1/payments',
    status: 200,
    duration: '245ms',
    request: {
      amount: 12.50,
      currency: 'EUR',
      orderId: 'ORD-2025-001',
      customer: {
        email: 'john.doe@redbullracing.com',
        name: 'John Doe',
      },
    },
    response: {
      success: true,
      transactionId: 'TXN-NEXY-123456',
      status: 'completed',
      timestamp: '2025-01-20T20:45:32Z',
    },
  },
  {
    id: '2',
    timestamp: '2025-01-20 20:42:15',
    gateway: 'Nexy',
    method: 'GET',
    endpoint: '/api/v1/payments/status',
    status: 200,
    duration: '89ms',
    request: {
      transactionId: 'TXN-NEXY-123455',
    },
    response: {
      status: 'completed',
      amount: 8.00,
      currency: 'EUR',
    },
  },
  {
    id: '3',
    timestamp: '2025-01-20 20:38:01',
    gateway: 'Satispay',
    method: 'POST',
    endpoint: '/wally-services/protocol/payments',
    status: 401,
    duration: '156ms',
    request: {
      flow: 'MATCH_CODE',
      amount_unit: 1250,
      currency: 'EUR',
    },
    response: {
      error: 'Unauthorized',
      message: 'Invalid API credentials',
      code: 'AUTH_FAILED',
    },
  },
];

const getStatusBadge = (status: number) => {
  if (status >= 200 && status < 300) {
    return (
      <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        {status}
      </Badge>
    );
  } else if (status >= 400 && status < 500) {
    return (
      <Badge className="bg-red-500/20 text-red-500 border-red-500/30 gap-1">
        <XCircle className="h-3 w-3" />
        {status}
      </Badge>
    );
  } else if (status >= 500) {
    return (
      <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 gap-1">
        <XCircle className="h-3 w-3" />
        {status}
      </Badge>
    );
  } else {
    return (
      <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30 gap-1">
        <Clock className="h-3 w-3" />
        {status}
      </Badge>
    );
  }
};

const getMethodBadge = (method: string) => {
  const colors: Record<string, string> = {
    GET: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    POST: 'bg-green-500/20 text-green-500 border-green-500/30',
    PUT: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    DELETE: 'bg-red-500/20 text-red-500 border-red-500/30',
    PATCH: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  };

  return (
    <Badge className={colors[method] || 'bg-gray-500/20 text-gray-500 border-gray-500/30'}>
      {method}
    </Badge>
  );
};

export default function DebugConsolePage() {
  return (
    <div className="space-y-6 animate-racing-slide-up">
      <PageHeader
        title="Console Debug"
        subtitle="Monitora in tempo reale le richieste ai gateway di pagamento"
        action={
          <Link href="/super-admin/payment-gateways">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Torna ai Gateway
            </Button>
          </Link>
        }
        breadcrumbs={[
          { label: 'Super Admin' },
          { label: 'Gateway Pagamento' },
          { label: 'Console Debug' },
        ]}
      />

      {/* Filters */}
      <div className="racing-card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rbr-text-muted" />
              <Input
                placeholder="Cerca per endpoint, ID transazione..."
                className="pl-10"
              />
            </div>
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Gateway" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i Gateway</SelectItem>
              <SelectItem value="nexy">Nexy</SelectItem>
              <SelectItem value="satispay">Satispay</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
              <SelectItem value="edenred">Edenred</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli Status</SelectItem>
              <SelectItem value="2xx">2xx (Success)</SelectItem>
              <SelectItem value="4xx">4xx (Client Error)</SelectItem>
              <SelectItem value="5xx">5xx (Server Error)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Esporta
          </Button>
          <Button variant="outline" className="gap-2 text-red-500 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
            Pulisci
          </Button>
        </div>
      </div>

      {/* Debug Logs */}
      <div className="space-y-4">
        {debugLogs.map((log) => (
          <div
            key={log.id}
            className="racing-card hover:shadow-racing-lg transition-all duration-300"
          >
            {/* Log Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-rbr-border-light">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-mono text-rbr-text-muted">
                  {log.timestamp}
                </span>
                <Badge className="bg-rbr-navy/20 text-rbr-navy border-rbr-navy/30">
                  {log.gateway}
                </Badge>
                {getMethodBadge(log.method)}
                {getStatusBadge(log.status)}
                <span className="text-xs text-rbr-text-muted">
                  {log.duration}
                </span>
              </div>
            </div>

            {/* Endpoint */}
            <div className="mb-4">
              <p className="text-xs text-rbr-text-muted mb-1">Endpoint:</p>
              <code className="text-sm font-mono text-rbr-text-primary bg-rbr-dark-elevated px-3 py-1.5 rounded block">
                {log.method} {log.endpoint}
              </code>
            </div>

            {/* Request & Response */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Request */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-rbr-text-secondary">
                    REQUEST
                  </span>
                  <div className="flex-1 h-px bg-rbr-border-light" />
                </div>
                <pre className="text-xs font-mono bg-rbr-dark-elevated p-3 rounded border border-rbr-border-light overflow-x-auto">
                  <code className="text-green-400">
                    {JSON.stringify(log.request, null, 2)}
                  </code>
                </pre>
              </div>

              {/* Response */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-rbr-text-secondary">
                    RESPONSE
                  </span>
                  <div className="flex-1 h-px bg-rbr-border-light" />
                </div>
                <pre className="text-xs font-mono bg-rbr-dark-elevated p-3 rounded border border-rbr-border-light overflow-x-auto">
                  <code className={log.status >= 400 ? 'text-red-400' : 'text-blue-400'}>
                    {JSON.stringify(log.response, null, 2)}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (if no logs) */}
      {debugLogs.length === 0 && (
        <div className="racing-card text-center py-12">
          <Terminal className="h-12 w-12 text-rbr-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-heading font-bold text-rbr-text-primary mb-2">
            Nessun Log Disponibile
          </h3>
          <p className="text-sm text-rbr-text-secondary">
            Effettua una chiamata API a un gateway di pagamento per visualizzare i log qui.
          </p>
        </div>
      )}
    </div>
  );
}

