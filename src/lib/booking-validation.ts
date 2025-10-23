/**
 * Red Bull Racing - Booking Validation Utilities
 * Granular validation per category based on BookingRules
 */

import { PrismaClient, MealType, RecipeCategory } from '@prisma/client';

const prisma = new PrismaClient();

export interface BookingItemInput {
  recipeId: string;
  recipeName: string;
  recipeCategory: RecipeCategory;
  quantity: number;
  unitPrice: number;
}

export interface ValidationError {
  category: RecipeCategory;
  message: string;
  min?: number;
  max?: number;
  current: number;
}

/**
 * Validate booking items against BookingRules for a specific meal type
 */
export async function validateBookingItems(
  mealType: MealType,
  items: BookingItemInput[]
): Promise<{ valid: boolean; errors: ValidationError[] }> {
  const errors: ValidationError[] = [];

  // Fetch active booking rules for this meal type
  const rules = await prisma.bookingRule.findMany({
    where: {
      mealType,
      isActive: true,
    },
  });

  if (rules.length === 0) {
    // No rules defined - allow anything
    return { valid: true, errors: [] };
  }

  // Group items by category (for future use)
  // const itemsByCategory = items.reduce((acc, item) => {
  //   if (!acc[item.recipeCategory]) {
  //     acc[item.recipeCategory] = [];
  //   }
  //   acc[item.recipeCategory].push(item);
  //   return acc;
  // }, {} as Record<RecipeCategory, BookingItemInput[]>);

  // Calculate total quantity per category
  const categoryCounts = items.reduce((acc, item) => {
    acc[item.recipeCategory] = (acc[item.recipeCategory] || 0) + item.quantity;
    return acc;
  }, {} as Record<RecipeCategory, number>);

  // Validate each rule
  for (const rule of rules) {
    const count = categoryCounts[rule.category] || 0;

    // Check minimum requirement
    if (rule.isRequired && count < rule.minQuantity) {
      errors.push({
        category: rule.category,
        message: `${getCategoryName(rule.category)}: minimo ${rule.minQuantity} richiesto${
          rule.minQuantity > 1 ? '' : ''
        }, selezionato ${count}`,
        min: rule.minQuantity,
        current: count,
      });
    }

    // Check maximum limit
    if (count > rule.maxQuantity) {
      errors.push({
        category: rule.category,
        message: `${getCategoryName(rule.category)}: massimo ${rule.maxQuantity} consentito${
          rule.maxQuantity > 1 ? '' : ''
        }, selezionato ${count}`,
        max: rule.maxQuantity,
        current: count,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get human-readable category name in Italian
 */
function getCategoryName(category: RecipeCategory): string {
  const names: Record<RecipeCategory, string> = {
    APPETIZER: 'Antipasto',
    FIRST_COURSE: 'Primo',
    SECOND_COURSE: 'Secondo',
    SIDE_DISH: 'Contorno',
    DESSERT: 'Dessert',
    BEVERAGE: 'Bevanda',
    EXTRA: 'Extra',
  };
  return names[category] || category;
}

/**
 * Get booking rules for a specific meal type (for frontend display)
 */
export async function getBookingRules(mealType: MealType) {
  const rules = await prisma.bookingRule.findMany({
    where: {
      mealType,
      isActive: true,
    },
    orderBy: {
      category: 'asc',
    },
  });

  return rules.map(rule => ({
    ...rule,
    categoryName: getCategoryName(rule.category),
  }));
}

/**
 * Calculate total price from items
 */
export function calculateTotalPrice(items: BookingItemInput[]): number {
  return items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
}

/**
 * Validate total price matches items
 */
export function validateTotalPrice(items: BookingItemInput[], totalPrice: number): boolean {
  const calculated = calculateTotalPrice(items);
  return calculated === totalPrice;
}

