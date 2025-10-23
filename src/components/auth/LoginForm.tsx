/**
 * Red Bull Racing - Enhanced Login Form
 * Optimized with framer-motion and best UX practices 2025
 */

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, LogIn, Eye, EyeOff, Zap } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Indirizzo email non valido'),
  password: z.string().min(8, 'La password deve contenere almeno 8 caratteri'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      setIsLoading(true);
      setError(null);

      // Show loading toast
      toast.loading('Autenticazione in corso...', {
        id: 'login-loading',
      });

      // Use signIn with callbackUrl to trigger server-side redirect
      // NextAuth will handle the redirect after successful authentication
      // If authentication fails, NextAuth will redirect to the error page
      await signIn('credentials', {
        email: values.email.toLowerCase(),
        password: values.password,
        redirect: true, // ✅ Let NextAuth handle redirect
        callbackUrl: '/auth/success', // ✅ Redirect to success page that will handle role-based routing
      });

      // Note: Code after signIn() with redirect: true will not execute on success
      // User will be redirected to callbackUrl or error page
    } catch (err) {
      toast.dismiss('login-loading');
      setError('Si è verificato un errore imprevisto. Riprova.');
      toast.error('Errore di sistema', {
        description: 'Si è verificato un problema. Riprova tra qualche istante.',
        duration: 4000,
      });
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="racing-border shadow-2xl bg-rbr-dark-card/90 backdrop-blur-xl">
        <CardHeader className="space-y-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CardTitle className="text-3xl font-heading font-bold text-rbr-text-primary flex items-center gap-2">
              <Zap className="h-7 w-7 text-rbr-red" />
              Accesso
            </CardTitle>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardDescription className="text-rbr-text-secondary">
              Inserisci le tue credenziali per accedere al sistema
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-rbr-text-primary">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="pilota@redbullracing.com"
                          autoComplete="email"
                          disabled={isLoading}
                          className="bg-rbr-dark-elevated border-rbr-border focus:border-rbr-red transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-rbr-text-primary">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            disabled={isLoading}
                            className="bg-rbr-dark-elevated border-rbr-border focus:border-rbr-red transition-all pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-rbr-text-muted" />
                            ) : (
                              <Eye className="h-4 w-4 text-rbr-text-muted" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-lg bg-rbr-red/10 border border-rbr-red/20"
                >
                  <p className="text-sm text-rbr-red">{error}</p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  type="submit" 
                  className="w-full bg-racing-red-gradient hover:opacity-90 transition-all text-lg py-6" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Accesso in corso...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Accedi al Sistema
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </Form>

          {/* Demo Credentials */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 p-4 rounded-lg bg-rbr-dark-elevated border border-rbr-border"
          >
            <p className="text-xs font-semibold text-rbr-text-primary mb-3 flex items-center gap-2">
              <Zap className="h-3 w-3 text-rbr-red" />
              Credenziali Demo
            </p>
            <div className="space-y-2">
              {[
                { role: 'System Administrator', email: 'admin@redbullracing.com', password: 'Admin123!', color: 'text-rbr-red' },
                { role: 'Head Chef', email: 'chef@redbullracing.com', password: 'Chef123!', color: 'text-yellow-500' },
                { role: 'Team Manager', email: 'manager@redbullracing.com', password: 'Manager123!', color: 'text-rbr-navy' },
                { role: 'Max Verstappen', email: 'driver@redbullracing.com', password: 'Driver123!', color: 'text-rbr-accent-blue' },
              ].map((account, i) => (
                <motion.button
                  key={account.email}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    form.setValue('email', account.email);
                    form.setValue('password', account.password);
                  }}
                  className="w-full text-left p-2 rounded-md hover:bg-rbr-card-overlay transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-xs font-medium ${account.color}`}>
                        {account.role}
                      </span>
                      <p className="text-xs text-rbr-text-muted">{account.email}</p>
                    </div>
                    <span className="text-xs text-rbr-text-disabled font-mono">
                      {account.password}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
