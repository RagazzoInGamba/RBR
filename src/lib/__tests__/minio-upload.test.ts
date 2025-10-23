/**
 * Unit tests for MinIO upload utilities
 * File validation and nutritional calculations
 */

import {
  validateImageFile,
  calculateNutritionalInfo,
  formatFileSize,
  generateUniqueFilename
} from '../minio-upload';

// Mock File API for Node environment
if (typeof File === 'undefined') {
  global.File = class MockFile {
    name: string;
    type: string;
    size: number;

    constructor(_bits: any[], name: string, options: any = {}) {
      this.name = name;
      this.type = options.type || '';
      this.size = options.size || 0;
    }
  } as any;
}

describe('MinIO Upload Utilities', () => {
  describe('validateImageFile', () => {
    it('should accept valid JPEG file under 5MB', () => {
      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      expect(() => validateImageFile(file)).not.toThrow();
    });

    it('should accept valid PNG file', () => {
      const file = new File(['dummy'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 }); // 2MB

      expect(() => validateImageFile(file)).not.toThrow();
    });

    it('should accept valid WebP file', () => {
      const file = new File(['dummy'], 'test.webp', { type: 'image/webp' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      expect(() => validateImageFile(file)).not.toThrow();
    });

    it('should accept valid JPG extension', () => {
      const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpg' });
      Object.defineProperty(file, 'size', { value: 500 * 1024 }); // 500KB

      expect(() => validateImageFile(file)).not.toThrow();
    });

    it('should reject file larger than 5MB', () => {
      const file = new File(['dummy'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }); // 6MB

      expect(() => validateImageFile(file)).toThrow('troppo grande');
    });

    it('should reject file exactly at 5MB limit + 1 byte', () => {
      const file = new File(['dummy'], 'exact.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: (5 * 1024 * 1024) + 1 });

      expect(() => validateImageFile(file)).toThrow();
    });

    it('should reject unsupported file type (PDF)', () => {
      const file = new File(['dummy'], 'doc.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      expect(() => validateImageFile(file)).toThrow('non supportato');
    });

    it('should reject GIF format', () => {
      const file = new File(['dummy'], 'anim.gif', { type: 'image/gif' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      expect(() => validateImageFile(file)).toThrow();
    });

    it('should reject SVG format', () => {
      const file = new File(['dummy'], 'vector.svg', { type: 'image/svg+xml' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      expect(() => validateImageFile(file)).toThrow();
    });

    it('should accept file at exactly 5MB (edge case)', () => {
      const file = new File(['dummy'], 'exact5mb.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // Exactly 5MB

      expect(() => validateImageFile(file)).not.toThrow();
    });

    it('should reject file smaller than 1KB', () => {
      const file = new File(['x'], 'tiny.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 500 }); // 500 bytes

      expect(() => validateImageFile(file)).toThrow('troppo piccolo');
    });

    it('should accept file at exactly 1KB minimum', () => {
      const file = new File(['x'], 'min.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 }); // 1KB

      expect(() => validateImageFile(file)).not.toThrow();
    });
  });

  describe('calculateNutritionalInfo', () => {
    it('should calculate info for single ingredient', () => {
      const ingredients = [
        { name: 'Flour', quantity: 200, unit: 'g' }
      ];

      const info = calculateNutritionalInfo(ingredients);

      expect(info).toHaveProperty('calories');
      expect(info).toHaveProperty('protein');
      expect(info).toHaveProperty('carbs');
      expect(info).toHaveProperty('fat');
      expect(info.calories).toBeGreaterThan(0);
      expect(typeof info.calories).toBe('number');
    });

    it('should scale calories with number of ingredients', () => {
      const fewIngredients = [
        { name: 'Flour', quantity: 100, unit: 'g' }
      ];

      const manyIngredients = [
        { name: 'Flour', quantity: 100, unit: 'g' },
        { name: 'Eggs', quantity: 2, unit: 'pcs' },
        { name: 'Milk', quantity: 200, unit: 'ml' },
        { name: 'Sugar', quantity: 50, unit: 'g' },
        { name: 'Butter', quantity: 30, unit: 'g' },
      ];

      const infoFew = calculateNutritionalInfo(fewIngredients);
      const infoMany = calculateNutritionalInfo(manyIngredients);

      expect(infoMany.calories).toBeGreaterThan(infoFew.calories);
      expect(infoMany.protein).toBeGreaterThan(infoFew.protein);
      expect(infoMany.carbs).toBeGreaterThan(infoFew.carbs);
      expect(infoMany.fat).toBeGreaterThan(infoFew.fat);
    });

    it('should return base values for empty ingredients array', () => {
      const info = calculateNutritionalInfo([]);

      expect(info.calories).toBe(150); // Base value
      expect(info.protein).toBe(10);
      expect(info.carbs).toBe(20);
      expect(info.fat).toBe(5);
    });

    it('should return reasonable values for typical recipe', () => {
      const ingredients = [
        { name: 'Chicken', quantity: 200, unit: 'g' },
        { name: 'Rice', quantity: 150, unit: 'g' },
        { name: 'Vegetables', quantity: 100, unit: 'g' },
      ];

      const info = calculateNutritionalInfo(ingredients);

      // Reasonable ranges for a meal
      expect(info.calories).toBeGreaterThanOrEqual(100);
      expect(info.calories).toBeLessThanOrEqual(1000);
      expect(info.protein).toBeGreaterThanOrEqual(5);
      expect(info.protein).toBeLessThanOrEqual(100);
      expect(info.carbs).toBeGreaterThanOrEqual(10);
      expect(info.fat).toBeGreaterThanOrEqual(5);
    });

    it('should handle recipe with many ingredients', () => {
      const ingredients = Array.from({ length: 10 }, (_, i) => ({
        name: `Ingredient ${i + 1}`,
        quantity: 50,
        unit: 'g'
      }));

      const info = calculateNutritionalInfo(ingredients);

      expect(info.calories).toBeGreaterThan(0);
      expect(info.protein).toBeGreaterThan(0);
      expect(info.carbs).toBeGreaterThan(0);
      expect(info.fat).toBeGreaterThan(0);
    });

    it('should return consistent values for same input', () => {
      const ingredients = [
        { name: 'Pasta', quantity: 100, unit: 'g' },
        { name: 'Tomato Sauce', quantity: 50, unit: 'ml' }
      ];

      const info1 = calculateNutritionalInfo(ingredients);
      const info2 = calculateNutritionalInfo(ingredients);

      expect(info1.calories).toBe(info2.calories);
      expect(info1.protein).toBe(info2.protein);
      expect(info1.carbs).toBe(info2.carbs);
      expect(info1.fat).toBe(info2.fat);
    });

    it('should calculate expected values based on formula', () => {
      const ingredients = [
        { name: 'Test1', quantity: 100, unit: 'g' },
        { name: 'Test2', quantity: 100, unit: 'g' },
        { name: 'Test3', quantity: 100, unit: 'g' },
      ];

      const info = calculateNutritionalInfo(ingredients);

      // Formula: base + (numIngredients * multiplier)
      expect(info.calories).toBe(150 + (3 * 50)); // 300
      expect(info.protein).toBe(10 + (3 * 2));    // 16
      expect(info.carbs).toBe(20 + (3 * 5));      // 35
      expect(info.fat).toBe(Math.round(5 + (3 * 1.5)));  // 10 (rounded from 9.5)
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1)).toBe('1 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });

    it('should format KB correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10240)).toBe('10 KB');
    });

    it('should format MB correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
    });

    it('should format GB correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
    });

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1234567)).toContain('1.18 MB'); // 1.17738... MB
    });
  });

  describe('generateUniqueFilename', () => {
    it('should add timestamp to filename', () => {
      const original = 'test.jpg';
      const unique = generateUniqueFilename(original);

      expect(unique).toContain('test.jpg');
      expect(unique).toMatch(/^\d+-test\.jpg$/);
    });

    it('should sanitize special characters', () => {
      const original = 'my photo (1).jpg';
      const unique = generateUniqueFilename(original);

      expect(unique).toMatch(/^\d+-my_photo__1_\.jpg$/);
    });

    it('should handle spaces', () => {
      const original = 'recipe image.png';
      const unique = generateUniqueFilename(original);

      expect(unique).toContain('recipe_image.png');
    });

    it('should preserve extension', () => {
      const original = 'file.webp';
      const unique = generateUniqueFilename(original);

      expect(unique).toMatch(/\.webp$/);
    });

    it('should generate different filenames for same input', (done) => {
      const original = 'test.jpg';
      const unique1 = generateUniqueFilename(original);

      setTimeout(() => {
        const unique2 = generateUniqueFilename(original);
        expect(unique1).not.toBe(unique2);
        done();
      }, 10);
    });

    it('should handle filename without extension', () => {
      const original = 'noextension';
      const unique = generateUniqueFilename(original);

      expect(unique).toMatch(/^\d+-noextension$/);
    });

    it('should handle multiple dots in filename', () => {
      const original = 'my.file.name.jpg';
      const unique = generateUniqueFilename(original);

      expect(unique).toMatch(/^\d+-my\.file\.name\.jpg$/);
    });
  });
});
