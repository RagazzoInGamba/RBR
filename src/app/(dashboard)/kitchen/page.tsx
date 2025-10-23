/**
 * Oracle Red Bull Racing - Kitchen Admin Dashboard
 * Real-time stats with Framer Motion animations
 */

'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Button } from '@/components/ui/button';
import { ChefHat, UtensilsCrossed, ShoppingCart, Clock, Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface KitchenStats {
  stats: {
    totalRecipes: {
      value: number;
      formatted: string;
      trend: { value: string; direction: 'up' | 'down' };
    };
    activeMenus: {
      value: number;
      formatted: string;
    };
    pendingOrders: {
      value: number;
      formatted: string;
      trend: { value: string; direction: 'up' | 'down' };
    };
    avgPrepTime: {
      value: number;
      formatted: string;
    };
  };
  recentOrders: Array<{
    id: string;
    mealType: string;
    status: string;
    user: string;
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

export default function KitchenDashboard() {
  const [data, setData] = useState<KitchenStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/stats/kitchen');
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle statistiche');
      }

      const stats = await response.json();
      setData(stats);
    } catch (err) {
      console.error('Failed to fetch kitchen stats:', err);
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
        title="Dashboard Cucina"
        subtitle="Gestisci ricette, menu e ordini"
        action={
          <Button className="bg-racing-red-gradient hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            Nuova Ricetta
          </Button>
        }
        breadcrumbs={[{ label: 'Cucina' }, { label: 'Dashboard' }]}
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
                icon={ChefHat}
                label="Ricette Attive"
                value={data.stats.totalRecipes.formatted}
                trend={{
                  value: parseFloat(data.stats.totalRecipes.trend.value),
                  direction: data.stats.totalRecipes.trend.direction
                }}
                description="Nel catalogo"
                variant="red"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={UtensilsCrossed}
                label="Menu Settimanali"
                value={data.stats.activeMenus.formatted}
                description="Attualmente attivi"
                variant="navy"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={ShoppingCart}
                label="Ordini di Oggi"
                value={data.stats.pendingOrders.formatted}
                trend={{
                  value: parseFloat(data.stats.pendingOrders.trend.value),
                  direction: data.stats.pendingOrders.trend.direction
                }}
                description="Da preparare"
                variant="accent"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={Clock}
                label="Tempo Medio"
                value={data.stats.avgPrepTime.formatted}
                description="Preparazione media"
                variant="default"
              />
            </motion.div>
          </motion.div>

          {/* Ordini Recenti */}
          {data.recentOrders && data.recentOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="racing-card"
            >
              <h2 className="text-xl font-heading font-bold text-rbr-text-primary mb-4">
                Ordini Recenti
              </h2>
              <div className="space-y-3">
                {data.recentOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                    whileHover={{ x: 4, transition: { duration: 0.2 } }}
                    className="flex items-center justify-between p-3 rounded-lg bg-rbr-dark-elevated hover:bg-rbr-dark-lighter transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-rbr-text-primary">
                        {order.user} - {order.mealType}
                      </p>
                      <p className="text-xs text-rbr-text-muted">
                        Stato: {order.status}
                      </p>
                    </div>
                    <span className="text-xs text-rbr-text-secondary">{order.time}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      ) : null}
    </motion.div>
  );
}

