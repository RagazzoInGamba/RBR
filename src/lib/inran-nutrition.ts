/**
 * Oracle Red Bull Racing - INRAN/CREA Nutritional Data Utilities
 *
 * Italian Nutritional Reference Standards
 * Based on CREA (Council for Agricultural Research and Economics)
 * and INRAN (National Institute for Research on Food and Nutrition)
 *
 * Data Standard: CREA Food Composition Tables (2019)
 * Reference: https://www.alimentinutrizione.it/tabelle-nutrizionali
 * Format: Per 100g edible portion
 *
 * EU Compliance: EU Regulation 1169/2011 (allergen labeling)
 */

/**
 * CREA/INRAN Nutritional Values
 * All values are per 100g of edible portion
 */
export interface INRANNutritionalValues {
  // ========== ENERGY ==========
  /** Energy in kilojoules (kJ) */
  energy_kj?: number;
  /** Energy in kilocalories (kcal) */
  energy_kcal?: number;

  // ========== PROXIMATES ==========
  /** Water content (g) */
  water?: number;
  /** Total protein (g) */
  protein?: number;
  /** Total carbohydrates (g) */
  carbohydrates?: number;
  /** Total fats (g) */
  fats?: number;
  /** Dietary fiber (g) */
  fiber?: number;
  /** Ash content (g) */
  ash?: number;

  // ========== MINERALS (13) ==========
  /** Calcium (mg) */
  calcium?: number;
  /** Iron (mg) */
  iron?: number;
  /** Zinc (mg) */
  zinc?: number;
  /** Magnesium (mg) */
  magnesium?: number;
  /** Phosphorus (mg) */
  phosphorus?: number;
  /** Potassium (mg) */
  potassium?: number;
  /** Sodium (mg) */
  sodium?: number;
  /** Copper (mg) */
  copper?: number;
  /** Selenium (μg) */
  selenium?: number;
  /** Iodine (μg) */
  iodine?: number;
  /** Manganese (mg) */
  manganese?: number;
  /** Fluoride (mg) */
  fluoride?: number;
  /** Chloride (mg) */
  chloride?: number;

  // ========== VITAMINS (15) ==========
  /** Vitamin A - Retinol equivalents (μg) */
  vitamin_a?: number;
  /** Beta-carotene (μg) */
  beta_carotene?: number;
  /** Vitamin B1 - Thiamine (mg) */
  vitamin_b1?: number;
  /** Vitamin B2 - Riboflavin (mg) */
  vitamin_b2?: number;
  /** Vitamin B3 - Niacin (mg) */
  vitamin_b3?: number;
  /** Vitamin B5 - Pantothenic acid (mg) */
  vitamin_b5?: number;
  /** Vitamin B6 - Pyridoxine (mg) */
  vitamin_b6?: number;
  /** Vitamin B12 - Cobalamin (μg) */
  vitamin_b12?: number;
  /** Folate (μg) */
  folate?: number;
  /** Vitamin C - Ascorbic acid (mg) */
  vitamin_c?: number;
  /** Vitamin D (μg) */
  vitamin_d?: number;
  /** Vitamin E - Tocopherol (mg) */
  vitamin_e?: number;
  /** Vitamin K (μg) */
  vitamin_k?: number;
  /** Biotin (μg) */
  biotin?: number;
  /** Choline (mg) */
  choline?: number;

  // ========== FATTY ACIDS ==========
  /** Saturated fatty acids (g) */
  saturated_fats?: number;
  /** Monounsaturated fatty acids (g) */
  monounsaturated_fats?: number;
  /** Polyunsaturated fatty acids (g) */
  polyunsaturated_fats?: number;
  /** Cholesterol (mg) */
  cholesterol?: number;
  /** Trans fatty acids (g) */
  trans_fats?: number;
  /** Omega-3 fatty acids (g) */
  omega_3?: number;
  /** Omega-6 fatty acids (g) */
  omega_6?: number;

  // ========== SUGARS (6 soluble) ==========
  /** Total sugars (g) */
  sugars?: number;
  /** Glucose (g) */
  glucose?: number;
  /** Fructose (g) */
  fructose?: number;
  /** Sucrose (g) */
  sucrose?: number;
  /** Lactose (g) */
  lactose?: number;
  /** Maltose (g) */
  maltose?: number;

  // ========== AMINO ACIDS (Essential) ==========
  amino_acids?: {
    /** Histidine (mg) */
    histidine?: number;
    /** Isoleucine (mg) */
    isoleucine?: number;
    /** Leucine (mg) */
    leucine?: number;
    /** Lysine (mg) */
    lysine?: number;
    /** Methionine (mg) */
    methionine?: number;
    /** Phenylalanine (mg) */
    phenylalanine?: number;
    /** Threonine (mg) */
    threonine?: number;
    /** Tryptophan (mg) */
    tryptophan?: number;
    /** Valine (mg) */
    valine?: number;
  };

  // ========== OTHER ==========
  /** Salt (g) - calculated as sodium * 2.5 */
  salt?: number;
  /** Alcohol (g) */
  alcohol?: number;
  /** Caffeine (mg) */
  caffeine?: number;
}

/**
 * EU Regulation 1169/2011 - 14 Major Allergens
 */
export const EU_ALLERGENS = [
  'glutine', // Gluten (cereals)
  'crostacei', // Crustaceans
  'uova', // Eggs
  'pesce', // Fish
  'arachidi', // Peanuts
  'soia', // Soybeans
  'latte', // Milk (including lactose)
  'frutta_a_guscio', // Tree nuts
  'sedano', // Celery
  'senape', // Mustard
  'sesamo', // Sesame seeds
  'anidride_solforosa', // Sulphur dioxide and sulphites
  'lupini', // Lupin
  'molluschi', // Molluscs
] as const;

export type EUAllergen = typeof EU_ALLERGENS[number];

/**
 * Nutritional Data Source
 */
export type NutritionalSource = 'INRAN' | 'CREA' | 'MANUAL' | 'CALCULATED';

/**
 * Calculate total energy from macronutrients (Atwater system)
 * @param protein Protein in grams
 * @param carbs Carbohydrates in grams
 * @param fats Fats in grams
 * @param alcohol Alcohol in grams (optional)
 * @returns Energy in kcal
 */
export function calculateEnergyKcal(
  protein: number,
  carbs: number,
  fats: number,
  alcohol: number = 0
): number {
  // Atwater factors: Protein=4, Carbs=4, Fat=9, Alcohol=7 kcal/g
  return Math.round(protein * 4 + carbs * 4 + fats * 9 + alcohol * 7);
}

/**
 * Convert kcal to kJ
 * @param kcal Energy in kilocalories
 * @returns Energy in kilojoules
 */
export function kcalToKJ(kcal: number): number {
  return Math.round(kcal * 4.184);
}

/**
 * Convert kJ to kcal
 * @param kj Energy in kilojoules
 * @returns Energy in kilocalories
 */
export function kjToKcal(kj: number): number {
  return Math.round(kj / 4.184);
}

/**
 * Calculate salt from sodium (EU regulation)
 * @param sodium Sodium in mg
 * @returns Salt in g
 */
export function calculateSalt(sodium: number): number {
  return parseFloat((sodium / 1000 * 2.5).toFixed(2));
}

/**
 * Calculate sodium from salt
 * @param salt Salt in g
 * @returns Sodium in mg
 */
export function calculateSodium(salt: number): number {
  return Math.round(salt / 2.5 * 1000);
}

/**
 * Scale nutritional values from 100g to specific portion size
 * @param values Nutritional values per 100g
 * @param portionGrams Portion size in grams
 * @returns Scaled nutritional values
 */
export function scaleToPortionSize(
  values: INRANNutritionalValues,
  portionGrams: number
): INRANNutritionalValues {
  const factor = portionGrams / 100;
  const scaled: INRANNutritionalValues = {};

  // Scale all numeric values
  Object.entries(values).forEach(([key, value]) => {
    if (typeof value === 'number') {
      scaled[key as keyof INRANNutritionalValues] = parseFloat((value * factor).toFixed(2)) as any;
    } else if (key === 'amino_acids' && value) {
      // Scale amino acids object
      const scaledAminos: any = {};
      Object.entries(value).forEach(([aminoKey, aminoValue]) => {
        if (typeof aminoValue === 'number') {
          scaledAminos[aminoKey] = parseFloat((aminoValue * factor).toFixed(2));
        }
      });
      scaled.amino_acids = scaledAminos;
    }
  });

  return scaled;
}

/**
 * Sum nutritional values from multiple ingredients
 * @param ingredients Array of {values: INRANNutritionalValues, weight: number}
 * @returns Combined nutritional values per 100g
 */
export function sumNutritionalValues(
  ingredients: Array<{ values: INRANNutritionalValues; weight: number }>
): INRANNutritionalValues {
  const totalWeight = ingredients.reduce((sum, ing) => sum + ing.weight, 0);
  const combined: INRANNutritionalValues = {};

  // Combine all numeric values weighted by ingredient weight
  ingredients.forEach(({ values, weight }) => {
    const scaledValues = scaleToPortionSize(values, weight);

    Object.entries(scaledValues).forEach(([key, value]) => {
      if (typeof value === 'number') {
        const currentValue = (combined[key as keyof INRANNutritionalValues] as number) || 0;
        (combined[key as keyof INRANNutritionalValues] as any) = currentValue + value;
      }
    });
  });

  // Scale back to per 100g
  return scaleToPortionSize(combined, 10000 / totalWeight);
}

/**
 * Validate nutritional values
 * @param values Nutritional values to validate
 * @returns Validation result with errors
 */
export function validateNutritionalValues(values: INRANNutritionalValues): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Energy validation
  if (values.energy_kcal && values.energy_kj) {
    const calculatedKJ = kcalToKJ(values.energy_kcal);
    const diff = Math.abs(calculatedKJ - values.energy_kj);
    if (diff > 10) {
      errors.push(`Energy mismatch: ${values.energy_kcal} kcal ≠ ${values.energy_kj} kJ`);
    }
  }

  // Macronutrients should sum to ~100g (accounting for water, ash, fiber)
  const totalMacros =
    (values.protein || 0) +
    (values.carbohydrates || 0) +
    (values.fats || 0) +
    (values.water || 0) +
    (values.fiber || 0) +
    (values.ash || 0);

  if (totalMacros > 105) {
    errors.push(`Total macronutrients exceed 100g: ${totalMacros.toFixed(1)}g`);
  }

  // Fatty acids should not exceed total fats
  if (values.fats) {
    const totalFattyAcids =
      (values.saturated_fats || 0) +
      (values.monounsaturated_fats || 0) +
      (values.polyunsaturated_fats || 0);

    if (totalFattyAcids > values.fats * 1.1) {
      errors.push(`Total fatty acids (${totalFattyAcids.toFixed(1)}g) exceed total fats (${values.fats}g)`);
    }
  }

  // Sugars should not exceed carbohydrates
  if (values.carbohydrates && values.sugars && values.sugars > values.carbohydrates) {
    errors.push(`Sugars (${values.sugars}g) exceed carbohydrates (${values.carbohydrates}g)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format nutritional value for display
 * @param value Numeric value
 * @param unit Unit (g, mg, μg, kcal, kJ)
 * @param decimals Number of decimal places
 * @returns Formatted string
 */
export function formatNutritionalValue(
  value: number | undefined,
  unit: string,
  decimals: number = 1
): string {
  if (value === undefined || value === null) return '-';
  return `${value.toFixed(decimals)} ${unit}`;
}

/**
 * Get nutrition label data (EU format)
 * Returns the standard nutrition facts table data
 */
export function getNutritionLabel(values: INRANNutritionalValues) {
  return {
    energia: {
      kj: values.energy_kj || 0,
      kcal: values.energy_kcal || 0,
    },
    grassi: {
      totali: values.fats || 0,
      saturi: values.saturated_fats || 0,
    },
    carboidrati: {
      totali: values.carbohydrates || 0,
      zuccheri: values.sugars || 0,
    },
    proteine: values.protein || 0,
    sale: values.salt || calculateSalt(values.sodium || 0),
    fibre: values.fiber,
  };
}

/**
 * Example nutritional values for common Italian foods
 * Use these as templates for creating recipes
 */
export const EXAMPLE_NUTRITIONAL_VALUES: Record<string, INRANNutritionalValues> = {
  pasta_secca: {
    energy_kcal: 371,
    energy_kj: 1553,
    water: 10.9,
    protein: 11.7,
    carbohydrates: 75.2,
    fats: 1.4,
    fiber: 2.9,
    sodium: 3,
  },
  pollo_petto: {
    energy_kcal: 110,
    energy_kj: 460,
    water: 75.0,
    protein: 23.3,
    carbohydrates: 0,
    fats: 1.2,
    fiber: 0,
    sodium: 63,
    cholesterol: 69,
  },
  olio_oliva: {
    energy_kcal: 884,
    energy_kj: 3700,
    water: 0,
    protein: 0,
    carbohydrates: 0,
    fats: 100,
    fiber: 0,
    sodium: 0,
    vitamin_e: 22.4,
  },
};
