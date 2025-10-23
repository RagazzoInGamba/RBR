/**
 * Red Bull Racing - Kitchen Reports
 * Kitchen Admin reporting and analytics with Recharts
 */

'use client';

export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, TrendingUp, ChefHat, ShoppingCart, Clock } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Sample data for kitchen charts
const ordersPerHourData = [
  { hour: '08:00', ordini: 12 },
  { hour: '09:00', ordini: 18 },
  { hour: '10:00', ordini: 25 },
  { hour: '11:00', ordini: 35 },
  { hour: '12:00', ordini: 68 },
  { hour: '13:00', ordini: 75 },
  { hour: '14:00', ordini: 45 },
  { hour: '15:00', ordini: 30 },
  { hour: '16:00', ordini: 25 },
  { hour: '17:00', ordini: 20 },
  { hour: '18:00', ordini: 15 },
  { hour: '19:00', ordini: 10 },
];

const popularRecipesData = [
  { name: 'Pasta Carbonara', ordini: 247 },
  { name: 'Bistecca', ordini: 189 },
  { name: 'Risotto', ordini: 156 },
  { name: 'Lasagne', ordini: 134 },
  { name: 'Tiramisù', ordini: 98 },
];

const prepTimeData = [
  { range: '0-10 min', count: 45 },
  { range: '10-15 min', count: 120 },
  { range: '15-20 min', count: 180 },
  { range: '20-25 min', count: 95 },
  { range: '25-30 min', count: 40 },
  { range: '30+ min', count: 15 },
];

export default function KitchenReportsPage() {
  return (
    <div className="space-y-6 animate-racing-slide-up">
      <PageHeader
        title="Report Cucina"
        subtitle="Analisi e statistiche della cucina"
        action={
          <Button variant="outline" className="border-rbr-navy text-rbr-navy gap-2">
            <Download className="h-4 w-4" />
            Esporta Report
          </Button>
        }
        breadcrumbs={[
          { label: 'Cucina' },
          { label: 'Report' },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="racing-border bg-rbr-dark-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rbr-text-primary">
              Ordini Oggi
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-rbr-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold text-rbr-text-primary">89</div>
            <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +12% da ieri
            </p>
          </CardContent>
        </Card>

        <Card className="racing-border bg-rbr-dark-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rbr-text-primary">
              Tempo Medio
            </CardTitle>
            <Clock className="h-4 w-4 text-rbr-navy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold text-rbr-text-primary">18 min</div>
            <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              -3 min da ieri
            </p>
          </CardContent>
        </Card>

        <Card className="racing-border bg-rbr-dark-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rbr-text-primary">
              Piatti Attivi
            </CardTitle>
            <ChefHat className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold text-rbr-text-primary">24</div>
            <p className="text-xs text-rbr-text-muted mt-1">
              Nel menu corrente
            </p>
          </CardContent>
        </Card>

        <Card className="racing-border bg-rbr-dark-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rbr-text-primary">
              Soddisfazione
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold text-rbr-text-primary">4.8/5</div>
            <p className="text-xs text-green-500 mt-1">
              Media recensioni
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts with Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="racing-border bg-rbr-dark-card">
          <CardHeader>
            <CardTitle className="text-rbr-text-primary">Ordini per Ora</CardTitle>
            <CardDescription className="text-rbr-text-muted">Distribuzione giornaliera - Grafico a linee</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ordersPerHourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3f7f" />
                <XAxis dataKey="hour" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid rgba(220, 0, 0, 0.2)',
                    borderRadius: '0.5rem',
                    color: '#E5E5E5',
                  }}
                />
                <Line type="monotone" dataKey="ordini" stroke="#E30118" strokeWidth={3} dot={{ fill: '#E30118', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="racing-border bg-rbr-dark-card">
          <CardHeader>
            <CardTitle className="text-rbr-text-primary">Ricette Più Popolari</CardTitle>
            <CardDescription className="text-rbr-text-muted">Top 5 della settimana - Grafico a barre</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularRecipesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3f7f" />
                <XAxis type="number" stroke="#9CA3AF" />
                <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid rgba(220, 0, 0, 0.2)',
                    borderRadius: '0.5rem',
                    color: '#E5E5E5',
                  }}
                />
                <Bar dataKey="ordini" fill="#E30118" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Chart - Prep Time Distribution */}
      <Card className="racing-border bg-rbr-dark-card">
        <CardHeader>
          <CardTitle className="text-rbr-text-primary">Distribuzione Tempi di Preparazione</CardTitle>
          <CardDescription className="text-rbr-text-muted">Analisi tempi di preparazione ordini - Area chart</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={prepTimeData}>
              <defs>
                <linearGradient id="colorPrepTime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0600EF" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0600EF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3f7f" />
              <XAxis dataKey="range" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid rgba(6, 0, 239, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#E5E5E5',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#0600EF"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPrepTime)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

