/**
 * Unit tests for booking validation logic
 * Critical business logic - ensures correct calculations and validations
 */

import {
  calculateTotalPrice,
  validateTotalPrice,
  BookingItemInput
} from '../booking-validation';
import { RecipeCategory } from '@prisma/client';

describe('Booking Validation Module', () => {
  describe('calculateTotalPrice', () => {
    it('should calculate correct total for single item', () => {
      const items: BookingItemInput[] = [
        {
          recipeId: 'r1',
          recipeName: 'Pasta Carbonara',
          recipeCategory: 'FIRST_COURSE' as RecipeCategory,
          quantity: 2,
          unitPrice: 1000
        }
      ];

      const total = calculateTotalPrice(items);
      expect(total).toBe(2000); // 2 * 1000
    });

    it('should calculate correct total for multiple items', () => {
      const items: BookingItemInput[] = [
        {
          recipeId: 'r1',
          recipeName: 'Antipasto',
          recipeCategory: 'APPETIZER' as RecipeCategory,
          quantity: 2,
          unitPrice: 1000
        },
        {
          recipeId: 'r2',
          recipeName: 'Primo',
          recipeCategory: 'FIRST_COURSE' as RecipeCategory,
          quantity: 1,
          unitPrice: 500
        },
        {
          recipeId: 'r3',
          recipeName: 'Secondo',
          recipeCategory: 'SECOND_COURSE' as RecipeCategory,
          quantity: 3,
          unitPrice: 750
        },
      ];

      const total = calculateTotalPrice(items);
      expect(total).toBe(4750); // (2*1000) + (1*500) + (3*750)
    });

    it('should return 0 for empty items array', () => {
      const total = calculateTotalPrice([]);
      expect(total).toBe(0);
    });

    it('should handle large quantities correctly', () => {
      const items: BookingItemInput[] = [
        {
          recipeId: 'r1',
          recipeName: 'Bulk Order',
          recipeCategory: 'FIRST_COURSE' as RecipeCategory,
          quantity: 100,
          unitPrice: 500
        }
      ];

      const total = calculateTotalPrice(items);
      expect(total).toBe(50000);
    });

    it('should handle decimal prices in cents correctly', () => {
      const items: BookingItemInput[] = [
        {
          recipeId: 'r1',
          recipeName: 'Dish',
          recipeCategory: 'FIRST_COURSE' as RecipeCategory,
          quantity: 1,
          unitPrice: 1250 // €12.50 in cents
        }
      ];

      const total = calculateTotalPrice(items);
      expect(total).toBe(1250);
    });

    it('should sum complex order correctly', () => {
      const items: BookingItemInput[] = [
        {
          recipeId: 'r1',
          recipeName: 'Antipasto Misto',
          recipeCategory: 'APPETIZER' as RecipeCategory,
          quantity: 1,
          unitPrice: 850
        },
        {
          recipeId: 'r2',
          recipeName: 'Risotto',
          recipeCategory: 'FIRST_COURSE' as RecipeCategory,
          quantity: 2,
          unitPrice: 1500
        },
        {
          recipeId: 'r3',
          recipeName: 'Tiramisu',
          recipeCategory: 'DESSERT' as RecipeCategory,
          quantity: 1,
          unitPrice: 650
        },
        {
          recipeId: 'r4',
          recipeName: 'Water',
          recipeCategory: 'BEVERAGE' as RecipeCategory,
          quantity: 3,
          unitPrice: 300
        },
      ];

      const total = calculateTotalPrice(items);
      expect(total).toBe(5400); // 850 + 3000 + 650 + 900
    });

    it('should handle all recipe categories', () => {
      const items: BookingItemInput[] = [
        { recipeId: 'r1', recipeName: 'Test1', recipeCategory: 'APPETIZER' as RecipeCategory, quantity: 1, unitPrice: 500 },
        { recipeId: 'r2', recipeName: 'Test2', recipeCategory: 'FIRST_COURSE' as RecipeCategory, quantity: 1, unitPrice: 500 },
        { recipeId: 'r3', recipeName: 'Test3', recipeCategory: 'SECOND_COURSE' as RecipeCategory, quantity: 1, unitPrice: 500 },
        { recipeId: 'r4', recipeName: 'Test4', recipeCategory: 'SIDE_DISH' as RecipeCategory, quantity: 1, unitPrice: 500 },
        { recipeId: 'r5', recipeName: 'Test5', recipeCategory: 'DESSERT' as RecipeCategory, quantity: 1, unitPrice: 500 },
        { recipeId: 'r6', recipeName: 'Test6', recipeCategory: 'BEVERAGE' as RecipeCategory, quantity: 1, unitPrice: 500 },
        { recipeId: 'r7', recipeName: 'Test7', recipeCategory: 'EXTRA' as RecipeCategory, quantity: 1, unitPrice: 500 },
      ];

      const total = calculateTotalPrice(items);
      expect(total).toBe(3500); // 7 * 500
    });

    it('should handle zero price items', () => {
      const items: BookingItemInput[] = [
        {
          recipeId: 'r1',
          recipeName: 'Free Item',
          recipeCategory: 'EXTRA' as RecipeCategory,
          quantity: 5,
          unitPrice: 0
        }
      ];

      const total = calculateTotalPrice(items);
      expect(total).toBe(0);
    });

    it('should handle mixed zero and non-zero prices', () => {
      const items: BookingItemInput[] = [
        { recipeId: 'r1', recipeName: 'Free', recipeCategory: 'EXTRA' as RecipeCategory, quantity: 2, unitPrice: 0 },
        { recipeId: 'r2', recipeName: 'Paid', recipeCategory: 'FIRST_COURSE' as RecipeCategory, quantity: 1, unitPrice: 1000 },
      ];

      const total = calculateTotalPrice(items);
      expect(total).toBe(1000);
    });

    it('should handle quantity of 0 (edge case)', () => {
      const items: BookingItemInput[] = [
        { recipeId: 'r1', recipeName: 'Test', recipeCategory: 'FIRST_COURSE' as RecipeCategory, quantity: 0, unitPrice: 1000 }
      ];

      const total = calculateTotalPrice(items);
      expect(total).toBe(0);
    });
  });

  describe('validateTotalPrice', () => {
    it('should return true for matching price', () => {
      const items: BookingItemInput[] = [
        { recipeId: 'r1', recipeName: 'Test', recipeCategory: 'FIRST_COURSE' as RecipeCategory, quantity: 2, unitPrice: 1000 }
      ];

      const isValid = validateTotalPrice(items, 2000);
      expect(isValid).toBe(true);
    });

    it('should return false for mismatched price', () => {
      const items: BookingItemInput[] = [
        { recipeId: 'r1', recipeName: 'Test', recipeCategory: 'FIRST_COURSE' as RecipeCategory, quantity: 2, unitPrice: 1000 }
      ];

      const isValid = validateTotalPrice(items, 1500);
      expect(isValid).toBe(false);
    });

    it('should return true for empty items with zero total', () => {
      const isValid = validateTotalPrice([], 0);
      expect(isValid).toBe(true);
    });

    it('should return false for empty items with non-zero total', () => {
      const isValid = validateTotalPrice([], 1000);
      expect(isValid).toBe(false);
    });

    it('should validate complex order correctly', () => {
      const items: BookingItemInput[] = [
        { recipeId: 'r1', recipeName: 'A', recipeCategory: 'APPETIZER' as RecipeCategory, quantity: 1, unitPrice: 850 },
        { recipeId: 'r2', recipeName: 'B', recipeCategory: 'FIRST_COURSE' as RecipeCategory, quantity: 2, unitPrice: 1500 },
        { recipeId: 'r3', recipeName: 'C', recipeCategory: 'DESSERT' as RecipeCategory, quantity: 1, unitPrice: 650 },
      ];

      expect(validateTotalPrice(items, 4000)).toBe(false);  // Wrong total
      expect(validateTotalPrice(items, 4500)).toBe(true);   // ✅ correct: 850 + 3000 + 650 = 4500
      expect(validateTotalPrice(items, 5000)).toBe(false);
    });

    it('should detect off-by-one errors', () => {
      const items: BookingItemInput[] = [
        { recipeId: 'r1', recipeName: 'Test', recipeCategory: 'FIRST_COURSE' as RecipeCategory, quantity: 1, unitPrice: 1000 }
      ];

      expect(validateTotalPrice(items, 999)).toBe(false);
      expect(validateTotalPrice(items, 1000)).toBe(true);
      expect(validateTotalPrice(items, 1001)).toBe(false);
    });

    it('should handle large totals', () => {
      const items: BookingItemInput[] = [
        { recipeId: 'r1', recipeName: 'Bulk', recipeCategory: 'FIRST_COURSE' as RecipeCategory, quantity: 100, unitPrice: 2000 }
      ];

      expect(validateTotalPrice(items, 200000)).toBe(true);
      expect(validateTotalPrice(items, 200001)).toBe(false);
    });
  });

  describe('BookingItemInput structure', () => {
    it('should accept valid item with all required fields', () => {
      const item: BookingItemInput = {
        recipeId: 'recipe-123',
        recipeName: 'Pasta Carbonara',
        recipeCategory: 'FIRST_COURSE' as RecipeCategory,
        quantity: 2,
        unitPrice: 1250
      };

      expect(item.recipeId).toBe('recipe-123');
      expect(item.recipeName).toBe('Pasta Carbonara');
      expect(item.recipeCategory).toBe('FIRST_COURSE');
      expect(item.quantity).toBe(2);
      expect(item.unitPrice).toBe(1250);
    });

    it('should handle all valid recipe categories', () => {
      const categories: RecipeCategory[] = [
        'APPETIZER',
        'FIRST_COURSE',
        'SECOND_COURSE',
        'SIDE_DISH',
        'DESSERT',
        'BEVERAGE',
        'EXTRA'
      ];

      categories.forEach(category => {
        const item: BookingItemInput = {
          recipeId: `r-${category}`,
          recipeName: `Test ${category}`,
          recipeCategory: category,
          quantity: 1,
          unitPrice: 1000
        };

        expect(item.recipeCategory).toBe(category);
      });
    });
  });
});
