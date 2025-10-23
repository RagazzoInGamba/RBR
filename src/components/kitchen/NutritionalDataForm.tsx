/**
 * Red Bull Racing - Nutritional Data Form
 * Complete INRAN/CREA nutritional values input form with tabs and validation
 */

'use client';

import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Zap,
  Activity,
  Package,
  Sparkles,
  Droplet,
  AlertTriangle,
  CheckCircle2,
  Calculator,
} from 'lucide-react';
import {
  INRANNutritionalValues,
  calculateEnergyKcal,
  kcalToKJ,
  calculateSalt,
  validateNutritionalValues,
  getNutritionLabel,
} from '@/lib/inran-nutrition';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NutritionalDataFormProps {
  form: UseFormReturn<any>;
}

export function NutritionalDataForm({ form }: NutritionalDataFormProps) {
  const [autoCalculated, setAutoCalculated] = useState<{
    energy_kcal?: number;
    energy_kj?: number;
    salt?: number;
  }>({});

  const nutritionalValues = form.watch('nutritionalValues') || {};
  // const nutritionalSource = form.watch('nutritionalSource'); // Reserved for future source tracking

  // Auto-calculate energy from macronutrients
  useEffect(() => {
    const protein = nutritionalValues.protein || 0;
    const carbs = nutritionalValues.carbohydrates || 0;
    const fats = nutritionalValues.fats || 0;
    const alcohol = nutritionalValues.alcohol || 0;

    if (protein || carbs || fats || alcohol) {
      const calculatedKcal = calculateEnergyKcal(protein, carbs, fats, alcohol);
      const calculatedKJ = kcalToKJ(calculatedKcal);

      setAutoCalculated({
        energy_kcal: calculatedKcal,
        energy_kj: calculatedKJ,
      });
    }
  }, [
    nutritionalValues.protein,
    nutritionalValues.carbohydrates,
    nutritionalValues.fats,
    nutritionalValues.alcohol,
  ]);

  // Auto-calculate salt from sodium
  useEffect(() => {
    const sodium = nutritionalValues.sodium;
    if (sodium) {
      setAutoCalculated((prev) => ({
        ...prev,
        salt: calculateSalt(sodium),
      }));
    }
  }, [nutritionalValues.sodium]);

  // Validate nutritional values
  const validation = validateNutritionalValues(nutritionalValues as INRANNutritionalValues);

  // Helper to update nutritional value
  const updateNutritionalValue = (key: string, value: number | undefined) => {
    const current = form.getValues('nutritionalValues') || {};
    form.setValue('nutritionalValues', {
      ...current,
      [key]: value,
    });
  };

  // Helper to update amino acid value (reserved for future amino acid tracking)
  // const updateAminoAcid = (key: string, value: number | undefined) => {
  //   const current = form.getValues('nutritionalValues') || {};
  //   const aminoAcids = current.amino_acids || {};
  //   form.setValue('nutritionalValues', {
  //     ...current,
  //     amino_acids: {
  //       ...aminoAcids,
  //       [key]: value,
  //     },
  //   });
  // };

  // Use auto-calculated energy
  const useAutoCalculatedEnergy = () => {
    if (autoCalculated.energy_kcal) {
      updateNutritionalValue('energy_kcal', autoCalculated.energy_kcal);
      updateNutritionalValue('energy_kj', autoCalculated.energy_kj);
    }
  };

  // Use auto-calculated salt
  const useAutoCalculatedSalt = () => {
    if (autoCalculated.salt) {
      updateNutritionalValue('salt', autoCalculated.salt);
    }
  };

  const nutritionLabel = getNutritionLabel(nutritionalValues as INRANNutritionalValues);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-rbr-text-primary flex items-center gap-2">
            <Activity className="h-5 w-5 text-rbr-red" />
            Dati Nutrizionali INRAN/CREA
          </h3>
          <p className="text-sm text-rbr-text-muted">Valori per 100g di porzione edibile</p>
        </div>

        <FormField
          control={form.control}
          name="nutritionalSource"
          render={({ field }) => (
            <FormItem className="w-48">
              <Select onValueChange={field.onChange} value={field.value || 'MANUAL'}>
                <FormControl>
                  <SelectTrigger className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary">
                    <SelectValue placeholder="Fonte dati" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-rbr-dark-elevated border-rbr-border">
                  <SelectItem value="INRAN" className="text-rbr-text-primary">INRAN</SelectItem>
                  <SelectItem value="CREA" className="text-rbr-text-primary">CREA</SelectItem>
                  <SelectItem value="MANUAL" className="text-rbr-text-primary">Manuale</SelectItem>
                  <SelectItem value="CALCULATED" className="text-rbr-text-primary">Calcolato</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>

      {/* Portion Size & INRAN Code */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="portionSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-rbr-text-primary">Dimensione Porzione (g)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  value={field.value || ''}
                  placeholder="250"
                  className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                />
              </FormControl>
              <FormMessage className="text-rbr-red" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inranCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-rbr-text-primary">Codice INRAN/CREA</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="es. 001001"
                  className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                />
              </FormControl>
              <FormMessage className="text-rbr-red" />
            </FormItem>
          )}
        />
      </div>

      {/* Validation Alerts */}
      {validation.errors.length > 0 && (
        <Alert className="bg-rbr-red/10 border-rbr-red/30">
          <AlertTriangle className="h-4 w-4 text-rbr-red" />
          <AlertDescription className="text-rbr-red text-sm">
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validation.valid && Object.keys(nutritionalValues).length > 0 && (
        <Alert className="bg-green-500/10 border-green-500/30">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-500 text-sm">
            Valori nutrizionali validi e coerenti
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for different nutritional categories */}
      <Tabs defaultValue="energia" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-rbr-dark-elevated">
          <TabsTrigger value="energia" className="data-[state=active]:bg-rbr-red">
            <Zap className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="macro" className="data-[state=active]:bg-rbr-navy">
            <Activity className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="minerali" className="data-[state=active]:bg-rbr-accent-blue">
            <Package className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="vitamine" className="data-[state=active]:bg-rbr-accent-green">
            <Sparkles className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="grassi" className="data-[state=active]:bg-yellow-500">
            <Droplet className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="zuccheri" className="data-[state=active]:bg-pink-500">
            <Calculator className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        {/* ENERGIA */}
        <TabsContent value="energia" className="space-y-4">
          <Card className="bg-rbr-dark-elevated border-rbr-border">
            <CardHeader>
              <CardTitle className="text-rbr-text-primary flex items-center gap-2">
                <Zap className="h-5 w-5 text-rbr-red" />
                Energia
              </CardTitle>
              <CardDescription className="text-rbr-text-muted">
                Valori energetici calcolati automaticamente dai macronutrienti
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel className="text-rbr-text-primary">Energia (kcal)</FormLabel>
                  <Input
                    type="number"
                    step="0.1"
                    value={nutritionalValues.energy_kcal || ''}
                    onChange={(e) =>
                      updateNutritionalValue(
                        'energy_kcal',
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    placeholder="371"
                    className="bg-rbr-dark border-rbr-border text-rbr-text-primary"
                  />
                  {autoCalculated.energy_kcal && (
                    <p className="text-xs text-rbr-text-muted mt-1">
                      Auto-calcolato: {autoCalculated.energy_kcal} kcal{' '}
                      <button
                        type="button"
                        onClick={useAutoCalculatedEnergy}
                        className="text-rbr-accent-blue hover:underline"
                      >
                        Usa
                      </button>
                    </p>
                  )}
                </div>

                <div>
                  <FormLabel className="text-rbr-text-primary">Energia (kJ)</FormLabel>
                  <Input
                    type="number"
                    step="1"
                    value={nutritionalValues.energy_kj || ''}
                    onChange={(e) =>
                      updateNutritionalValue(
                        'energy_kj',
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    placeholder="1553"
                    className="bg-rbr-dark border-rbr-border text-rbr-text-primary"
                  />
                  {autoCalculated.energy_kj && (
                    <p className="text-xs text-rbr-text-muted mt-1">
                      Auto-calcolato: {autoCalculated.energy_kj} kJ
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MACRONUTRIENTI */}
        <TabsContent value="macro" className="space-y-4">
          <Card className="bg-rbr-dark-elevated border-rbr-border">
            <CardHeader>
              <CardTitle className="text-rbr-text-primary">Macronutrienti (g)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <NutritionalInput
                    label="Acqua (g)"
                    value={nutritionalValues.water}
                    onChange={(v) => updateNutritionalValue('water', v)}
                    placeholder="10.9"
                  />
                  <NutritionalInput
                    label="Proteine (g)"
                    value={nutritionalValues.protein}
                    onChange={(v) => updateNutritionalValue('protein', v)}
                    placeholder="11.7"
                  />
                  <NutritionalInput
                    label="Carboidrati (g)"
                    value={nutritionalValues.carbohydrates}
                    onChange={(v) => updateNutritionalValue('carbohydrates', v)}
                    placeholder="75.2"
                  />
                  <NutritionalInput
                    label="Grassi (g)"
                    value={nutritionalValues.fats}
                    onChange={(v) => updateNutritionalValue('fats', v)}
                    placeholder="1.4"
                  />
                  <NutritionalInput
                    label="Fibre (g)"
                    value={nutritionalValues.fiber}
                    onChange={(v) => updateNutritionalValue('fiber', v)}
                    placeholder="2.9"
                  />
                  <NutritionalInput
                    label="Ceneri (g)"
                    value={nutritionalValues.ash}
                    onChange={(v) => updateNutritionalValue('ash', v)}
                    placeholder="1.2"
                  />
                  <NutritionalInput
                    label="Alcol (g)"
                    value={nutritionalValues.alcohol}
                    onChange={(v) => updateNutritionalValue('alcohol', v)}
                    placeholder="0"
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MINERALI */}
        <TabsContent value="minerali" className="space-y-4">
          <Card className="bg-rbr-dark-elevated border-rbr-border">
            <CardHeader>
              <CardTitle className="text-rbr-text-primary">Minerali</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <NutritionalInput
                    label="Sodio (mg)"
                    value={nutritionalValues.sodium}
                    onChange={(v) => updateNutritionalValue('sodium', v)}
                    placeholder="3"
                  />
                  <div>
                    <NutritionalInput
                      label="Sale (g)"
                      value={nutritionalValues.salt}
                      onChange={(v) => updateNutritionalValue('salt', v)}
                      placeholder="0.0075"
                    />
                    {autoCalculated.salt && (
                      <p className="text-xs text-rbr-text-muted mt-1">
                        Auto-calcolato: {autoCalculated.salt} g{' '}
                        <button
                          type="button"
                          onClick={useAutoCalculatedSalt}
                          className="text-rbr-accent-blue hover:underline"
                        >
                          Usa
                        </button>
                      </p>
                    )}
                  </div>
                  <NutritionalInput
                    label="Calcio (mg)"
                    value={nutritionalValues.calcium}
                    onChange={(v) => updateNutritionalValue('calcium', v)}
                  />
                  <NutritionalInput
                    label="Ferro (mg)"
                    value={nutritionalValues.iron}
                    onChange={(v) => updateNutritionalValue('iron', v)}
                  />
                  <NutritionalInput
                    label="Zinco (mg)"
                    value={nutritionalValues.zinc}
                    onChange={(v) => updateNutritionalValue('zinc', v)}
                  />
                  <NutritionalInput
                    label="Magnesio (mg)"
                    value={nutritionalValues.magnesium}
                    onChange={(v) => updateNutritionalValue('magnesium', v)}
                  />
                  <NutritionalInput
                    label="Fosforo (mg)"
                    value={nutritionalValues.phosphorus}
                    onChange={(v) => updateNutritionalValue('phosphorus', v)}
                  />
                  <NutritionalInput
                    label="Potassio (mg)"
                    value={nutritionalValues.potassium}
                    onChange={(v) => updateNutritionalValue('potassium', v)}
                  />
                  <NutritionalInput
                    label="Rame (mg)"
                    value={nutritionalValues.copper}
                    onChange={(v) => updateNutritionalValue('copper', v)}
                  />
                  <NutritionalInput
                    label="Selenio (μg)"
                    value={nutritionalValues.selenium}
                    onChange={(v) => updateNutritionalValue('selenium', v)}
                  />
                  <NutritionalInput
                    label="Iodio (μg)"
                    value={nutritionalValues.iodine}
                    onChange={(v) => updateNutritionalValue('iodine', v)}
                  />
                  <NutritionalInput
                    label="Manganese (mg)"
                    value={nutritionalValues.manganese}
                    onChange={(v) => updateNutritionalValue('manganese', v)}
                  />
                  <NutritionalInput
                    label="Fluoruro (mg)"
                    value={nutritionalValues.fluoride}
                    onChange={(v) => updateNutritionalValue('fluoride', v)}
                  />
                  <NutritionalInput
                    label="Cloruro (mg)"
                    value={nutritionalValues.chloride}
                    onChange={(v) => updateNutritionalValue('chloride', v)}
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VITAMINE */}
        <TabsContent value="vitamine" className="space-y-4">
          <Card className="bg-rbr-dark-elevated border-rbr-border">
            <CardHeader>
              <CardTitle className="text-rbr-text-primary">Vitamine</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <NutritionalInput
                    label="Vitamina A (μg)"
                    value={nutritionalValues.vitamin_a}
                    onChange={(v) => updateNutritionalValue('vitamin_a', v)}
                  />
                  <NutritionalInput
                    label="Beta-carotene (μg)"
                    value={nutritionalValues.beta_carotene}
                    onChange={(v) => updateNutritionalValue('beta_carotene', v)}
                  />
                  <NutritionalInput
                    label="Vitamina B1 (mg)"
                    value={nutritionalValues.vitamin_b1}
                    onChange={(v) => updateNutritionalValue('vitamin_b1', v)}
                  />
                  <NutritionalInput
                    label="Vitamina B2 (mg)"
                    value={nutritionalValues.vitamin_b2}
                    onChange={(v) => updateNutritionalValue('vitamin_b2', v)}
                  />
                  <NutritionalInput
                    label="Vitamina B3 (mg)"
                    value={nutritionalValues.vitamin_b3}
                    onChange={(v) => updateNutritionalValue('vitamin_b3', v)}
                  />
                  <NutritionalInput
                    label="Vitamina B5 (mg)"
                    value={nutritionalValues.vitamin_b5}
                    onChange={(v) => updateNutritionalValue('vitamin_b5', v)}
                  />
                  <NutritionalInput
                    label="Vitamina B6 (mg)"
                    value={nutritionalValues.vitamin_b6}
                    onChange={(v) => updateNutritionalValue('vitamin_b6', v)}
                  />
                  <NutritionalInput
                    label="Vitamina B12 (μg)"
                    value={nutritionalValues.vitamin_b12}
                    onChange={(v) => updateNutritionalValue('vitamin_b12', v)}
                  />
                  <NutritionalInput
                    label="Folato (μg)"
                    value={nutritionalValues.folate}
                    onChange={(v) => updateNutritionalValue('folate', v)}
                  />
                  <NutritionalInput
                    label="Vitamina C (mg)"
                    value={nutritionalValues.vitamin_c}
                    onChange={(v) => updateNutritionalValue('vitamin_c', v)}
                  />
                  <NutritionalInput
                    label="Vitamina D (μg)"
                    value={nutritionalValues.vitamin_d}
                    onChange={(v) => updateNutritionalValue('vitamin_d', v)}
                  />
                  <NutritionalInput
                    label="Vitamina E (mg)"
                    value={nutritionalValues.vitamin_e}
                    onChange={(v) => updateNutritionalValue('vitamin_e', v)}
                  />
                  <NutritionalInput
                    label="Vitamina K (μg)"
                    value={nutritionalValues.vitamin_k}
                    onChange={(v) => updateNutritionalValue('vitamin_k', v)}
                  />
                  <NutritionalInput
                    label="Biotina (μg)"
                    value={nutritionalValues.biotin}
                    onChange={(v) => updateNutritionalValue('biotin', v)}
                  />
                  <NutritionalInput
                    label="Colina (mg)"
                    value={nutritionalValues.choline}
                    onChange={(v) => updateNutritionalValue('choline', v)}
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACIDI GRASSI */}
        <TabsContent value="grassi" className="space-y-4">
          <Card className="bg-rbr-dark-elevated border-rbr-border">
            <CardHeader>
              <CardTitle className="text-rbr-text-primary">Acidi Grassi (g)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <NutritionalInput
                  label="Grassi Saturi (g)"
                  value={nutritionalValues.saturated_fats}
                  onChange={(v) => updateNutritionalValue('saturated_fats', v)}
                />
                <NutritionalInput
                  label="Grassi Monoinsaturi (g)"
                  value={nutritionalValues.monounsaturated_fats}
                  onChange={(v) => updateNutritionalValue('monounsaturated_fats', v)}
                />
                <NutritionalInput
                  label="Grassi Polinsaturi (g)"
                  value={nutritionalValues.polyunsaturated_fats}
                  onChange={(v) => updateNutritionalValue('polyunsaturated_fats', v)}
                />
                <NutritionalInput
                  label="Grassi Trans (g)"
                  value={nutritionalValues.trans_fats}
                  onChange={(v) => updateNutritionalValue('trans_fats', v)}
                />
                <NutritionalInput
                  label="Colesterolo (mg)"
                  value={nutritionalValues.cholesterol}
                  onChange={(v) => updateNutritionalValue('cholesterol', v)}
                />
                <NutritionalInput
                  label="Omega-3 (g)"
                  value={nutritionalValues.omega_3}
                  onChange={(v) => updateNutritionalValue('omega_3', v)}
                />
                <NutritionalInput
                  label="Omega-6 (g)"
                  value={nutritionalValues.omega_6}
                  onChange={(v) => updateNutritionalValue('omega_6', v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ZUCCHERI */}
        <TabsContent value="zuccheri" className="space-y-4">
          <Card className="bg-rbr-dark-elevated border-rbr-border">
            <CardHeader>
              <CardTitle className="text-rbr-text-primary">Zuccheri Solubili (g)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <NutritionalInput
                  label="Zuccheri Totali (g)"
                  value={nutritionalValues.sugars}
                  onChange={(v) => updateNutritionalValue('sugars', v)}
                />
                <NutritionalInput
                  label="Glucosio (g)"
                  value={nutritionalValues.glucose}
                  onChange={(v) => updateNutritionalValue('glucose', v)}
                />
                <NutritionalInput
                  label="Fruttosio (g)"
                  value={nutritionalValues.fructose}
                  onChange={(v) => updateNutritionalValue('fructose', v)}
                />
                <NutritionalInput
                  label="Saccarosio (g)"
                  value={nutritionalValues.sucrose}
                  onChange={(v) => updateNutritionalValue('sucrose', v)}
                />
                <NutritionalInput
                  label="Lattosio (g)"
                  value={nutritionalValues.lactose}
                  onChange={(v) => updateNutritionalValue('lactose', v)}
                />
                <NutritionalInput
                  label="Maltosio (g)"
                  value={nutritionalValues.maltose}
                  onChange={(v) => updateNutritionalValue('maltose', v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* EU Nutrition Label Preview */}
      {Object.keys(nutritionalValues).length > 0 && (
        <Card className="bg-rbr-dark-elevated border-rbr-border">
          <CardHeader>
            <CardTitle className="text-rbr-text-primary text-sm">
              Anteprima Etichetta Nutrizionale EU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white text-black p-4 rounded font-mono text-sm border-2 border-black">
              <div className="font-bold border-b-2 border-black pb-1 mb-2">
                INFORMAZIONI NUTRIZIONALI
              </div>
              <div className="border-b border-black pb-1">Valori medi per 100 g</div>
              <div className="space-y-1 mt-2">
                <div className="flex justify-between font-bold border-t-4 border-black pt-1">
                  <span>Energia</span>
                  <span>
                    {nutritionLabel.energia.kj} kJ / {nutritionLabel.energia.kcal} kcal
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Grassi</span>
                  <span>{nutritionLabel.grassi.totali.toFixed(1)} g</span>
                </div>
                <div className="flex justify-between pl-4">
                  <span>di cui acidi grassi saturi</span>
                  <span>{nutritionLabel.grassi.saturi.toFixed(1)} g</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Carboidrati</span>
                  <span>{nutritionLabel.carboidrati.totali.toFixed(1)} g</span>
                </div>
                <div className="flex justify-between pl-4">
                  <span>di cui zuccheri</span>
                  <span>{nutritionLabel.carboidrati.zuccheri.toFixed(1)} g</span>
                </div>
                {nutritionLabel.fibre !== undefined && (
                  <div className="flex justify-between font-bold">
                    <span>Fibre</span>
                    <span>{nutritionLabel.fibre.toFixed(1)} g</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Proteine</span>
                  <span>{nutritionLabel.proteine.toFixed(1)} g</span>
                </div>
                <div className="flex justify-between font-bold border-t border-black pt-1">
                  <span>Sale</span>
                  <span>{nutritionLabel.sale.toFixed(2)} g</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component for nutritional inputs
interface NutritionalInputProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
}

function NutritionalInput({ label, value, onChange, placeholder }: NutritionalInputProps) {
  return (
    <div>
      <FormLabel className="text-rbr-text-primary text-sm">{label}</FormLabel>
      <Input
        type="number"
        step="0.01"
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
        placeholder={placeholder || '0'}
        className="bg-rbr-dark border-rbr-border text-rbr-text-primary mt-1"
      />
    </div>
  );
}
