/**
 * Red Bull Racing - Nutritional Summary Card
 * Displays aggregated nutritional data for selected menu recipes
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { MenuCourses } from './MenuBuilder';
import { INRANNutritionalValues } from '@/lib/inran-nutrition';
import { Separator } from '@/components/ui/separator';

interface NutritionalSummaryCardProps {
  selectedRecipes: MenuCourses;
}

interface AggregatedNutrition {
  energy_kcal: number;
  energy_kj: number;
  protein: number;
  carbohydrates: number;
  fats: number;
  fiber: number;
  sodium: number;
  salt: number;
  allergens: Set<string>;
}

const ALLERGEN_LABELS: Record<string, string> = {
  glutine: 'Glutine',
  crostacei: 'Crostacei',
  uova: 'Uova',
  pesce: 'Pesce',
  arachidi: 'Arachidi',
  soia: 'Soia',
  latte: 'Latte',
  lattosio: 'Lattosio',
  frutta_a_guscio: 'Frutta a Guscio',
  'frutta a guscio': 'Frutta a Guscio',
  sedano: 'Sedano',
  senape: 'Senape',
  sesamo: 'Sesamo',
  anidride_solforosa: 'Solfiti',
  lupini: 'Lupini',
  molluschi: 'Molluschi',
};

// Daily Reference Intake (adult)
const DRI = {
  energy_kcal: 2000,
  protein: 50,
  carbohydrates: 260,
  fats: 70,
  fiber: 25,
  salt: 6,
};

export function NutritionalSummaryCard({ selectedRecipes }: NutritionalSummaryCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [nutrition, setNutrition] = useState<AggregatedNutrition>({
    energy_kcal: 0,
    energy_kj: 0,
    protein: 0,
    carbohydrates: 0,
    fats: 0,
    fiber: 0,
    sodium: 0,
    salt: 0,
    allergens: new Set(),
  });

  useEffect(() => {
    const fetchNutritionalData = async () => {
      setIsLoading(true);
      try {
        // Get all unique recipe IDs from all courses
        const allRecipeIds = Object.values(selectedRecipes)
          .flat()
          .map((r) => r.recipeId);

        if (allRecipeIds.length === 0) {
          setNutrition({
            energy_kcal: 0,
            energy_kj: 0,
            protein: 0,
            carbohydrates: 0,
            fats: 0,
            fiber: 0,
            sodium: 0,
            salt: 0,
            allergens: new Set(),
          });
          setIsLoading(false);
          return;
        }

        // Fetch detailed recipe data
        const response = await fetch(
          `/api/kitchen/recipes?ids=${allRecipeIds.join(',')}`
        );
        if (!response.ok) throw new Error('Failed to fetch recipe details');

        const data = await response.json();
        const recipesById = new Map(
          data.recipes.map((r: any) => [r.id, r])
        );

        // Aggregate nutrition
        let totalEnergy = 0;
        let totalEnergyKj = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFats = 0;
        let totalFiber = 0;
        let totalSodium = 0;
        const allAllergens = new Set<string>();

        Object.values(selectedRecipes)
          .flat()
          .forEach((selectedRecipe) => {
            const recipe = recipesById.get(selectedRecipe.recipeId);
            if (!recipe) return;

            const quantity = selectedRecipe.quantity;
            const nutritionalValues = (recipe as any).nutritionalValues as INRANNutritionalValues;

            if (nutritionalValues) {
              totalEnergy += (nutritionalValues.energy_kcal || 0) * quantity;
              totalEnergyKj += (nutritionalValues.energy_kj || 0) * quantity;
              totalProtein += (nutritionalValues.protein || 0) * quantity;
              totalCarbs += (nutritionalValues.carbohydrates || 0) * quantity;
              totalFats += (nutritionalValues.fats || 0) * quantity;
              totalFiber += (nutritionalValues.fiber || 0) * quantity;
              totalSodium += (nutritionalValues.sodium || 0) * quantity;
            }

            // Collect allergens
            if ((recipe as any).allergens && Array.isArray((recipe as any).allergens)) {
              (recipe as any).allergens.forEach((allergen: string) => {
                allAllergens.add(allergen.toLowerCase());
              });
            }
          });

        setNutrition({
          energy_kcal: Math.round(totalEnergy),
          energy_kj: Math.round(totalEnergyKj),
          protein: parseFloat(totalProtein.toFixed(1)),
          carbohydrates: parseFloat(totalCarbs.toFixed(1)),
          fats: parseFloat(totalFats.toFixed(1)),
          fiber: parseFloat(totalFiber.toFixed(1)),
          sodium: Math.round(totalSodium),
          salt: parseFloat((totalSodium / 1000 * 2.5).toFixed(1)),
          allergens: allAllergens,
        });
      } catch (error) {
        console.error('Error fetching nutritional data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNutritionalData();
  }, [selectedRecipes]);

  if (isLoading) {
    return (
      <Card className="p-6 bg-rbr-dark-elevated border-rbr-border">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-rbr-red" />
        </div>
      </Card>
    );
  }

  const totalRecipes = Object.values(selectedRecipes)
    .flat()
    .reduce((sum, r) => sum + r.quantity, 0);

  return (
    <Card className="p-6 bg-rbr-dark-elevated border-rbr-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-rbr-text-primary">
          Riepilogo Nutrizionale Menu
        </h3>
        {totalRecipes > 0 && (
          <Badge variant="outline" className="border-rbr-navy text-rbr-navy">
            {totalRecipes} ricette
          </Badge>
        )}
      </div>

      {totalRecipes === 0 ? (
        <div className="text-center py-12">
          <p className="text-rbr-text-muted">
            Aggiungi ricette al menu per vedere il riepilogo nutrizionale
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Nutrients Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Energy */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-rbr-text-secondary">Energia</span>
                <span className="text-lg font-semibold text-rbr-text-primary">
                  {nutrition.energy_kcal} kcal
                </span>
              </div>
              <Progress
                value={(nutrition.energy_kcal / DRI.energy_kcal) * 100}
                className="h-2"
              />
              <span className="text-xs text-rbr-text-muted">
                {Math.round((nutrition.energy_kcal / DRI.energy_kcal) * 100)}% DRI
              </span>
            </div>

            {/* kJ */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-rbr-text-secondary">Energia (kJ)</span>
                <span className="text-lg font-semibold text-rbr-text-primary">
                  {nutrition.energy_kj} kJ
                </span>
              </div>
              <Progress
                value={(nutrition.energy_kj / (DRI.energy_kcal * 4.184)) * 100}
                className="h-2"
              />
            </div>

            {/* Protein */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-rbr-text-secondary">Proteine</span>
                <span className="text-lg font-semibold text-rbr-text-primary">
                  {nutrition.protein} g
                </span>
              </div>
              <Progress
                value={(nutrition.protein / DRI.protein) * 100}
                className="h-2 [&>div]:bg-blue-500"
              />
              <span className="text-xs text-rbr-text-muted">
                {Math.round((nutrition.protein / DRI.protein) * 100)}% DRI
              </span>
            </div>

            {/* Carbohydrates */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-rbr-text-secondary">Carboidrati</span>
                <span className="text-lg font-semibold text-rbr-text-primary">
                  {nutrition.carbohydrates} g
                </span>
              </div>
              <Progress
                value={(nutrition.carbohydrates / DRI.carbohydrates) * 100}
                className="h-2 [&>div]:bg-yellow-500"
              />
              <span className="text-xs text-rbr-text-muted">
                {Math.round((nutrition.carbohydrates / DRI.carbohydrates) * 100)}% DRI
              </span>
            </div>

            {/* Fats */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-rbr-text-secondary">Grassi</span>
                <span className="text-lg font-semibold text-rbr-text-primary">
                  {nutrition.fats} g
                </span>
              </div>
              <Progress
                value={(nutrition.fats / DRI.fats) * 100}
                className="h-2 [&>div]:bg-orange-500"
              />
              <span className="text-xs text-rbr-text-muted">
                {Math.round((nutrition.fats / DRI.fats) * 100)}% DRI
              </span>
            </div>

            {/* Fiber */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-rbr-text-secondary">Fibre</span>
                <span className="text-lg font-semibold text-rbr-text-primary">
                  {nutrition.fiber} g
                </span>
              </div>
              <Progress
                value={(nutrition.fiber / DRI.fiber) * 100}
                className="h-2 [&>div]:bg-green-500"
              />
              <span className="text-xs text-rbr-text-muted">
                {Math.round((nutrition.fiber / DRI.fiber) * 100)}% DRI
              </span>
            </div>
          </div>

          <Separator className="bg-rbr-border" />

          {/* Salt */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-rbr-text-secondary">Sale</span>
              <span className="text-lg font-semibold text-rbr-text-primary">
                {nutrition.salt} g
              </span>
            </div>
            <Progress
              value={(nutrition.salt / DRI.salt) * 100}
              className="h-2 [&>div]:bg-red-500"
            />
            <span className="text-xs text-rbr-text-muted">
              {Math.round((nutrition.salt / DRI.salt) * 100)}% DRI (max 6g/giorno)
            </span>
          </div>

          <Separator className="bg-rbr-border" />

          {/* Allergens Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <h4 className="font-semibold text-rbr-text-primary">Allergeni Presenti</h4>
            </div>
            {nutrition.allergens.size === 0 ? (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Nessun allergene dichiarato</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Array.from(nutrition.allergens).map((allergen) => (
                  <Badge
                    key={allergen}
                    className="bg-red-500/20 text-red-500 border-red-500/30 font-semibold"
                  >
                    {ALLERGEN_LABELS[allergen] || allergen.toUpperCase()}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="text-xs text-rbr-text-muted bg-rbr-dark/50 p-3 rounded">
            DRI = Daily Reference Intake (adulto medio 2000 kcal/giorno).
            Valori calcolati per 100g di porzione edibile.
          </div>
        </div>
      )}
    </Card>
  );
}
