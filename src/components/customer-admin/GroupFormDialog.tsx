/**
 * Red Bull Racing - Group Form Dialog
 * Create/Edit group with React Hook Form + API integration
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

const groupSchema = z.object({
  name: z.string().min(3, 'Nome gruppo minimo 3 caratteri'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type GroupFormData = z.infer<typeof groupSchema>;

interface GroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: {
    id: string;
    name: string;
    description?: string | null;
    isActive: boolean;
  };
  onSuccess?: () => void;
}

export function GroupFormDialog({
  open,
  onOpenChange,
  group,
  onSuccess,
}: GroupFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!group;

  const form = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: group?.name || '',
      description: group?.description || '',
      isActive: group?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (group) {
      form.reset({
        name: group.name,
        description: group.description || '',
        isActive: group.isActive,
      });
    }
  }, [group, form]);

  const onSubmit = async (data: GroupFormData) => {
    setIsLoading(true);
    try {
      const endpoint = isEditing
        ? `/api/customer/groups/${group.id}`
        : '/api/customer/groups';

      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore durante il salvataggio');
      }

      toast.success(
        isEditing
          ? 'Gruppo aggiornato con successo'
          : 'Gruppo creato con successo'
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
      <DialogContent className="sm:max-w-[500px] bg-rbr-dark border-rbr-border-light">
        <DialogHeader>
          <DialogTitle className="text-rbr-text-primary font-heading text-xl">
            {isEditing ? 'Modifica Gruppo' : 'Nuovo Gruppo'}
          </DialogTitle>
          <DialogDescription className="text-rbr-text-secondary">
            {isEditing
              ? 'Modifica i dettagli del gruppo'
              : 'Compila i campi per creare un nuovo gruppo'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-rbr-text-primary">Nome Gruppo *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Engineering Team"
                      className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                    />
                  </FormControl>
                  <FormMessage className="text-rbr-red" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-rbr-text-primary">Descrizione</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Breve descrizione del gruppo..."
                      className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary min-h-[100px]"
                    />
                  </FormControl>
                  <FormDescription className="text-rbr-text-secondary text-xs">
                    Opzionale - descrizione dello scopo del gruppo
                  </FormDescription>
                  <FormMessage className="text-rbr-red" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-rbr-border p-4 bg-rbr-dark-elevated">
                  <div className="space-y-0.5">
                    <FormLabel className="text-rbr-text-primary">Gruppo Attivo</FormLabel>
                    <FormDescription className="text-rbr-text-secondary text-xs">
                      Il gruppo sarà visibile e utilizzabile
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-rbr-accent-green"
                    />
                  </FormControl>
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
                  <>{isEditing ? 'Aggiorna' : 'Crea Gruppo'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
