/**
 * Oracle Red Bull Racing - Customer Admin Dashboard
 * Real-time stats with Framer Motion animations
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Button } from '@/components/ui/button';
import { Users, UserCog, ShoppingCart, Euro, Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStats {
  stats: {
    totalEmployees: {
      value: number;
      formatted: string;
      trend: { value: string; direction: 'up' | 'down' };
    };
    activeGroups: {
      value: number;
      formatted: string;
    };
    monthlyOrders: {
      value: number;
      formatted: string;
      trend: { value: string; direction: 'up' | 'down' };
    };
    monthlySpending: {
      value: number;
      formatted: string;
    };
  };
  recentActivity: Array<{
    action: string;
    user: string;
    department: string;
    time: string;
  }>;
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

export default function CustomerAdminDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/stats/customer-admin');
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle statistiche');
      }

      const stats = await response.json();
      setData(stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
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
        title="Dashboard Admin Cliente"
        subtitle="Gestisci dipendenti e monitora il consumo"
        action={
          <Button className="bg-racing-red-gradient hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi Dipendente
          </Button>
        }
        breadcrumbs={[{ label: 'Admin Cliente' }, { label: 'Dashboard' }]}
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
                icon={Users}
                label="Dipendenti Totali"
                value={data.stats.totalEmployees.formatted}
                trend={{
                  value: parseFloat(data.stats.totalEmployees.trend.value),
                  direction: data.stats.totalEmployees.trend.direction
                }}
                description="Registrati nel sistema"
                variant="navy"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={UserCog}
                label="Gruppi Attivi"
                value={data.stats.activeGroups.formatted}
                description="Gruppi reparti"
                variant="red"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={ShoppingCart}
                label="Ordini Mensili"
                value={data.stats.monthlyOrders.formatted}
                trend={{
                  value: parseFloat(data.stats.monthlyOrders.trend.value),
                  direction: data.stats.monthlyOrders.trend.direction
                }}
                description="Questo mese"
                variant="accent"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={Euro}
                label="Spesa Mensile"
                value={data.stats.monthlySpending.formatted}
                description="Totale mese corrente"
                variant="default"
              />
            </motion.div>
          </motion.div>

          {/* Recent Activity with Fade-in */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="racing-card"
          >
            <h2 className="text-xl font-heading font-bold text-rbr-text-primary mb-4">
              Attività Recenti
            </h2>
            <div className="space-y-3">
              {data.recentActivity && data.recentActivity.length > 0 ? (
                data.recentActivity.map((activity, index) => (
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
                      <p className="text-xs text-rbr-text-muted">
                        {activity.user} • {activity.department}
                      </p>
                    </div>
                    <span className="text-xs text-rbr-text-secondary">{activity.time}</span>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-rbr-text-muted">
                  <p>Nessuna attività recente</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </motion.div>
  );
}

