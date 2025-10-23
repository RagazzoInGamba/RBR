/**
 * Red Bull Racing - Booking Wizard Component
 * Multi-step booking flow with enhanced UX
 * STEP 1: Date & Meal Selection
 * STEP 2: Menu Items Selection
 * STEP 3: Review & Confirm
 *
 * REFACTORED: 2025-10-22 - Integrated with real APIs
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StepProgress } from '@/components/ui/StepProgress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, ChevronRight, ChevronLeft, Euro, Check, Loader2, AlertCircle, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { validateBookingItems, calculateTotalPrice } from '@/lib/booking-validation';
import { MealType, RecipeCategory } from '@prisma/client';

const STEPS = [
  { label: 'Data & Orario', description: 'Quando vuoi mangiare?' },
  { label: 'Seleziona Piatti', description: 'Cosa vuoi ordinare?' },
  { label: 'Conferma', description: 'Rivedi il tuo ordine' },
];

interface Recipe {
  id: string;
  name: string;
  description?: string;
  category: RecipeCategory;
  price?: number; // cents
  imageUrl?: string;
  allergens: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
}

interface Menu {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  recipes: any; // JSON array
  maxBookings: number;
  currentBookings: number;
  isActive: boolean;
  recipesDetails?: Recipe[];
  availableSlots?: number;
}

interface SelectedItem {
  recipeId: string;
  recipeName: string;
  recipeCategory: RecipeCategory;
  quantity: number;
  unitPrice: number; // cents
}

interface BookingWizardProps {
  className?: string;
}

export function BookingWizard({ className }: BookingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Form data
  const [bookingData, setBookingData] = useState({
    date: '',
    mealType: '' as MealType | '',
    notes: '',
  });

  // Menus and recipes
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // UI states
  const [isLoadingMenus, setIsLoadingMenus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  // Fetch available menus on mount
  useEffect(() => {
    fetchAvailableMenus();
  }, []);

  // Update total price when items change
  useEffect(() => {
    const total = calculateTotalPrice(selectedItems);
    setTotalPrice(total);
  }, [selectedItems]);

  // Fetch menus from API
  const fetchAvailableMenus = async () => {
    setIsLoadingMenus(true);
    try {
      const response = await fetch('/api/menu/available?days=14');
      if (!response.ok) throw new Error('Errore caricamento menu');

      const data = await response.json();
      setMenus(data.menus || []);
    } catch (error) {
      toast.error('Errore', {
        description: 'Impossibile caricare i menu disponibili',
      });
    } finally {
      setIsLoadingMenus(false);
    }
  };

  // When date/mealType changes, find matching menu
  useEffect(() => {
    if (bookingData.date && bookingData.mealType) {
      const menu = menus.find(
        (m) => m.mealType === bookingData.mealType && m.date === bookingData.date
      );

      setSelectedMenu(menu || null);

      if (menu?.recipesDetails) {
        setAvailableRecipes(menu.recipesDetails);
      } else {
        setAvailableRecipes([]);
      }
    }
  }, [bookingData.date, bookingData.mealType, menus]);

  // Handle item quantity change
  const updateItemQuantity = (recipe: Recipe, delta: number) => {
    const existingIndex = selectedItems.findIndex((item) => item.recipeId === recipe.id);

    if (existingIndex >= 0) {
      const newQuantity = selectedItems[existingIndex].quantity + delta;

      if (newQuantity <= 0) {
        // Remove item
        setSelectedItems(selectedItems.filter((_, idx) => idx !== existingIndex));
      } else {
        // Update quantity
        const updated = [...selectedItems];
        updated[existingIndex].quantity = newQuantity;
        setSelectedItems(updated);
      }
    } else if (delta > 0) {
      // Add new item
      setSelectedItems([
        ...selectedItems,
        {
          recipeId: recipe.id,
          recipeName: recipe.name,
          recipeCategory: recipe.category,
          quantity: 1,
          unitPrice: recipe.price || 0,
        },
      ]);
    }
  };

  const getItemQuantity = (recipeId: string): number => {
    return selectedItems.find((item) => item.recipeId === recipeId)?.quantity || 0;
  };

  // Navigation handlers
  const handleNext = async () => {
    if (currentStep === 1) {
      if (!bookingData.date || !bookingData.mealType) {
        toast.error('Seleziona data e tipo pasto');
        return;
      }
      if (!selectedMenu) {
        toast.error('Nessun menu disponibile per la selezione');
        return;
      }
    }

    if (currentStep === 2) {
      if (selectedItems.length === 0) {
        toast.error('Seleziona almeno un piatto');
        return;
      }

      // Validate against booking rules
      const validation = await validateBookingItems(
        bookingData.mealType as MealType,
        selectedItems
      );

      if (!validation.valid) {
        toast.error('Selezione non valida', {
          description: validation.errors[0]?.message || 'Controlla le regole di prenotazione',
        });
        return;
      }
    }

    setCurrentStep(Math.min(3, currentStep + 1));
  };

  const handleBack = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  // Submit booking
  const handleSubmit = async () => {
    if (!selectedMenu) {
      toast.error('Menu non selezionato');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuId: selectedMenu.id,
          date: bookingData.date,
          mealType: bookingData.mealType,
          items: selectedItems,
          totalPrice,
          notes: bookingData.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la prenotazione');
      }

      toast.success('Prenotazione confermata!', {
        description: `Numero prenotazione: ${data.booking.id.slice(0, 8).toUpperCase()}`,
      });

      // Redirect to bookings page
      router.push('/booking');
    } catch (error: any) {
      toast.error('Errore', {
        description: error.message || 'Impossibile completare la prenotazione',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get unique dates from menus
  const getAvailableDates = (): { value: string; label: string }[] => {
    const dates = new Set<string>();
    menus.forEach((menu) => {
      dates.add(menu.date);
    });

    return Array.from(dates)
      .sort()
      .map((date) => ({
        value: date,
        label: new Date(date).toLocaleDateString('it-IT', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
      }));
  };

  // Get available meal types for selected date
  const getAvailableMealTypes = (): MealType[] => {
    if (!bookingData.date) return [];

    return menus
      .filter((m) => m.date === bookingData.date)
      .map((m) => m.mealType)
      .filter((value, index, self) => self.indexOf(value) === index);
  };

  const getMealTypeLabel = (mealType: MealType): string => {
    const labels: Record<MealType, string> = {
      BREAKFAST: 'Colazione',
      LUNCH: 'Pranzo',
      DINNER: 'Cena',
      SNACK: 'Snack',
    };
    return labels[mealType];
  };

  const getCategoryLabel = (category: RecipeCategory): string => {
    const labels: Record<RecipeCategory, string> = {
      APPETIZER: 'Antipasto',
      FIRST_COURSE: 'Primo',
      SECOND_COURSE: 'Secondo',
      SIDE_DISH: 'Contorno',
      DESSERT: 'Dessert',
      BEVERAGE: 'Bevanda',
      EXTRA: 'Extra',
    };
    return labels[category];
  };

  return (
    <div className={cn('space-y-8', className)}>
      {/* Step Progress Indicator */}
      <StepProgress steps={STEPS} currentStep={currentStep} />

      {/* Step Content */}
      <Card className="racing-card p-8 min-h-[400px]">
        {/* STEP 1: Date & Meal Selection */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-racing-slide-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-heading font-bold text-rbr-text-primary mb-2">
                Quando vuoi prenotare?
              </h2>
              <p className="text-rbr-text-secondary">
                Seleziona data e tipo di pasto
              </p>
            </div>

            {isLoadingMenus ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-rbr-red" />
                <span className="ml-3 text-rbr-text-secondary">Caricamento menu...</span>
              </div>
            ) : menus.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-rbr-text-muted mb-4" />
                <p className="text-rbr-text-secondary">Nessun menu disponibile al momento</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Date Selector */}
                <div className="racing-card hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-rbr-red/20 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-rbr-red" />
                    </div>
                    <h3 className="font-heading font-bold text-rbr-text-primary">Data</h3>
                  </div>
                  <select
                    className="w-full bg-rbr-dark-elevated border border-rbr-border rounded-lg px-4 py-2.5 text-rbr-text-primary focus:ring-2 focus:ring-rbr-red/50 outline-none transition-all"
                    value={bookingData.date}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, date: e.target.value, mealType: '' })
                    }
                  >
                    <option value="">Seleziona data</option>
                    {getAvailableDates().map((date) => (
                      <option key={date.value} value={date.value}>
                        {date.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Meal Type Selector */}
                <div className="racing-card hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-rbr-navy/20 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-rbr-navy" />
                    </div>
                    <h3 className="font-heading font-bold text-rbr-text-primary">Tipo Pasto</h3>
                  </div>
                  <select
                    className="w-full bg-rbr-dark-elevated border border-rbr-border rounded-lg px-4 py-2.5 text-rbr-text-primary focus:ring-2 focus:ring-rbr-navy/50 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    value={bookingData.mealType}
                    disabled={!bookingData.date}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, mealType: e.target.value as MealType })
                    }
                  >
                    <option value="">
                      {bookingData.date ? 'Seleziona tipo pasto' : 'Seleziona prima una data'}
                    </option>
                    {getAvailableMealTypes().map((mealType) => (
                      <option key={mealType} value={mealType}>
                        {getMealTypeLabel(mealType)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Menu Info */}
                {selectedMenu && (
                  <div className="racing-card md:col-span-2 bg-gradient-to-br from-rbr-navy/10 to-rbr-red/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-heading font-bold text-rbr-text-primary mb-1">
                          {selectedMenu.name}
                        </h4>
                        <p className="text-sm text-rbr-text-secondary">
                          Posti disponibili: {selectedMenu.availableSlots} / {selectedMenu.maxBookings}
                        </p>
                      </div>
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Menu Items Selection */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-racing-slide-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-heading font-bold text-rbr-text-primary mb-2">
                Cosa vuoi ordinare?
              </h2>
              <p className="text-rbr-text-secondary">
                Menu {selectedMenu?.name} - {new Date(bookingData.date).toLocaleDateString('it-IT')}
              </p>
            </div>

            {availableRecipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-rbr-text-muted mb-4" />
                <p className="text-rbr-text-secondary">Nessun piatto disponibile in questo menu</p>
              </div>
            ) : (
              <>
                {/* Group recipes by category */}
                {Object.entries(
                  availableRecipes.reduce((acc, recipe) => {
                    if (!acc[recipe.category]) {
                      acc[recipe.category] = [];
                    }
                    acc[recipe.category].push(recipe);
                    return acc;
                  }, {} as Record<RecipeCategory, Recipe[]>)
                ).map(([category, recipes]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="font-heading font-bold text-rbr-text-primary text-lg border-b border-rbr-border pb-2">
                      {getCategoryLabel(category as RecipeCategory)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recipes.map((recipe) => {
                        const quantity = getItemQuantity(recipe.id);
                        return (
                          <div
                            key={recipe.id}
                            className={cn(
                              'racing-card transition-all',
                              quantity > 0 && 'border-rbr-red/60 bg-rbr-red/5'
                            )}
                          >
                            <div className="flex gap-4">
                              {/* Image */}
                              {recipe.imageUrl ? (
                                <img
                                  src={recipe.imageUrl}
                                  alt={recipe.name}
                                  className="w-20 h-20 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-lg bg-rbr-dark-elevated flex items-center justify-center text-3xl">
                                  🍽️
                                </div>
                              )}

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <h4 className="font-heading font-bold text-rbr-text-primary truncate">
                                      {recipe.name}
                                    </h4>
                                    <p className="text-xs text-rbr-text-muted line-clamp-2">
                                      {recipe.description || 'Nessuna descrizione'}
                                    </p>
                                  </div>
                                </div>

                                {/* Tags */}
                                <div className="flex items-center gap-1 mb-2 flex-wrap">
                                  {recipe.isVegetarian && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-500">
                                      Vegetariano
                                    </span>
                                  )}
                                  {recipe.isVegan && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-green-600/20 text-green-600">
                                      Vegano
                                    </span>
                                  )}
                                  {recipe.isGlutenFree && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-500">
                                      Senza Glutine
                                    </span>
                                  )}
                                </div>

                                {/* Price and Quantity */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1 text-green-500 font-heading font-bold">
                                    <Euro className="h-3 w-3" />
                                    {((recipe.price || 0) / 100).toFixed(2)}
                                  </div>

                                  {/* Quantity Controls */}
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 w-7 p-0 border-rbr-border"
                                      onClick={() => updateItemQuantity(recipe, -1)}
                                      disabled={quantity === 0}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="text-sm font-medium text-rbr-text-primary w-6 text-center">
                                      {quantity}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 w-7 p-0 border-rbr-border"
                                      onClick={() => updateItemQuantity(recipe, 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Total Price Display */}
                {selectedItems.length > 0 && (
                  <div className="racing-card bg-gradient-to-br from-rbr-navy/10 to-rbr-red/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-rbr-text-muted">Totale parziale</p>
                        <p className="text-xs text-rbr-text-muted">
                          {selectedItems.length} piatt{selectedItems.length === 1 ? 'o' : 'i'} selezionat
                          {selectedItems.length === 1 ? 'o' : 'i'}
                        </p>
                      </div>
                      <div className="text-3xl font-heading font-bold text-green-500 flex items-center gap-1">
                        <Euro className="h-6 w-6" />
                        {(totalPrice / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* STEP 3: Review & Confirm */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-racing-slide-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-heading font-bold text-rbr-text-primary mb-2">
                Conferma il Tuo Ordine
              </h2>
              <p className="text-rbr-text-secondary">
                Rivedi i dettagli prima di confermare
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
              {/* Order Summary */}
              <div className="racing-card bg-gradient-to-br from-rbr-navy/10 to-rbr-red/10">
                <h3 className="font-heading font-bold text-rbr-text-primary mb-4">
                  Riepilogo Prenotazione
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-rbr-text-muted">Menu:</span>
                    <span className="text-rbr-text-primary font-medium">
                      {selectedMenu?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-rbr-text-muted">Data:</span>
                    <span className="text-rbr-text-primary font-medium">
                      {new Date(bookingData.date).toLocaleDateString('it-IT', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-rbr-text-muted">Tipo Pasto:</span>
                    <span className="text-rbr-text-primary font-medium">
                      {bookingData.mealType ? getMealTypeLabel(bookingData.mealType as MealType) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="racing-card">
                <h3 className="font-heading font-bold text-rbr-text-primary mb-4">
                  Piatti Ordinati ({selectedItems.length})
                </h3>
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div
                      key={item.recipeId}
                      className="flex justify-between items-start pb-3 border-b border-rbr-border last:border-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-rbr-text-primary font-medium">{item.recipeName}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-rbr-navy/20 text-rbr-text-muted">
                            {getCategoryLabel(item.recipeCategory)}
                          </span>
                        </div>
                        <div className="text-sm text-rbr-text-muted">
                          Quantità: {item.quantity} x €{(item.unitPrice / 100).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-green-500 font-heading font-bold">
                        €{((item.quantity * item.unitPrice) / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-rbr-border mt-4 pt-4 flex justify-between items-center">
                  <span className="font-heading font-bold text-rbr-text-primary text-lg">Totale:</span>
                  <span className="text-3xl font-heading font-bold text-green-500 flex items-center gap-1">
                    <Euro className="h-6 w-6" />
                    {(totalPrice / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="racing-card">
                <h3 className="font-heading font-bold text-rbr-text-primary mb-4">
                  Note (opzionale)
                </h3>
                <textarea
                  className="w-full bg-rbr-dark-elevated border border-rbr-border rounded-lg px-4 py-2.5 text-rbr-text-primary focus:ring-2 focus:ring-rbr-red/50 outline-none resize-none"
                  rows={3}
                  placeholder="Aggiungi note per la tua prenotazione (es. allergie, preferenze di cottura...)"
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isSubmitting}
          className="gap-2 border-rbr-border text-rbr-text-primary hover:bg-rbr-dark-elevated disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Indietro
        </Button>

        {currentStep < 3 ? (
          <Button
            onClick={handleNext}
            disabled={isLoadingMenus || isSubmitting}
            className="bg-racing-red-gradient hover:opacity-90 gap-2 disabled:opacity-50"
          >
            Avanti
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedItems.length === 0}
            className="bg-racing-gradient hover:opacity-90 gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Invio in corso...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Conferma Prenotazione
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
