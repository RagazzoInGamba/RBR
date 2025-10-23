/**
 * Red Bull Racing - Employee Form Dialog
 * Create/Edit employee with React Hook Form + API integration
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Eye, EyeOff } from 'lucide-react';

// Base schema for both create and edit
const baseEmployeeSchema = z.object({
  email: z.string().email('Inserisci un\'email valida'),
  firstName: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
  lastName: z.string().min(2, 'Il cognome deve contenere almeno 2 caratteri'),
  department: z.string().optional(),
  position: z.string().optional(),
  monthlyBudget: z.number().int().min(0, 'Il budget deve essere maggiore di 0').default(0),
  badgeCode: z.string().optional(),
  ticketCode: z.string().optional(),
  dietaryRestrictions: z.object({
    allergies: z.array(z.string()).default([]),
    preferences: z.array(z.string()).default([]),
  }).optional(),
});

// Schema for creating new employee (password required)
const createEmployeeSchema = baseEmployeeSchema.extend({
  password: z.string()
    .min(8, 'La password deve contenere almeno 8 caratteri')
    .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
    .regex(/[0-9]/, 'La password deve contenere almeno un numero')
    .regex(/[!@#$%^&*]/, 'La password deve contenere almeno un carattere speciale (!@#$%^&*)'),
});

// Schema for editing employee (password optional)
const editEmployeeSchema = baseEmployeeSchema.extend({
  password: z.string()
    .min(8, 'La password deve contenere almeno 8 caratteri')
    .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
    .regex(/[0-9]/, 'La password deve contenere almeno un numero')
    .regex(/[!@#$%^&*]/, 'La password deve contenere almeno un carattere speciale (!@#$%^&*)')
    .optional()
    .or(z.literal('')),
});

type EmployeeFormData = z.infer<typeof createEmployeeSchema>;

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    department?: string | null;
    position?: string | null;
    monthlyBudget?: number | null;
    badgeCode?: string | null;
    ticketCode?: string | null;
    dietaryRestrictions?: any;
  };
  onSuccess?: () => void;
}

const ALLERGENS = ['glutine', 'lattosio', 'uova', 'pesce', 'crostacei', 'frutta a guscio', 'soia', 'sedano'];

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EmployeeFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isEditing = !!employee;

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(isEditing ? editEmployeeSchema : createEmployeeSchema),
    defaultValues: {
      email: employee?.email || '',
      firstName: employee?.firstName || '',
      lastName: employee?.lastName || '',
      department: employee?.department || '',
      position: employee?.position || '',
      monthlyBudget: employee?.monthlyBudget || 0,
      badgeCode: employee?.badgeCode || '',
      ticketCode: employee?.ticketCode || '',
      password: '',
      dietaryRestrictions: employee?.dietaryRestrictions || {
        allergies: [],
        preferences: [],
      },
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department || '',
        position: employee.position || '',
        monthlyBudget: employee.monthlyBudget || 0,
        badgeCode: employee.badgeCode || '',
        ticketCode: employee.ticketCode || '',
        password: '', // Don't prefill password when editing
        dietaryRestrictions: employee.dietaryRestrictions || {
          allergies: [],
          preferences: [],
        },
      });
    }
  }, [employee, form]);

  const onSubmit = async (data: EmployeeFormData) => {
    setIsLoading(true);
    try {
      const endpoint = isEditing
        ? `/api/customer/employees/${employee.id}`
        : '/api/customer/employees';

      const method = isEditing ? 'PATCH' : 'POST';

      // For editing, only include password if it was provided
      const submitData = isEditing && !data.password
        ? { ...data, password: undefined }
        : data;

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore durante il salvataggio');
      }

      toast.success(
        isEditing
          ? 'Dipendente aggiornato con successo'
          : 'Dipendente creato con successo'
      );

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Si è verificato un errore');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-rbr-dark border-rbr-border-light">
        <DialogHeader>
          <DialogTitle className="text-rbr-text-primary font-heading text-xl">
            {isEditing ? 'Modifica Dipendente' : 'Nuovo Dipendente'}
          </DialogTitle>
          <DialogDescription className="text-rbr-text-secondary">
            {isEditing
              ? 'Modifica i dettagli del dipendente'
              : 'Compila i campi per creare un nuovo dipendente'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-rbr-text-primary">Email *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="employee@redbullracing.com"
                      className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                      disabled={isEditing}
                    />
                  </FormControl>
                  <FormMessage className="text-rbr-red" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-rbr-text-primary">
                    Password {!isEditing && '*'}
                    {isEditing && <span className="text-rbr-text-muted text-xs ml-2">(lascia vuoto per non modificare)</span>}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder={isEditing ? "Nuova password (opzionale)" : "Minimo 8 caratteri"}
                        autoComplete="new-password"
                        className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary pr-10"
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
                  <FormMessage className="text-rbr-red" />
                  {!isEditing && (
                    <p className="text-xs text-rbr-text-muted mt-1">
                      Deve contenere: 8+ caratteri, 1 maiuscola, 1 numero, 1 carattere speciale (!@#$%^&*)
                    </p>
                  )}
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-rbr-text-primary">Nome *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Max"
                        className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                      />
                    </FormControl>
                    <FormMessage className="text-rbr-red" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-rbr-text-primary">Cognome *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Verstappen"
                        className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                      />
                    </FormControl>
                    <FormMessage className="text-rbr-red" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-rbr-text-primary">
                      Dipartimento
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Racing Team"
                        className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                      />
                    </FormControl>
                    <FormMessage className="text-rbr-red" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-rbr-text-primary">
                      Posizione
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ingegnere"
                        className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                      />
                    </FormControl>
                    <FormMessage className="text-rbr-red" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="monthlyBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-rbr-text-primary">
                    Budget Mensile (€)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      step={1}
                      placeholder="100"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                    />
                  </FormControl>
                  <FormMessage className="text-rbr-red" />
                  <p className="text-xs text-rbr-text-muted mt-1">
                    Budget mensile per i pasti in euro
                  </p>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="badgeCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-rbr-text-primary">Badge Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="BADGE123"
                        className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                      />
                    </FormControl>
                    <FormMessage className="text-rbr-red" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ticketCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-rbr-text-primary">Ticket Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="TICKET456"
                        className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                      />
                    </FormControl>
                    <FormMessage className="text-rbr-red" />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel className="text-rbr-text-primary">Restrizioni Alimentari</FormLabel>
              <div className="grid grid-cols-2 gap-2 p-4 rounded-lg bg-rbr-dark-elevated border border-rbr-border">
                {ALLERGENS.map((allergen) => (
                  <FormField
                    key={allergen}
                    control={form.control}
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
                                  : current.filter((v) => v !== allergen)
                              );
                            }}
                            className="border-rbr-border data-[state=checked]:bg-rbr-navy"
                          />
                        </FormControl>
                        <FormLabel className="text-rbr-text-secondary font-normal capitalize cursor-pointer text-sm">
                          {allergen}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="border-rbr-border text-rbr-text-primary hover:bg-rbr-dark-elevated"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-racing-red-gradient hover:opacity-90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>{isEditing ? 'Aggiorna' : 'Crea Dipendente'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
