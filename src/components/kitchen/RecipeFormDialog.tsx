/**
 * Red Bull Racing - Recipe Form Dialog
 * Multi-step form: Info → Ingredients → Instructions
 */

'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Trash2, ChevronLeft, ChevronRight, Upload, X, Image as ImageIcon } from 'lucide-react';
import { NutritionalDataForm } from '@/components/kitchen/NutritionalDataForm';
import { uploadRecipeImageWithRetry, validateImageFile, formatFileSize } from '@/lib/minio-upload';

const ingredientSchema = z.object({
  name: z.string().min(2, 'Nome ingrediente richiesto'),
  quantity: z.number().positive('Quantità deve essere positiva'),
  unit: z.string().min(1, 'Unità richiesta'),
  inranCode: z.string().optional(),
});

const recipeSchema = z.object({
  name: z.string().min(3, 'Nome ricetta minimo 3 caratteri'),
  description: z.string().optional(),
  category: z.enum(['APPETIZER', 'FIRST_COURSE', 'SECOND_COURSE', 'SIDE_DISH', 'DESSERT', 'BEVERAGE', 'EXTRA']),
  ingredients: z.array(ingredientSchema).min(1, 'Almeno 1 ingrediente richiesto'),
  instructions: z.string().min(10, 'Istruzioni minimo 10 caratteri'),
  prepTime: z.number().int().positive('Tempo preparazione richiesto'),
  cookTime: z.number().int().positive('Tempo cottura richiesto'),
  servings: z.number().int().positive('Porzioni richieste'),
  portionSize: z.number().int().positive().optional(),
  calories: z.number().int().positive().optional(),
  allergens: z.array(z.string()).default([]),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  // MinIO image URL
  imageUrl: z.string().url('URL immagine non valido').optional(),
  // INRAN nutritional data
  nutritionalValues: z.record(z.union([z.number(), z.record(z.number())])).optional(),
  inranCode: z.string().optional(),
  nutritionalSource: z.enum(['INRAN', 'CREA', 'MANUAL', 'CALCULATED']).optional(),
});

type RecipeFormData = z.infer<typeof recipeSchema>;

interface RecipeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe?: Partial<RecipeFormData> & { id?: string };
  onSuccess?: () => void;
}

const CATEGORIES = [
  { value: 'APPETIZER', label: 'Antipasto' },
  { value: 'FIRST_COURSE', label: 'Primo' },
  { value: 'SECOND_COURSE', label: 'Secondo' },
  { value: 'SIDE_DISH', label: 'Contorno' },
  { value: 'DESSERT', label: 'Dessert' },
  { value: 'BEVERAGE', label: 'Bevanda' },
  { value: 'EXTRA', label: 'Extra' },
];

const ALLERGENS = ['glutine', 'lattosio', 'uova', 'pesce', 'crostacei', 'frutta a guscio', 'soia', 'sedano'];

export function RecipeFormDialog({
  open,
  onOpenChange,
  recipe,
  onSuccess,
}: RecipeFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(recipe?.imageUrl || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const isEditing = !!recipe?.id;

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: recipe?.name || '',
      description: recipe?.description || '',
      category: recipe?.category || 'FIRST_COURSE',
      ingredients: recipe?.ingredients || [{ name: '', quantity: 0, unit: 'g', inranCode: '' }],
      instructions: recipe?.instructions || '',
      prepTime: recipe?.prepTime || 15,
      cookTime: recipe?.cookTime || 30,
      servings: recipe?.servings || 4,
      portionSize: recipe?.portionSize,
      calories: recipe?.calories,
      allergens: recipe?.allergens || [],
      isVegetarian: recipe?.isVegetarian || false,
      isVegan: recipe?.isVegan || false,
      isGlutenFree: recipe?.isGlutenFree || false,
      isAvailable: recipe?.isAvailable ?? true,
      nutritionalValues: recipe?.nutritionalValues || {},
      inranCode: recipe?.inranCode || '',
      nutritionalSource: recipe?.nutritionalSource || 'MANUAL',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'ingredients',
  });

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      toast.success(`Immagine selezionata: ${file.name} (${formatFileSize(file.size)})`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'File non valido');
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setValue('imageUrl', undefined);
    toast.info('Immagine rimossa');
  };

  const onSubmit = async (data: RecipeFormData) => {
    setIsLoading(true);
    try {
      let imageUrl = data.imageUrl;

      // Upload image if new file selected
      if (imageFile) {
        setIsUploadingImage(true);
        toast.info('Caricamento immagine su MinIO...');

        try {
          imageUrl = await uploadRecipeImageWithRetry(imageFile);
          toast.success('Immagine caricata con successo');
        } catch (uploadError) {
          throw new Error(
            uploadError instanceof Error
              ? uploadError.message
              : 'Errore upload immagine'
          );
        } finally {
          setIsUploadingImage(false);
        }
      }

      const endpoint = isEditing
        ? `/api/kitchen/recipes/${recipe.id}`
        : '/api/kitchen/recipes';

      const method = isEditing ? 'PATCH' : 'POST';

      const payload = {
        ...data,
        imageUrl,
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
          ? '✅ Ricetta aggiornata con successo'
          : '✅ Ricetta creata con successo'
      );

      form.reset();
      setStep(1);
      setImageFile(null);
      setImagePreview(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Si è verificato un errore');
    } finally {
      setIsLoading(false);
      setIsUploadingImage(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    
    if (step === 1) {
      fieldsToValidate = ['name', 'category', 'description', 'prepTime', 'cookTime', 'servings', 'calories'];
    } else if (step === 2) {
      fieldsToValidate = ['ingredients'];
    }

    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-rbr-dark border-rbr-border-light">
        <DialogHeader>
          <DialogTitle className="text-rbr-text-primary font-heading text-xl">
            {isEditing ? 'Modifica Ricetta' : 'Nuova Ricetta'}
          </DialogTitle>
          <DialogDescription className="text-rbr-text-secondary">
            Step {step} di 4: {step === 1 ? 'Informazioni Base' : step === 2 ? 'Ingredienti' : step === 3 ? 'Istruzioni & Tag' : 'Dati Nutrizionali'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* STEP 1: INFO BASE */}
            {step === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-rbr-text-primary">Nome Ricetta *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Pasta Carbonara"
                          className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                        />
                      </FormControl>
                      <FormMessage className="text-rbr-red" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-rbr-text-primary">Categoria *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary">
                            <SelectValue placeholder="Seleziona categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-rbr-dark-elevated border-rbr-border">
                          {CATEGORIES.map((cat) => (
                            <SelectItem
                              key={cat.value}
                              value={cat.value}
                              className="text-rbr-text-primary hover:bg-rbr-dark-lighter"
                            >
                              {cat.label}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-rbr-text-primary">Descrizione</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Breve descrizione della ricetta..."
                          className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage className="text-rbr-red" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="prepTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-rbr-text-primary">Prep (min) *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                          />
                        </FormControl>
                        <FormMessage className="text-rbr-red" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cookTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-rbr-text-primary">Cottura (min) *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                          />
                        </FormControl>
                        <FormMessage className="text-rbr-red" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="servings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-rbr-text-primary">Porzioni *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                  name="calories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-rbr-text-primary">Calorie (opzionale)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ''}
                          placeholder="400"
                          className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                        />
                      </FormControl>
                      <FormMessage className="text-rbr-red" />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* STEP 2: INGREDIENTI */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-rbr-text-primary text-lg">Ingredienti</FormLabel>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => append({ name: '', quantity: 0, unit: 'g' })}
                    className="bg-rbr-navy hover:bg-rbr-navy/80"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Aggiungi
                  </Button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-start p-3 rounded-lg bg-rbr-dark-elevated border border-rbr-border">
                      <div className="col-span-6">
                        <FormField
                          control={form.control}
                          name={`ingredients.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Nome ingrediente"
                                  className="bg-rbr-dark border-rbr-border-light text-rbr-text-primary"
                                />
                              </FormControl>
                              <FormMessage className="text-rbr-red text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-3">
                        <FormField
                          control={form.control}
                          name={`ingredients.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  placeholder="Qt"
                                  className="bg-rbr-dark border-rbr-border-light text-rbr-text-primary"
                                />
                              </FormControl>
                              <FormMessage className="text-rbr-red text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`ingredients.${index}.unit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="g"
                                  className="bg-rbr-dark border-rbr-border-light text-rbr-text-primary"
                                />
                              </FormControl>
                              <FormMessage className="text-rbr-red text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-1 flex items-center justify-center">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => remove(index)}
                            className="h-8 w-8 text-rbr-red hover:bg-rbr-red/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: ISTRUZIONI & TAG */}
            {step === 3 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-rbr-text-primary">Istruzioni *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descrivere step by step la preparazione..."
                          className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary min-h-[150px]"
                        />
                      </FormControl>
                      <FormMessage className="text-rbr-red" />
                    </FormItem>
                  )}
                />

                {/* IMAGE UPLOAD */}
                <div className="space-y-2">
                  <FormLabel className="text-rbr-text-primary">Immagine Ricetta</FormLabel>
                  <div className="space-y-3">
                    {imagePreview ? (
                      <div className="relative rounded-lg border border-rbr-border overflow-hidden bg-rbr-dark-elevated">
                        <img
                          src={imagePreview}
                          alt="Anteprima ricetta"
                          className="w-full h-48 object-cover"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-rbr-border rounded-lg cursor-pointer bg-rbr-dark-elevated hover:bg-rbr-dark-lighter transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="w-12 h-12 mb-3 text-rbr-text-secondary" />
                          <p className="mb-2 text-sm text-rbr-text-secondary">
                            <span className="font-semibold">Click per caricare</span> o trascina qui
                          </p>
                          <p className="text-xs text-rbr-text-muted">
                            JPG, PNG o WebP (max 5MB)
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                    {imageFile && (
                      <div className="flex items-center gap-2 text-sm text-rbr-text-secondary">
                        <Upload className="h-4 w-4" />
                        <span>{imageFile.name}</span>
                        <span className="text-rbr-text-muted">({formatFileSize(imageFile.size)})</span>
                      </div>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="allergens"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-rbr-text-primary">Allergeni</FormLabel>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {ALLERGENS.map((allergen) => (
                          <FormField
                            key={allergen}
                            control={form.control}
                            name="allergens"
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
                                <FormLabel className="text-rbr-text-secondary font-normal capitalize cursor-pointer">
                                  {allergen}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel className="text-rbr-text-primary">Caratteristiche</FormLabel>
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="isVegetarian"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-rbr-border data-[state=checked]:bg-rbr-accent-green"
                            />
                          </FormControl>
                          <FormLabel className="text-rbr-text-secondary font-normal cursor-pointer">
                            Vegetariana
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isVegan"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-rbr-border data-[state=checked]:bg-rbr-accent-green"
                            />
                          </FormControl>
                          <FormLabel className="text-rbr-text-secondary font-normal cursor-pointer">
                            Vegana
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isGlutenFree"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-rbr-border data-[state=checked]:bg-rbr-accent-green"
                            />
                          </FormControl>
                          <FormLabel className="text-rbr-text-secondary font-normal cursor-pointer">
                            Senza Glutine
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isAvailable"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-rbr-border data-[state=checked]:bg-rbr-accent-blue"
                            />
                          </FormControl>
                          <FormLabel className="text-rbr-text-secondary font-normal cursor-pointer">
                            Disponibile per ordini
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: DATI NUTRIZIONALI */}
            {step === 4 && (
              <div className="space-y-4">
                <NutritionalDataForm form={form} />
              </div>
            )}

            <DialogFooter className="gap-2 pt-4 border-t border-rbr-border">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={isLoading}
                  className="border-rbr-border text-rbr-text-primary hover:bg-rbr-dark-elevated"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Indietro
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setStep(1);
                  onOpenChange(false);
                }}
                disabled={isLoading}
                className="border-rbr-border text-rbr-text-primary hover:bg-rbr-dark-elevated"
              >
                Annulla
              </Button>

              {step < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-rbr-navy hover:bg-rbr-navy/80"
                >
                  {step === 3 ? 'Dati Nutrizionali (Opzionale)' : 'Avanti'}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading || isUploadingImage}
                  className="bg-racing-red-gradient hover:opacity-90"
                >
                  {isUploadingImage ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-pulse" />
                      Caricamento immagine...
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>{isEditing ? 'Aggiorna Ricetta' : 'Crea Ricetta'}</>
                  )}
                </Button>
              )}

              {/* Skip nutritional data button on step 3 */}
              {step === 3 && (
                <Button
                  type="submit"
                  disabled={isLoading || isUploadingImage}
                  variant="outline"
                  className="border-rbr-accent-green text-rbr-accent-green hover:bg-rbr-accent-green/10"
                >
                  {isUploadingImage ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-pulse" />
                      Caricamento...
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>Salta e Salva</>
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

