/**
 * Red Bull Racing - Customer Reports
 * Customer Admin analytics and reporting with Recharts
 */

'use client';

export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, TrendingUp, Users, ShoppingCart, Euro, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

// Sample data for customer admin charts
const budgetUsageData = [
  { dept: 'Engineering', budget: 6750, spesa: 4820 },
  { dept: 'Marketing', budget: 4200, spesa: 3150 },
  { dept: 'Design', budget: 3800, spesa: 2950 },
  { dept: 'HR', budget: 3700, spesa: 890 },
];

const departmentSpendingData = [
  { name: 'Engineering', value: 4820 },
  { name: 'Marketing', value: 3150 },
  { name: 'Design', value: 2950 },
  { name: 'HR', value: 890 },
];

const employeeActivityData = [
  { day: 'Lun', ordini: 425 },
  { day: 'Mar', ordini: 450 },
  { day: 'Mer', ordini: 475 },
  { day: 'Gio', ordini: 460 },
  { day: 'Ven', ordini: 440 },
  { day: 'Sab', ordini: 150 },
  { day: 'Dom', ordini: 75 },
];

const COLORS = ['#E30118', '#0600EF', '#00D9FF', '#FFD700'];

export default function CustomerReportsPage() {
  return (
    <div className="space-y-6 animate-racing-slide-up">
      <PageHeader
        title="Report Aziendali"
        subtitle="Analisi e statistiche del consumo aziendale"
        action={
          <Button variant="outline" className="border-rbr-navy text-rbr-navy gap-2">
            <Download className="h-4 w-4" />
            Esporta Report
          </Button>
        }
        breadcrumbs={[
          { label: 'Admin Cliente' },
          { label: 'Report' },
        ]}
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-rbr-dark-elevated">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Panoramica
          </TabsTrigger>
          <TabsTrigger value="consumption" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Consumo
          </TabsTrigger>
          <TabsTrigger value="budget" className="gap-2">
            <Euro className="h-4 w-4" />
            Budget
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="racing-border bg-rbr-dark-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-rbr-text-primary">
                  Dipendenti Attivi
                </CardTitle>
                <Users className="h-4 w-4 text-rbr-navy" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-heading font-bold text-rbr-text-primary">93</div>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +5 questo mese
                </p>
              </CardContent>
            </Card>

            <Card className="racing-border bg-rbr-dark-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-rbr-text-primary">
                  Ordini Mensili
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-rbr-red" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-heading font-bold text-rbr-text-primary">2,847</div>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +8.5% vs mese scorso
                </p>
              </CardContent>
            </Card>

            <Card className="racing-border bg-rbr-dark-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-rbr-text-primary">
                  Spesa Mensile
                </CardTitle>
                <Euro className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-heading font-bold text-rbr-text-primary">€18,450</div>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  Sotto budget
                </p>
              </CardContent>
            </Card>

            <Card className="racing-border bg-rbr-dark-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-rbr-text-primary">
                  Utilizzo Budget
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-rbr-accent-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-heading font-bold text-rbr-text-primary">73%</div>
                <p className="text-xs text-rbr-text-muted mt-1">
                  €6,300 rimanenti
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts with Recharts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="racing-border bg-rbr-dark-card">
              <CardHeader>
                <CardTitle className="text-rbr-text-primary">Spesa per Reparto</CardTitle>
                <CardDescription className="text-rbr-text-muted">Distribuzione mensile - Grafico a torta</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={departmentSpendingData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: €${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {departmentSpendingData.map((_entry, index) => (
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
                      formatter={(value) => [`€${Number(value).toLocaleString()}`, 'Spesa']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="racing-border bg-rbr-dark-card">
              <CardHeader>
                <CardTitle className="text-rbr-text-primary">Attività Dipendenti</CardTitle>
                <CardDescription className="text-rbr-text-muted">Ordini per giorno - Grafico a linee</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={employeeActivityData}>
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
                    <Line type="monotone" dataKey="ordini" stroke="#E30118" strokeWidth={3} dot={{ fill: '#E30118', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consumption" className="space-y-6">
          <Card className="racing-border bg-rbr-dark-card">
            <CardHeader>
              <CardTitle className="text-rbr-text-primary">Piatti Più Ordinati</CardTitle>
              <CardDescription className="text-rbr-text-muted">Top 10 dell&apos;azienda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Pasta Carbonara', orders: 547, emoji: '🍝' },
                  { name: 'Bistecca alla Griglia', orders: 423, emoji: '🥩' },
                  { name: 'Risotto ai Funghi', orders: 389, emoji: '🍚' },
                  { name: 'Insalata Caesar', orders: 345, emoji: '🥗' },
                  { name: 'Lasagne', orders: 298, emoji: '🍝' },
                ].map((dish) => (
                  <div key={dish.name} className="flex items-center gap-3">
                    <div className="text-2xl">{dish.emoji}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-rbr-text-primary">{dish.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-rbr-dark-elevated rounded-full overflow-hidden">
                          <div
                            className="h-full bg-racing-gradient"
                            style={{ width: `${(dish.orders / 547) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-rbr-text-muted">{dish.orders}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <Card className="racing-border bg-rbr-dark-card">
            <CardHeader>
              <CardTitle className="text-rbr-text-primary">Utilizzo Budget per Reparto</CardTitle>
              <CardDescription className="text-rbr-text-muted">Confronto budget vs spesa - Grafico a barre</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={budgetUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3f7f" />
                  <XAxis dataKey="dept" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid rgba(220, 0, 0, 0.2)',
                      borderRadius: '0.5rem',
                      color: '#E5E5E5',
                    }}
                    formatter={(value) => `€${Number(value).toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="budget" fill="#0600EF" radius={[8, 8, 0, 0]} name="Budget" />
                  <Bar dataKey="spesa" fill="#E30118" radius={[8, 8, 0, 0]} name="Spesa" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

