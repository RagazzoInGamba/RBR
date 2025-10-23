/**
 * Red Bull Racing - Menu Form Dialog
 * Create/Edit menu with MenuBuilder + Nutritional Summary
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { MenuBuilder, MenuCourses } from './MenuBuilder';
import { NutritionalSummaryCard } from './NutritionalSummaryCard';

const menuSchema = z.object({
  name: z.string().min(3, 'Nome menu minimo 3 caratteri'),
  startDate: z.date({ required_error: 'Data inizio richiesta' }),
  endDate: z.date({ required_error: 'Data fine richiesta' }),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  menuType: z.enum(['STANDARD', 'VEGETARIAN', 'VEGAN', 'CELIAC', 'LOW_SODIUM']),
  targetDiners: z.number().int().positive().optional(),
  maxBookings: z.number().int().positive('Max prenotazioni deve essere positivo'),
  isActive: z.boolean().default(true),
});

type MenuFormData = z.infer<typeof menuSchema>;

interface MenuFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu?: {
    id: string;
    name: string;
    startDate: string | Date;
    endDate: string | Date;
    mealType: string;
    menuType: string;
    courses: any;
    targetDiners?: number;
    maxBookings: number;
    isActive: boolean;
  };
  onSuccess?: () => void;
}

const MEAL_TYPES = [
  { value: 'BREAKFAST', label: 'Colazione' },
  { value: 'LUNCH', label: 'Pranzo' },
  { value: 'DINNER', label: 'Cena' },
  { value: 'SNACK', label: 'Snack' },
];

const MENU_TYPES = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'VEGETARIAN', label: 'Vegetariano' },
  { value: 'VEGAN', label: 'Vegano' },
  { value: 'CELIAC', label: 'Celiaco' },
  { value: 'LOW_SODIUM', label: 'Iposodico' },
];

export function MenuFormDialog({
  open,
  onOpenChange,
  menu,
  onSuccess,
}: MenuFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<MenuCourses>({
    antipasto: [],
    primo: [],
    secondo: [],
    contorno: [],
    dessert: [],
    extra: [],
  });
  const isEditing = !!menu;

  const form = useForm<MenuFormData>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      name: menu?.name || '',
      startDate: menu?.startDate ? new Date(menu.startDate) : new Date(),
      endDate: menu?.endDate ? new Date(menu.endDate) : new Date(),
      mealType: (menu?.mealType as any) || 'LUNCH',
      menuType: (menu?.menuType as any) || 'STANDARD',
      targetDiners: menu?.targetDiners,
      maxBookings: menu?.maxBookings || 100,
      isActive: menu?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (menu) {
      form.reset({
        name: menu.name,
        startDate: new Date(menu.startDate),
        endDate: new Date(menu.endDate),
        mealType: menu.mealType as any,
        menuType: menu.menuType as any,
        targetDiners: menu.targetDiners,
        maxBookings: menu.maxBookings,
        isActive: menu.isActive,
      });

      // Load courses if editing
      if (menu.courses) {
        setSelectedCourses(menu.courses as MenuCourses);
      }
    }
  }, [menu, form]);

  const handleCoursesChange = useCallback((courses: MenuCourses) => {
    setSelectedCourses(courses);
  }, []);

  const onSubmit = async (data: MenuFormData) => {
    // Validate at least one course selected
    const totalRecipes = Object.values(selectedCourses)
      .flat()
      .reduce((sum, r) => sum + r.quantity, 0);

    if (totalRecipes === 0) {
      toast.error('Aggiungi almeno una ricetta al menu');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isEditing
        ? `/api/kitchen/menus/${menu.id}`
        : '/api/kitchen/menus';

      const method = isEditing ? 'PATCH' : 'POST';

      // Format payload
      const payload = {
        name: data.name,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        endDate: format(data.endDate, 'yyyy-MM-dd'),
        mealType: data.mealType,
        menuType: data.menuType,
        targetDiners: data.targetDiners,
        maxBookings: data.maxBookings,
        isActive: data.isActive,
        courses: selectedCourses,
      };

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
          ? 'Menu aggiornato con successo'
          : 'Menu creato con successo'
      );

      form.reset();
      setSelectedCourses({
        antipasto: [],
        primo: [],
        secondo: [],
        contorno: [],
        dessert: [],
        extra: [],
      });
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
      <DialogContent className="max-w-[95vw] max-h-[95vh] bg-rbr-dark border-rbr-border-light p-0">
        <ScrollArea className="max-h-[95vh]">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-rbr-text-primary font-heading text-xl">
                {isEditing ? 'Modifica Menu' : 'Nuovo Menu'}
              </DialogTitle>
              <DialogDescription className="text-rbr-text-secondary">
                {isEditing
                  ? 'Modifica i dettagli e le ricette del menu'
                  : 'Compila i campi e aggiungi ricette trascinandole dal pannello laterale'}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                {/* Basic Info Section */}
                <div className="space-y-4 p-4 rounded-lg bg-rbr-dark-elevated border border-rbr-border">
                  <h3 className="text-sm font-semibold text-rbr-text-primary">Informazioni Base</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-rbr-text-primary">Nome Menu *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Menu del Giorno"
                              className="bg-rbr-dark border-rbr-border text-rbr-text-primary"
                            />
                          </FormControl>
                          <FormMessage className="text-rbr-red" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="menuType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-rbr-text-primary">Tipo Menu *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-rbr-dark border-rbr-border text-rbr-text-primary">
                                <SelectValue placeholder="Seleziona tipo menu" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-rbr-dark-elevated border-rbr-border">
                              {MENU_TYPES.map((type) => (
                                <SelectItem
                                  key={type.value}
                                  value={type.value}
                                  className="text-rbr-text-primary hover:bg-rbr-dark-lighter"
                                >
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-rbr-red" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-rbr-text-primary">Data Inizio *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full pl-3 text-left font-normal bg-rbr-dark border-rbr-border text-rbr-text-primary hover:bg-rbr-dark-lighter',
                                    !field.value && 'text-rbr-text-secondary'
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP', { locale: it })
                                  ) : (
                                    <span>Seleziona data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-rbr-dark-elevated border-rbr-border" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                className="text-rbr-text-primary"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage className="text-rbr-red" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-rbr-text-primary">Data Fine *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full pl-3 text-left font-normal bg-rbr-dark border-rbr-border text-rbr-text-primary hover:bg-rbr-dark-lighter',
                                    !field.value && 'text-rbr-text-secondary'
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP', { locale: it })
                                  ) : (
                                    <span>Seleziona data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-rbr-dark-elevated border-rbr-border" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                className="text-rbr-text-primary"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage className="text-rbr-red" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mealType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-rbr-text-primary">Tipo Pasto *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-rbr-dark border-rbr-border text-rbr-text-primary">
                                <SelectValue placeholder="Seleziona tipo pasto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-rbr-dark-elevated border-rbr-border">
                              {MEAL_TYPES.map((type) => (
                                <SelectItem
                                  key={type.value}
                                  value={type.value}
                                  className="text-rbr-text-primary hover:bg-rbr-dark-lighter"
                                >
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-rbr-red" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetDiners"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-rbr-text-primary">Commensali Previsti</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              placeholder="100"
                              className="bg-rbr-dark border-rbr-border text-rbr-text-primary"
                            />
                          </FormControl>
                          <FormMessage className="text-rbr-red" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxBookings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-rbr-text-primary">Max Prenotazioni *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              className="bg-rbr-dark border-rbr-border text-rbr-text-primary"
                            />
                          </FormControl>
                          <FormMessage className="text-rbr-red" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-rbr-border p-3 bg-rbr-dark col-span-2">
                          <div className="space-y-0.5">
                            <FormLabel className="text-rbr-text-primary">Menu Attivo</FormLabel>
                            <FormDescription className="text-rbr-text-secondary text-xs">
                              Il menu sarà visibile e prenotabile dagli utenti
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
                  </div>
                </div>

                <Separator className="bg-rbr-border" />

                {/* Menu Builder */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-rbr-text-primary">Composizione Menu</h3>
                  <MenuBuilder
                    initialCourses={selectedCourses}
                    onChange={handleCoursesChange}
                  />
                </div>

                <Separator className="bg-rbr-border" />

                {/* Nutritional Summary */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-rbr-text-primary">Riepilogo Nutrizionale</h3>
                  <NutritionalSummaryCard selectedRecipes={selectedCourses} />
                </div>

                <DialogFooter className="gap-2 pt-6 border-t border-rbr-border sticky bottom-0 bg-rbr-dark pb-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setSelectedCourses({
                        antipasto: [],
                        primo: [],
                        secondo: [],
                        contorno: [],
                        dessert: [],
                        extra: [],
                      });
                      onOpenChange(false);
                    }}
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
                      <>{isEditing ? 'Aggiorna Menu' : 'Crea Menu'}</>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
