/**
 * Red Bull Racing - Payment Gateway Configuration
 * Super Admin interface for managing payment gateway credentials and settings
 */

export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Settings, 
  TestTube2, 
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

// Simulated gateway data (will be fetched from API later)
const paymentGateways = [
  {
    id: 'nexy',
    name: 'Nexy',
    description: 'Sistema di pagamento Nexy per mense aziendali',
    logo: '💳',
    status: 'active',
    environment: 'production',
    lastTested: '2 ore fa',
    testStatus: 'success',
    configured: true,
  },
  {
    id: 'satispay',
    name: 'Satispay',
    description: 'Pagamenti mobili istantanei Satispay',
    logo: '📱',
    status: 'inactive',
    environment: 'staging',
    lastTested: 'Mai testato',
    testStatus: 'pending',
    configured: false,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Piattaforma globale di pagamenti online',
    logo: '💎',
    status: 'inactive',
    environment: 'sandbox',
    lastTested: 'Mai testato',
    testStatus: 'pending',
    configured: false,
  },
  {
    id: 'edenred',
    name: 'Ticket Restaurant (Edenred)',
    description: 'Buoni pasto elettronici Edenred',
    logo: '🎫',
    status: 'inactive',
    environment: 'sandbox',
    lastTested: 'Mai testato',
    testStatus: 'pending',
    configured: false,
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Attivo
        </Badge>
      );
    case 'inactive':
      return (
        <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30">
          <XCircle className="mr-1 h-3 w-3" />
          Inattivo
        </Badge>
      );
    case 'testing':
      return (
        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
          <Clock className="mr-1 h-3 w-3" />
          Test
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          Sconosciuto
        </Badge>
      );
  }
};

const getTestStatusBadge = (testStatus: string) => {
  switch (testStatus) {
    case 'success':
      return (
        <Badge variant="outline" className="border-green-500/30 text-green-500">
          ✓ Test OK
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="outline" className="border-red-500/30 text-red-500">
          ✗ Fallito
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="outline" className="border-gray-500/30 text-gray-500">
          − Non testato
        </Badge>
      );
    default:
      return null;
  }
};

const getEnvironmentBadge = (environment: string) => {
  switch (environment) {
    case 'production':
      return (
        <Badge className="bg-rbr-red/20 text-rbr-red border-rbr-red/30">
          Produzione
        </Badge>
      );
    case 'staging':
      return (
        <Badge className="bg-rbr-accent-yellow/20 text-rbr-accent-yellow border-rbr-accent-yellow/30">
          Staging
        </Badge>
      );
    case 'sandbox':
      return (
        <Badge className="bg-rbr-accent-blue/20 text-rbr-accent-blue border-rbr-accent-blue/30">
          Sandbox
        </Badge>
      );
    default:
      return null;
  }
};

export default function PaymentGatewaysPage() {
  return (
    <div className="space-y-8 animate-racing-slide-up">
      <PageHeader
        title="Gateway di Pagamento"
        subtitle="Configura e gestisci le integrazioni dei sistemi di pagamento"
        action={
          <div className="flex gap-3">
            <Link href="/super-admin/payment-gateways/debug">
              <Button variant="outline" className="gap-2">
                <Terminal className="h-4 w-4" />
                Console Debug
              </Button>
            </Link>
            <Button className="bg-racing-red-gradient hover:opacity-90 gap-2">
              <Plus className="h-4 w-4" />
              Aggiungi Gateway
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: 'Super Admin' },
          { label: 'Gateway Pagamento' },
        ]}
      />

      {/* Gateway Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {paymentGateways.map((gateway) => (
          <div
            key={gateway.id}
            className="racing-card group relative overflow-hidden"
          >
            {/* Status indicator bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${
                gateway.status === 'active'
                  ? 'bg-green-500'
                  : 'bg-gray-500'
              }`}
            />

            <div className="space-y-4 p-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{gateway.logo}</div>
                  <div>
                    <h3 className="text-xl font-heading font-bold text-rbr-text-primary mb-1">
                      {gateway.name}
                    </h3>
                    <p className="text-sm text-rbr-text-secondary">
                      {gateway.description}
                    </p>
                  </div>
                </div>
                {getStatusBadge(gateway.status)}
              </div>

              {/* Status Info */}
              <div className="flex flex-wrap gap-2">
                {getEnvironmentBadge(gateway.environment)}
                {getTestStatusBadge(gateway.testStatus)}
                {!gateway.configured && (
                  <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Non Configurato
                  </Badge>
                )}
              </div>

              {/* Last Tested */}
              <div className="pt-2 border-t border-rbr-border-light">
                <p className="text-xs text-rbr-text-muted">
                  Ultimo test: <span className="text-rbr-text-secondary">{gateway.lastTested}</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-rbr-navy text-rbr-navy hover:bg-rbr-navy hover:text-white gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Configura
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-rbr-accent-blue text-rbr-accent-blue hover:bg-rbr-accent-blue hover:text-rbr-dark gap-2"
                  disabled={!gateway.configured}
                >
                  <TestTube2 className="h-4 w-4" />
                  Testa
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Card */}
      <div className="racing-card bg-rbr-accent-blue/5 border-rbr-accent-blue/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-rbr-accent-blue/20">
            <AlertCircle className="h-6 w-6 text-rbr-accent-blue" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-bold text-rbr-text-primary mb-2">
              Informazioni Importanti
            </h3>
            <ul className="space-y-2 text-sm text-rbr-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-rbr-accent-blue">•</span>
                <span>Le credenziali sono crittografate e archiviate in modo sicuro nel database.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rbr-accent-blue">•</span>
                <span>Usa sempre l&apos;ambiente <strong>Sandbox/Staging</strong> per i test prima di passare alla produzione.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rbr-accent-blue">•</span>
                <span>La Console Debug registra tutte le richieste e risposte per facilitare il troubleshooting.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rbr-accent-blue">•</span>
                <span>Testa sempre i gateway dopo ogni modifica alla configurazione.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

