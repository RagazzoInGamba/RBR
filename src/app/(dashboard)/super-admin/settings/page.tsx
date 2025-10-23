/**
 * Red Bull Racing - System Settings
 * Super Admin system configuration interface
 */

export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Bell, Shield, Database, Save, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-racing-slide-up">
      <PageHeader
        title="Impostazioni Sistema"
        subtitle="Configura le impostazioni globali dell&apos;applicazione"
        breadcrumbs={[
          { label: 'Super Admin' },
          { label: 'Impostazioni' },
        ]}
      />

      {/* Feature Status Warning */}
      <Alert className="border-yellow-500 bg-yellow-500/10">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertTitle className="text-yellow-500">In Sviluppo</AlertTitle>
        <AlertDescription className="text-rbr-text-secondary">
          Le funzionalità di configurazione sono attualmente in fase di sviluppo.
          Le modifiche in questa pagina non verranno salvate nel sistema.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-rbr-dark-elevated">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            Generale
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Sicurezza
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifiche
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <div className="racing-card">
            <h3 className="text-lg font-heading font-bold text-rbr-text-primary mb-4">
              Configurazione Generale
            </h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Nome Applicazione</Label>
                <Input defaultValue="Red Bull Racing - Meal Booking" />
              </div>
              <div className="grid gap-2">
                <Label>Descrizione</Label>
                <Textarea
                  defaultValue="Piattaforma di Prenotazione Pasti Oracle Red Bull Racing"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label>Lingua Default</Label>
                <Select defaultValue="it">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Fuso Orario</Label>
                <Select defaultValue="europe/rome">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="europe/rome">Europe/Rome</SelectItem>
                    <SelectItem value="europe/london">Europe/London</SelectItem>
                    <SelectItem value="america/new_york">America/New_York</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="racing-card">
            <h3 className="text-lg font-heading font-bold text-rbr-text-primary mb-4">
              Limiti Sistema
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Prenotazioni per Utente al Giorno</Label>
                  <p className="text-sm text-rbr-text-muted">Numero massimo di pasti prenotabili</p>
                </div>
                <Input type="number" defaultValue="3" className="w-20" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Anticipo Minimo Prenotazione (ore)</Label>
                  <p className="text-sm text-rbr-text-muted">Ore minime prima del pasto</p>
                </div>
                <Input type="number" defaultValue="2" className="w-20" />
              </div>
            </div>
          </div>

          <Button className="bg-racing-red-gradient hover:opacity-90 gap-2">
            <Save className="h-4 w-4" />
            Salva Modifiche
          </Button>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <div className="racing-card">
            <h3 className="text-lg font-heading font-bold text-rbr-text-primary mb-4">
              Politiche di Sicurezza
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Autenticazione a Due Fattori (2FA)</Label>
                  <p className="text-sm text-rbr-text-muted">Richiedi 2FA per tutti gli amministratori</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Scadenza Sessione (minuti)</Label>
                  <p className="text-sm text-rbr-text-muted">Durata massima inattività</p>
                </div>
                <Input type="number" defaultValue="30" className="w-20" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Tentativi Login Massimi</Label>
                  <p className="text-sm text-rbr-text-muted">Prima del blocco account</p>
                </div>
                <Input type="number" defaultValue="5" className="w-20" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Lunghezza Minima Password</Label>
                  <p className="text-sm text-rbr-text-muted">Caratteri minimi richiesti</p>
                </div>
                <Input type="number" defaultValue="8" className="w-20" />
              </div>
            </div>
          </div>

          <Button className="bg-racing-red-gradient hover:opacity-90 gap-2">
            <Save className="h-4 w-4" />
            Salva Modifiche
          </Button>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="racing-card">
            <h3 className="text-lg font-heading font-bold text-rbr-text-primary mb-4">
              Email Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Conferma Prenotazione</Label>
                  <p className="text-sm text-rbr-text-muted">Invia email dopo prenotazione</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Promemoria Giornalieri</Label>
                  <p className="text-sm text-rbr-text-muted">Ricorda pasti prenotati del giorno</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifiche Amministrative</Label>
                  <p className="text-sm text-rbr-text-muted">Avvisi per amministratori</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          <Button className="bg-racing-red-gradient hover:opacity-90 gap-2">
            <Save className="h-4 w-4" />
            Salva Modifiche
          </Button>
        </TabsContent>

        {/* Database Settings */}
        <TabsContent value="database" className="space-y-6">
          <div className="racing-card">
            <h3 className="text-lg font-heading font-bold text-rbr-text-primary mb-4">
              Manutenzione Database
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-rbr-dark-elevated">
                <div>
                  <Label>Backup Automatici</Label>
                  <p className="text-sm text-rbr-text-muted">Ultima esecuzione: 2025-01-20 03:00</p>
                </div>
                <Button variant="outline" className="border-rbr-navy text-rbr-navy">
                  Esegui Backup
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-rbr-dark-elevated">
                <div>
                  <Label>Ottimizzazione Tabelle</Label>
                  <p className="text-sm text-rbr-text-muted">Ultima esecuzione: 2025-01-18 02:00</p>
                </div>
                <Button variant="outline" className="border-rbr-accent-blue text-rbr-accent-blue">
                  Ottimizza Ora
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-rbr-dark-elevated">
                <div>
                  <Label>Pulizia Log Vecchi</Label>
                  <p className="text-sm text-rbr-text-muted">Rimuovi log più vecchi di 90 giorni</p>
                </div>
                <Button variant="outline" className="border-yellow-500 text-yellow-500">
                  Pulisci Log
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

