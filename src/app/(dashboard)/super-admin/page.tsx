/**
 * Oracle Red Bull Racing - Super Admin Dashboard
 * Real-time system stats with Framer Motion animations
 */

'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Button } from '@/components/ui/button';
import {
  Users,
  CreditCard,
  Shield,
  Activity,
  TrendingUp,
  Plus,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SuperAdminStats {
  stats: {
    totalUsers: {
      value: number;
      formatted: string;
      trend: { value: string; direction: 'up' | 'down' };
    };
    activeGateways: {
      value: number;
      formatted: string;
    };
    totalBookings: {
      value: number;
      formatted: string;
      trend: { value: string; direction: 'up' | 'down' };
    };
    systemUptime: {
      value: number;
      formatted: string;
      trend: { value: string; direction: 'up' | 'down' };
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

export default function SuperAdminDashboard() {
  const [data, setData] = useState<SuperAdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/stats/super-admin');
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle statistiche');
      }

      const stats = await response.json();
      setData(stats);
    } catch (err) {
      console.error('Failed to fetch super-admin stats:', err);
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
        title="Dashboard Super Admin"
        subtitle="Panoramica e gestione del sistema"
        action={
          <Button className="bg-racing-red-gradient hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            Azione Rapida
          </Button>
        }
        breadcrumbs={[{ label: 'Super Admin' }, { label: 'Dashboard' }]}
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
          {/* Stats Grid with Stagger Animation */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div variants={item}>
              <StatsCard
                icon={Users}
                label="Utenti Totali"
                value={data.stats.totalUsers.formatted}
                trend={{
                  value: parseFloat(data.stats.totalUsers.trend.value),
                  direction: data.stats.totalUsers.trend.direction
                }}
                description="Utenti attivi nel sistema"
                variant="navy"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={CreditCard}
                label="Gateway Pagamento"
                value={data.stats.activeGateways.formatted}
                description="Nexy, Satispay, Stripe, Edenred"
                variant="red"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={Shield}
                label="Prenotazioni Totali"
                value={data.stats.totalBookings.formatted}
                trend={{
                  value: parseFloat(data.stats.totalBookings.trend.value),
                  direction: data.stats.totalBookings.trend.direction
                }}
                description="Ultimi 30 giorni"
                variant="accent"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={Activity}
                label="Stato Sistema"
                value={data.stats.systemUptime.formatted}
                trend={{
                  value: parseFloat(data.stats.systemUptime.trend.value),
                  direction: data.stats.systemUptime.trend.direction
                }}
                description="Uptime questo mese"
                variant="default"
              />
            </motion.div>
          </motion.div>

      {/* Quick Actions Grid with Stagger Animation */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {/* User Management Card */}
        <motion.div
          variants={item}
          whileHover={{ scale: 1.02, translateY: -4 }}
          className="racing-card group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-rbr-navy/20">
              <Users className="h-6 w-6 text-rbr-navy" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-rbr-text-primary mb-2">
                Gestione Utenti
              </h3>
              <p className="text-sm text-rbr-text-secondary mb-4">
                Gestisci utenti, ruoli e permessi su tutta la piattaforma
              </p>
              <Button
                variant="outline"
                className="border-rbr-navy text-rbr-navy hover:bg-rbr-navy hover:text-white"
                size="sm"
              >
                Gestisci Utenti
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Payment Gateway Card */}
        <motion.div
          variants={item}
          whileHover={{ scale: 1.02, translateY: -4 }}
          className="racing-card group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-rbr-red/20">
              <CreditCard className="h-6 w-6 text-rbr-red" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-rbr-text-primary mb-2">
                Gateway Pagamento
              </h3>
              <p className="text-sm text-rbr-text-secondary mb-4">
                Configura e testa le integrazioni dei gateway di pagamento
              </p>
              <Button
                variant="outline"
                className="border-rbr-red text-rbr-red hover:bg-rbr-red hover:text-white"
                size="sm"
              >
                Configura Gateway
              </Button>
            </div>
          </div>
        </motion.div>

        {/* System Settings Card */}
        <motion.div
          variants={item}
          whileHover={{ scale: 1.02, translateY: -4 }}
          className="racing-card group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-rbr-accent-blue/20">
              <Activity className="h-6 w-6 text-rbr-accent-blue" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-rbr-text-primary mb-2">
                Stato Sistema
              </h3>
              <p className="text-sm text-rbr-text-secondary mb-4">
                Monitora le prestazioni del sistema e lo stato dell&apos;infrastruttura
              </p>
              <Button
                variant="outline"
                className="border-rbr-accent-blue text-rbr-accent-blue hover:bg-rbr-accent-blue hover:text-rbr-dark"
                size="sm"
              >
                Vedi Dettagli
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
        </>
      ) : null}

      {/* Recent Activity with Fade-in Animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="racing-card"
      >
        <h2 className="text-xl font-heading font-bold text-rbr-text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-rbr-accent-blue" />
          Attività Recenti del Sistema
        </h2>
        <div className="space-y-3">
            {[
              {
                action: 'Nuovo utente registrato',
                user: 'john.doe@redbullracing.com',
                time: '5 minuti fa',
              },
              {
                action: 'Test gateway pagamento completato',
                user: 'admin@redbullracing.com',
                time: '12 minuti fa',
              },
              {
                action: 'Configurazione sistema aggiornata',
                user: 'system',
                time: '1 ora fa',
              },
            ].map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.4 }}
                whileHover={{ x: 4, transition: { duration: 0.2 } }}
                className="flex items-center justify-between p-3 rounded-lg bg-rbr-dark-elevated hover:bg-rbr-dark-lighter transition-colors cursor-pointer"
              >
              <div>
                <p className="text-sm font-medium text-rbr-text-primary">
                  {activity.action}
                </p>
                <p className="text-xs text-rbr-text-muted">{activity.user}</p>
                </div>
                <span className="text-xs text-rbr-text-secondary">{activity.time}</span>
              </motion.div>
            ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

