/**
 * Red Bull Racing - Super Admin Reports
 * Analytics and reporting interface with Recharts visualizations
 */

'use client';

export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Download,
  TrendingUp,
  Users,
  ShoppingCart,
  Euro
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Sample data for charts
const ordersPerDayData = [
  { day: 'Lun', ordini: 420 },
  { day: 'Mar', ordini: 380 },
  { day: 'Mer', ordini: 450 },
  { day: 'Gio', ordini: 430 },
  { day: 'Ven', ordini: 350 },
  { day: 'Sab', ordini: 180 },
  { day: 'Dom', ordini: 120 },
];

const popularDishesData = [
  { name: 'Pasta Carbonara', value: 1247 },
  { name: 'Bistecca', value: 1089 },
  { name: 'Insalata Caesar', value: 892 },
  { name: 'Risotto', value: 765 },
  { name: 'Tiramisù', value: 643 },
];

const userGrowthData = [
  { month: 'Gen', utenti: 850 },
  { month: 'Feb', utenti: 920 },
  { month: 'Mar', utenti: 1015 },
  { month: 'Apr', utenti: 1080 },
  { month: 'Mag', utenti: 1150 },
  { month: 'Giu', utenti: 1200 },
  { month: 'Lug', utenti: 1220 },
  { month: 'Ago', utenti: 1180 },
  { month: 'Set', utenti: 1235 },
  { month: 'Ott', utenti: 1260 },
  { month: 'Nov', utenti: 1270 },
  { month: 'Dic', utenti: 1284 },
];

const dailyOrdersData = Array.from({ length: 30 }).map((_, i) => ({
  day: i + 1,
  ordini: Math.floor(Math.random() * 200) + 300,
}));

const monthlyRevenueData = [
  { month: 'Gen', ricavi: 72450 },
  { month: 'Feb', ricavi: 68200 },
  { month: 'Mar', ricavi: 78900 },
  { month: 'Apr', ricavi: 82100 },
  { month: 'Mag', ricavi: 85600 },
  { month: 'Giu', ricavi: 87200 },
  { month: 'Lug', ricavi: 84300 },
  { month: 'Ago', ricavi: 79800 },
  { month: 'Set', ricavi: 88500 },
  { month: 'Ott', ricavi: 91200 },
  { month: 'Nov', ricavi: 93800 },
  { month: 'Dic', ricavi: 89450 },
];

const COLORS = ['#E30118', '#0600EF', '#00D9FF', '#FFD700', '#00FF88'];

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-racing-slide-up">
      <PageHeader
        title="Report e Analytics"
        subtitle="Analisi dettagliate e metriche di sistema con Recharts"
        action={
          <Button variant="outline" className="border-rbr-navy text-rbr-navy gap-2">
            <Download className="h-4 w-4" />
            Esporta Report
          </Button>
        }
        breadcrumbs={[
          { label: 'Super Admin' },
          { label: 'Report' },
        ]}
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-rbr-dark-elevated">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Panoramica
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Utenti
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Ordini
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <Euro className="h-4 w-4" />
            Ricavi
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="racing-border bg-rbr-dark-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-rbr-text-primary">
                  Totale Utenti
                </CardTitle>
                <Users className="h-4 w-4 text-rbr-navy" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-heading font-bold text-rbr-text-primary">1,284</div>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +12.5% dal mese scorso
                </p>
              </CardContent>
            </Card>

            <Card className="racing-border bg-rbr-dark-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-rbr-text-primary">
                  Ordini Totali
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-rbr-red" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-heading font-bold text-rbr-text-primary">15,847</div>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +8.2% dal mese scorso
                </p>
              </CardContent>
            </Card>

            <Card className="racing-border bg-rbr-dark-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-rbr-text-primary">
                  Ricavi Mensili
                </CardTitle>
                <Euro className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-heading font-bold text-rbr-text-primary">€89,450</div>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +15.3% dal mese scorso
                </p>
              </CardContent>
            </Card>

            <Card className="racing-border bg-rbr-dark-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-rbr-text-primary">
                  Valore Medio Ordine
                </CardTitle>
                <Euro className="h-4 w-4 text-rbr-accent-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-heading font-bold text-rbr-text-primary">€12.45</div>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +3.1% dal mese scorso
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="racing-border bg-rbr-dark-card">
              <CardHeader>
                <CardTitle className="text-rbr-text-primary">Ordini per Giorno della Settimana</CardTitle>
                <CardDescription className="text-rbr-text-muted">Distribuzione settimanale con Recharts</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ordersPerDayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3f7f" />
                    <XAxis dataKey="day" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid rgba(220, 0, 0, 0.2)',
                        borderRadius: '0.5rem',
                        color: '#E5E5E5',
                      }}
                    />
                    <Bar dataKey="ordini" fill="#E30118" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="racing-border bg-rbr-dark-card">
              <CardHeader>
                <CardTitle className="text-rbr-text-primary">Piatti Più Popolari</CardTitle>
                <CardDescription className="text-rbr-text-muted">Top 5 questo mese - Grafico a torta</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={popularDishesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {popularDishesData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid rgba(220, 0, 0, 0.2)',
                        borderRadius: '0.5rem',
                        color: '#E5E5E5',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card className="racing-border bg-rbr-dark-card">
            <CardHeader>
              <CardTitle className="text-rbr-text-primary">Crescita Utenti</CardTitle>
              <CardDescription className="text-rbr-text-muted">Crescita progressiva utenti registrati</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="colorUtenti" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0600EF" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0600EF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3f7f" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
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
                    dataKey="utenti"
                    stroke="#0600EF"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorUtenti)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <Card className="racing-border bg-rbr-dark-card">
            <CardHeader>
              <CardTitle className="text-rbr-text-primary">Trend Ordini</CardTitle>
              <CardDescription className="text-rbr-text-muted">Ordini giornalieri ultimi 30 giorni - Grafico a linee</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyOrdersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3f7f" />
                  <XAxis dataKey="day" stroke="#9CA3AF" label={{ value: 'Giorno', position: 'insideBottom', offset: -5 }} />
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
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Card className="racing-border bg-rbr-dark-card">
            <CardHeader>
              <CardTitle className="text-rbr-text-primary">Ricavi Mensili</CardTitle>
              <CardDescription className="text-rbr-text-muted">Entrate mensili anno 2025 (€)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyRevenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FF88" stopOpacity={1} />
                      <stop offset="95%" stopColor="#00D9FF" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3f7f" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid rgba(0, 217, 255, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#E5E5E5',
                    }}
                    formatter={(value) => [`€${Number(value).toLocaleString()}`, 'Ricavi']}
                  />
                  <Bar dataKey="ricavi" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

