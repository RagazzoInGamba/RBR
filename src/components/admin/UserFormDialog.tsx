/**
 * Red Bull Racing - User Form Dialog
 * Create/Edit user with React Hook Form + API integration
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Users } from 'lucide-react';

// Types
interface GroupType {
  id: string;
  name: string;
  _count?: {
    members: number;
  };
}

const userSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z
    .string()
    .min(8, 'Password minimo 8 caratteri')
    .regex(/[A-Z]/, 'Password deve contenere almeno una maiuscola')
    .regex(/[0-9]/, 'Password deve contenere almeno un numero')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password deve contenere almeno un carattere speciale')
    .optional(),
  firstName: z.string().min(2, 'Nome minimo 2 caratteri'),
  lastName: z.string().min(2, 'Cognome minimo 2 caratteri'),
  role: z.enum(['SUPER_ADMIN', 'KITCHEN_ADMIN', 'CUSTOMER_ADMIN', 'END_USER']),
  department: z.string().optional(),
  groupIds: z.array(z.string()).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    department?: string | null;
  };
  onSuccess?: () => void;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const isEditing = !!user;

  // Fetch available groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoadingGroups(true);
        const response = await fetch('/api/customer/groups?limit=100');
        if (response.ok) {
          const data = await response.json();
          setGroups(data.groups || []);
        }
      } catch (error) {
        // Silent fail - groups are optional feature
      } finally {
        setLoadingGroups(false);
      }
    };

    if (open) {
      fetchGroups();

      // Fetch user's current groups if editing
      if (user) {
        fetchUserGroups();
      }
    }
  }, [open, user]);

  // Fetch user's current group memberships
  const fetchUserGroups = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/admin/users/${user.id}/groups`);
      if (response.ok) {
        const data = await response.json();
        const groupIds = data.groups?.map((g: { groupId: string }) => g.groupId) || [];
        setUserGroups(groupIds);
      }
    } catch (error) {
      // Silent fail - groups are optional feature
    }
  };

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: user?.email || '',
      password: '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      role: (user?.role as any) || 'END_USER',
      department: user?.department || '',
      groupIds: [],
    },
  });

  // Update form when userGroups changes
  useEffect(() => {
    if (userGroups.length > 0) {
      form.setValue('groupIds', userGroups);
    }
  }, [userGroups, form]);

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    try {
      const endpoint = isEditing
        ? `/api/admin/users/${user.id}`
        : '/api/admin/users';
      
      const method = isEditing ? 'PATCH' : 'POST';
      
      // Remove empty password for edits
      const payload = { ...data };
      if (isEditing && !payload.password) {
        delete payload.password;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore durante il salvataggio');
      }

      toast.success(
        isEditing
          ? '✅ Utente aggiornato con successo'
          : '✅ Utente creato con successo'
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
            {isEditing ? 'Modifica Utente' : 'Nuovo Utente'}
          </DialogTitle>
          <DialogDescription className="text-rbr-text-secondary">
            {isEditing
              ? 'Modifica i dettagli dell\'utente'
              : 'Compila i campi per creare un nuovo utente'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-rbr-text-primary">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="user@redbullracing.com"
                      className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                      disabled={isEditing}
                    />
                  </FormControl>
                  <FormMessage className="text-rbr-red" />
                </FormItem>
              )}
            />

            {(!isEditing || form.watch('password')) && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-rbr-text-primary">
                      {isEditing ? 'Nuova Password (opzionale)' : 'Password'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                      />
                    </FormControl>
                    <FormMessage className="text-rbr-red" />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-rbr-text-primary">Nome</FormLabel>
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
                    <FormLabel className="text-rbr-text-primary">Cognome</FormLabel>
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

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-rbr-text-primary">Ruolo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary">
                        <SelectValue placeholder="Seleziona ruolo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-rbr-dark-elevated border-rbr-border">
                      <SelectItem value="SUPER_ADMIN" className="text-rbr-text-primary hover:bg-rbr-dark-lighter">
                        Super Admin
                      </SelectItem>
                      <SelectItem value="KITCHEN_ADMIN" className="text-rbr-text-primary hover:bg-rbr-dark-lighter">
                        Kitchen Admin
                      </SelectItem>
                      <SelectItem value="CUSTOMER_ADMIN" className="text-rbr-text-primary hover:bg-rbr-dark-lighter">
                        Customer Admin
                      </SelectItem>
                      <SelectItem value="END_USER" className="text-rbr-text-primary hover:bg-rbr-dark-lighter">
                        End User
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-rbr-red" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-rbr-text-primary">
                    Dipartimento (opzionale)
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

            {/* Group Selection */}
            <FormField
              control={form.control}
              name="groupIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-rbr-text-primary flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Gruppi (opzionale)
                  </FormLabel>
                  <div className="border border-rbr-border rounded-md bg-rbr-dark-elevated">
                    {loadingGroups ? (
                      <div className="p-4 text-center text-rbr-text-muted">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        <p className="text-sm mt-2">Caricamento gruppi...</p>
                      </div>
                    ) : groups.length === 0 ? (
                      <div className="p-4 text-center text-rbr-text-muted text-sm">
                        Nessun gruppo disponibile
                      </div>
                    ) : (
                      <ScrollArea className="h-[120px]">
                        <div className="p-3 space-y-2">
                          {groups.map((group) => (
                            <div
                              key={group.id}
                              className="flex items-center space-x-2 hover:bg-rbr-dark-lighter p-2 rounded"
                            >
                              <Checkbox
                                id={`group-${group.id}`}
                                checked={field.value?.includes(group.id) || false}
                                onCheckedChange={(checked) => {
                                  const currentGroups = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentGroups, group.id]);
                                  } else {
                                    field.onChange(
                                      currentGroups.filter((id) => id !== group.id)
                                    );
                                  }
                                }}
                                className="border-rbr-border data-[state=checked]:bg-rbr-red data-[state=checked]:border-rbr-red"
                              />
                              <label
                                htmlFor={`group-${group.id}`}
                                className="text-sm text-rbr-text-primary cursor-pointer flex-1"
                              >
                                {group.name}
                                <span className="text-xs text-rbr-text-muted ml-2">
                                  ({group._count?.members || 0} membri)
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                  <p className="text-xs text-rbr-text-muted mt-1">
                    Seleziona i gruppi a cui assegnare l'utente
                  </p>
                  <FormMessage className="text-rbr-red" />
                </FormItem>
              )}
            />

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
                  <>{isEditing ? 'Aggiorna' : 'Crea Utente'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}





