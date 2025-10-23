/**
 * Red Bull Racing - Profile Settings Page
 * User profile management with personal info, security, and payment methods
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { User, Lock, CreditCard, Loader2, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Nome minimo 2 caratteri'),
  lastName: z.string().min(2, 'Cognome minimo 2 caratteri'),
  email: z.string().email('Email non valida'),
  department: z.string().optional(),
  badgeCode: z.string().optional(),
  ticketCode: z.string().optional(),
  dietaryRestrictions: z.object({
    allergies: z.array(z.string()),
    preferences: z.array(z.string()),
  }).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8, 'Password minimo 8 caratteri'),
  newPassword: z.string().min(8, 'Password minimo 8 caratteri'),
  confirmPassword: z.string().min(8, 'Password minimo 8 caratteri'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Le password non coincidono',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const COMMON_ALLERGENS = [
  'glutine',
  'lattosio',
  'uova',
  'pesce',
  'crostacei',
  'frutta a guscio',
  'arachidi',
  'soia',
  'sedano',
  'senape',
  'sesamo',
  'solfiti',
];

const DIETARY_PREFERENCES = [
  'vegetariano',
  'vegano',
  'halal',
  'kosher',
  'senza zucchero',
  'low carb',
];

export default function ProfilePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      department: '',
      badgeCode: '',
      ticketCode: '',
      dietaryRestrictions: {
        allergies: [],
        preferences: [],
      },
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (response.ok && data.user) {
        const user = data.user;
        profileForm.reset({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email,
          department: user.department || '',
          badgeCode: user.badgeCode || '',
          ticketCode: user.ticketCode || '',
          dietaryRestrictions: user.dietaryRestrictions || {
            allergies: [],
            preferences: [],
          },
        });
      } else {
        throw new Error(data.error || 'Errore nel caricamento del profilo');
      }
    } catch (error: any) {
      toast.error(error.message || 'Errore nel caricamento');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore durante l\'aggiornamento');
      }

      toast.success('Profilo aggiornato con successo');
    } catch (error: any) {
      toast.error(error.message || 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore durante il cambio password');
      }

      toast.success('Password modificata con successo');
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.message || 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-rbr-navy" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-racing-slide-up">
      <PageHeader
        title="Impostazioni Profilo"
        subtitle="Gestisci le tue informazioni personali e preferenze"
        breadcrumbs={[{ label: 'Profilo' }]}
      />

      {/* User Info Card */}
      <Card className="racing-card border-rbr-border-light">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-racing-red-gradient flex items-center justify-center">
              <span className="text-2xl font-heading font-bold text-white">
                {session?.user?.name
                  ?.split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-heading font-bold text-rbr-text-primary">
                {session?.user?.name}
              </h3>
              <p className="text-sm text-rbr-text-secondary">{session?.user?.email}</p>
              <Badge className="mt-2 bg-rbr-navy text-white">
                {session?.user?.role === 'SUPER_ADMIN'
                  ? 'Super Admin'
                  : session?.user?.role === 'KITCHEN_ADMIN'
                  ? 'Admin Cucina'
                  : session?.user?.role === 'CUSTOMER_ADMIN'
                  ? 'Admin Cliente'
                  : 'Utente'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">
            <User className="h-4 w-4 mr-2" />
            Informazioni
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Sicurezza
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="h-4 w-4 mr-2" />
            Pagamenti
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal">
          <Card className="racing-card border-rbr-border-light">
            <CardHeader>
              <CardTitle className="text-rbr-text-primary">Informazioni Personali</CardTitle>
              <CardDescription className="text-rbr-text-secondary">
                Aggiorna i tuoi dati personali e preferenze alimentari
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-rbr-text-primary">Nome</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                            />
                          </FormControl>
                          <FormMessage className="text-rbr-red" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-rbr-text-primary">Cognome</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                            />
                          </FormControl>
                          <FormMessage className="text-rbr-red" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-rbr-text-primary">Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            disabled
                            className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary opacity-60"
                          />
                        </FormControl>
                        <FormDescription className="text-rbr-text-secondary text-xs">
                          L&apos;email non può essere modificata
                        </FormDescription>
                        <FormMessage className="text-rbr-red" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-rbr-text-primary">Dipartimento</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Es: Engineering, Marketing"
                            className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                          />
                        </FormControl>
                        <FormMessage className="text-rbr-red" />
                      </FormItem>
                    )}
                  />

                  <Separator className="bg-rbr-border" />

                  {/* Dietary Restrictions */}
                  <div>
                    <h3 className="text-lg font-heading font-bold text-rbr-text-primary mb-4">
                      Restrizioni Alimentari
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-rbr-text-primary mb-3">
                          Allergie
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {COMMON_ALLERGENS.map(allergen => (
                            <FormField
                              key={allergen}
                              control={profileForm.control}
                              name="dietaryRestrictions.allergies"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(allergen)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        field.onChange(
                                          checked
                                            ? [...current, allergen]
                                            : current.filter(v => v !== allergen)
                                        );
                                      }}
                                      className="border-rbr-border data-[state=checked]:bg-rbr-red"
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal capitalize text-rbr-text-secondary cursor-pointer">
                                    {allergen}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      <Separator className="bg-rbr-border" />

                      <div>
                        <h4 className="text-sm font-semibold text-rbr-text-primary mb-3">
                          Preferenze Alimentari
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {DIETARY_PREFERENCES.map(preference => (
                            <FormField
                              key={preference}
                              control={profileForm.control}
                              name="dietaryRestrictions.preferences"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(preference)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        field.onChange(
                                          checked
                                            ? [...current, preference]
                                            : current.filter(v => v !== preference)
                                        );
                                      }}
                                      className="border-rbr-border data-[state=checked]:bg-rbr-navy"
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal capitalize text-rbr-text-secondary cursor-pointer">
                                    {preference}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fetchProfile()}
                      disabled={loading}
                      className="border-rbr-border text-rbr-text-primary hover:bg-rbr-dark-elevated"
                    >
                      Annulla
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-racing-red-gradient hover:opacity-90"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvataggio...
                        </>
                      ) : (
                        'Salva Modifiche'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="racing-card border-rbr-border-light">
            <CardHeader>
              <CardTitle className="text-rbr-text-primary flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Cambio Password
              </CardTitle>
              <CardDescription className="text-rbr-text-secondary">
                Modifica la tua password per mantenere il tuo account sicuro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-rbr-text-primary">Password Attuale</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                          />
                        </FormControl>
                        <FormMessage className="text-rbr-red" />
                      </FormItem>
                    )}
                  />

                  <Separator className="bg-rbr-border" />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-rbr-text-primary">Nuova Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                          />
                        </FormControl>
                        <FormDescription className="text-rbr-text-secondary text-xs">
                          Minimo 8 caratteri
                        </FormDescription>
                        <FormMessage className="text-rbr-red" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-rbr-text-primary">Conferma Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                          />
                        </FormControl>
                        <FormMessage className="text-rbr-red" />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-rbr-navy hover:bg-rbr-navy/80"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Aggiornamento...
                        </>
                      ) : (
                        'Cambia Password'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment">
          <Card className="racing-card border-rbr-border-light">
            <CardHeader>
              <CardTitle className="text-rbr-text-primary">Metodi di Pagamento</CardTitle>
              <CardDescription className="text-rbr-text-secondary">
                Gestisci i tuoi metodi di pagamento per le prenotazioni
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="badgeCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-rbr-text-primary">Codice Badge RFID</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Es: RBR-12345"
                            className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                          />
                        </FormControl>
                        <FormDescription className="text-rbr-text-secondary text-xs">
                          Badge aziendale per pagamenti automatici
                        </FormDescription>
                        <FormMessage className="text-rbr-red" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="ticketCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-rbr-text-primary">Codice Ticket Restaurant</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Es: EDENRED-XXXX"
                            className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                          />
                        </FormControl>
                        <FormDescription className="text-rbr-text-secondary text-xs">
                          Codice Edenred o Ticket Restaurant
                        </FormDescription>
                        <FormMessage className="text-rbr-red" />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-racing-red-gradient hover:opacity-90"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvataggio...
                        </>
                      ) : (
                        'Salva Modifiche'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
