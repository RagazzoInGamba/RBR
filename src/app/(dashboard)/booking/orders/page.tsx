/**
 * Red Bull Racing - My Orders
 * End User interface for viewing personal orders
 */

export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Euro, X } from 'lucide-react';

// Simulated orders
const orders = [
  {
    id: 'ORD-2501',
    date: '2025-01-20',
    time: '12:30',
    items: ['Pasta Carbonara', 'Insalata Caesar', 'Tiramisù'],
    total: 27.00,
    status: 'completed',
    location: 'Mensa',
  },
  {
    id: 'ORD-2502',
    date: '2025-01-19',
    time: '13:00',
    items: ['Bistecca alla Griglia', 'Patate al Forno'],
    total: 22.00,
    status: 'completed',
    location: 'Ufficio',
  },
  {
    id: 'ORD-2503',
    date: '2025-01-21',
    time: '12:30',
    items: ['Risotto ai Funghi', 'Insalata'],
    total: 16.50,
    status: 'confirmed',
    location: 'Mensa',
  },
  {
    id: 'ORD-2504',
    date: '2025-01-22',
    time: '13:00',
    items: ['Lasagne Bolognese'],
    total: 13.50,
    status: 'pending',
    location: 'Ufficio',
  },
];

const getStatusBadge = (status: string) => {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    completed: { bg: 'bg-green-500/20', text: 'text-green-500', label: 'Completato' },
    confirmed: { bg: 'bg-rbr-navy/20', text: 'text-rbr-navy', label: 'Confermato' },
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

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
};

export default function OrdersPage() {
  return (
    <div className="space-y-6 animate-racing-slide-up">
      <PageHeader
        title="I Miei Ordini"
        subtitle="Visualizza lo storico delle tue prenotazioni"
        breadcrumbs={[
          { label: 'Prenotazioni' },
          { label: 'I Miei Ordini' },
        ]}
      />

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="racing-card hover:shadow-racing-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-lg bg-racing-red-gradient flex items-center justify-center text-white font-heading font-bold text-2xl">
                  {order.date.split('-')[2]}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-medium text-rbr-text-primary">
                      {order.id}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-rbr-text-secondary">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(order.date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {order.time}
                    </div>
                    <span>• {order.location}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  <Euro className="h-5 w-5 text-green-500" />
                  <span className="text-xl font-heading font-bold text-rbr-text-primary">
                    {order.total.toFixed(2)}
                  </span>
                </div>
                {order.status === 'pending' || order.status === 'confirmed' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rbr-red text-rbr-red hover:bg-rbr-red hover:text-white"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Annulla
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-rbr-dark-elevated">
              <p className="text-xs text-rbr-text-muted mb-2">Piatti ordinati:</p>
              <ul className="space-y-1">
                {order.items.map((item, idx) => (
                  <li key={idx} className="text-sm text-rbr-text-secondary flex items-center gap-2">
                    <span className="text-rbr-red">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="racing-card">
          <p className="text-sm text-rbr-text-muted mb-1">Ordini Totali</p>
          <p className="text-2xl font-heading font-bold text-rbr-text-primary">
            {orders.length}
          </p>
        </div>
        <div className="racing-card">
          <p className="text-sm text-rbr-text-muted mb-1">Ordini Confermati</p>
          <p className="text-2xl font-heading font-bold text-rbr-navy">
            {orders.filter(o => o.status === 'confirmed' || o.status === 'pending').length}
          </p>
        </div>
        <div className="racing-card">
          <p className="text-sm text-rbr-text-muted mb-1">Spesa Totale</p>
          <p className="text-2xl font-heading font-bold text-green-500">
            €{orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}








