/**
 * Oracle Red Bull Racing - End User Dashboard
 * Real-time booking stats with Framer Motion
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, ShoppingCart, Euro, Calendar, Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserStats {
  stats: {
    availableMenus: {
      value: number;
      formatted: string;
    };
    myBookings: {
      value: number;
      formatted: string;
      trend: { value: string; direction: 'up' | 'down' };
    };
    monthlySpending: {
      value: number;
      formatted: string;
    };
    nextBooking: {
      value: string;
      description: string;
    };
  };
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function BookingDashboard() {
  const [data, setData] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/stats/user');
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle statistiche');
      }

      const stats = await response.json();
      setData(stats);
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <PageHeader
        title="Bentornato!"
        subtitle="Prenota i tuoi pasti e gestisci i tuoi ordini"
        action={
          <Button className="bg-racing-red-gradient hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            Prenota Pasto
          </Button>
        }
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-rbr-red" />
        </div>
      ) : error ? (
        <div className="racing-card p-6 text-center">
          <p className="text-rbr-red">{error}</p>
          <Button
            onClick={fetchStats}
            className="mt-4 bg-racing-red-gradient hover:opacity-90"
          >
            Riprova
          </Button>
        </div>
      ) : data ? (
        <>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div variants={item}>
              <StatsCard
                icon={UtensilsCrossed}
                label="Pasti Disponibili"
                value={data.stats.availableMenus.formatted}
                description="Questa settimana"
                variant="red"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={ShoppingCart}
                label="Tuoi Ordini"
                value={data.stats.myBookings.formatted}
                trend={{
                  value: parseFloat(data.stats.myBookings.trend.value),
                  direction: data.stats.myBookings.trend.direction
                }}
                description="Questo mese"
                variant="navy"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={Euro}
                label="Spesa Mensile"
                value={data.stats.monthlySpending.formatted}
                description="Mese corrente"
                variant="accent"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={Calendar}
                label="Prossima Prenotazione"
                value={data.stats.nextBooking.value}
                description={data.stats.nextBooking.description}
                variant="default"
              />
            </motion.div>
          </motion.div>
        </>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          whileHover={{ scale: 1.02, translateY: -4 }}
          className="racing-card"
        >
          <h2 className="text-xl font-heading font-bold text-rbr-text-primary mb-4">
            Menu della Settimana
          </h2>
          <p className="text-rbr-text-secondary mb-4">
            Esplora i deliziosi pasti preparati dal nostro team di cucina
          </p>
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm p-2 rounded bg-rbr-dark-elevated">
              <span className="text-rbr-text-secondary">🍝 Lunedì</span>
              <span className="text-rbr-text-primary font-medium">Pasta al Pomodoro</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 rounded bg-rbr-dark-elevated">
              <span className="text-rbr-text-secondary">🥩 Martedì</span>
              <span className="text-rbr-text-primary font-medium">Bistecca e Patate</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 rounded bg-rbr-dark-elevated">
              <span className="text-rbr-text-secondary">🐟 Mercoledì</span>
              <span className="text-rbr-text-primary font-medium">Pesce al Forno</span>
            </div>
          </div>
          <Button variant="outline" className="w-full border-rbr-red text-rbr-red hover:bg-rbr-red hover:text-white">
            Vedi Menu Completo
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          whileHover={{ scale: 1.02, translateY: -4 }}
          className="racing-card"
        >
          <h2 className="text-xl font-heading font-bold text-rbr-text-primary mb-4">
            I Tuoi Prossimi Ordini
          </h2>
          <div className="space-y-3 mb-4">
            <div className="p-4 rounded-lg bg-rbr-navy/10 border border-rbr-navy/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-rbr-navy">Oggi • 12:30</span>
                <span className="text-xs text-rbr-accent-green">✓ Confermato</span>
              </div>
              <p className="text-sm text-rbr-text-primary font-medium">
                Pasta Carbonara + Insalata Mista
              </p>
              <p className="text-xs text-rbr-text-muted mt-1">€12.50</p>
            </div>
            <div className="p-4 rounded-lg bg-rbr-dark-elevated border border-rbr-border-light">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-rbr-text-secondary">Domani • 12:30</span>
                <span className="text-xs text-yellow-500">⏳ In attesa</span>
              </div>
              <p className="text-sm text-rbr-text-primary font-medium">
                Bistecca alla Griglia + Patate
              </p>
              <p className="text-xs text-rbr-text-muted mt-1">€15.00</p>
            </div>
          </div>
          <Button variant="outline" className="w-full border-rbr-navy text-rbr-navy hover:bg-rbr-navy hover:text-white">
            Prenota Ora
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

