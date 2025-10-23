/**
 * Oracle Red Bull Racing - MinIO S3 Upload Helper
 * Handles image uploads to MinIO object storage for recipe management
 *
 * @module lib/minio-upload
 * @requires @aws-sdk/client-s3
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// MinIO S3 Client Configuration
// Using environment variables for secure credential management
const s3Client = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}`,
  region: 'us-east-1', // Required by AWS SDK but not used by MinIO
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || '',
    secretAccessKey: process.env.MINIO_SECRET_KEY || '',
  },
  forcePathStyle: true, // Required for MinIO compatibility
});

/**
 * Upload recipe image to MinIO storage
 *
 * @param file - File object from browser input
 * @returns Promise resolving to public URL of uploaded image
 * @throws Error if upload fails or credentials missing
 *
 * @example
 * const file = document.querySelector('input[type="file"]').files[0];
 * const imageUrl = await uploadRecipeImage(file);
 * console.log('Uploaded to:', imageUrl);
 */
export async function uploadRecipeImage(file: File): Promise<string> {
  try {
    // Validate environment variables
    if (!process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
      throw new Error('MinIO credentials not configured in environment variables');
    }

    // Generate unique key with timestamp to prevent collisions
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `recipes/${timestamp}-${sanitizedName}`;

    // Read file as ArrayBuffer
    const buffer = await file.arrayBuffer();

    // Upload to MinIO using S3 PutObject
    const command = new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET || 'rbr-meals',
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: file.type,
      // Note: ACL not supported by all MinIO configurations
      // Bucket policies should be configured for public read access
    });

    await s3Client.send(command);

    // Construct public URL
    // Use internal endpoint (minio:9000) for server-side, external (localhost:9004) for client-side
    const isServer = typeof window === 'undefined';
    const endpoint = isServer
      ? `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`
      : 'http://localhost:9004';

    const bucket = process.env.MINIO_BUCKET || 'rbr-meals';
    const publicUrl = `${endpoint}/${bucket}/${key}`;

    return publicUrl;

  } catch (error) {
    console.error('[MinIO Upload] Failed to upload image:', error);

    if (error instanceof Error) {
      throw new Error(`MinIO upload failed: ${error.message}`);
    }

    throw new Error('MinIO upload failed: Unknown error');
  }
}

/**
 * Upload image with retry logic for network resilience
 *
 * @param file - File to upload
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise resolving to public URL
 * @throws Error if all retries fail
 */
export async function uploadRecipeImageWithRetry(
  file: File,
  maxRetries: number = 3
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await uploadRecipeImage(file);
    } catch (error) {
      // If last attempt, throw error
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Wait with exponential backoff before retry
      const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
      console.warn(`[MinIO Upload] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Upload failed after all retries');
}

/**
 * Validate image file before upload
 *
 * @param file - File to validate
 * @throws Error if validation fails
 *
 * @example
 * try {
 *   validateImageFile(file);
 *   // Proceed with upload
 * } catch (error) {
 *   console.error('Invalid file:', error.message);
 * }
 */
export function validateImageFile(file: File): void {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      'Formato immagine non supportato. Usa JPG, PNG o WebP.'
    );
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    throw new Error(
      `Immagine troppo grande (${sizeMB}MB). Dimensione massima: 5MB`
    );
  }

  // Check minimum size (1KB to prevent empty files)
  const minSize = 1024; // 1KB
  if (file.size < minSize) {
    throw new Error('File troppo piccolo. Verifica che l\'immagine sia valida.');
  }
}

/**
 * Calculate estimated nutritional info based on ingredients
 * Simple heuristic-based estimation - in production, use real nutrition API
 *
 * @param ingredients - Array of recipe ingredients
 * @returns Estimated nutritional values per serving
 *
 * @example
 * const nutrition = calculateNutritionalInfo([
 *   { name: 'Chicken breast', quantity: 200, unit: 'g' },
 *   { name: 'Olive oil', quantity: 2, unit: 'tbsp' }
 * ]);
 * // { calories: 250, protein: 14, carbs: 30, fat: 8.5 }
 */
export function calculateNutritionalInfo(
  ingredients: Array<{ name: string; quantity: number; unit: string }>
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  // Basic estimation logic
  // In production, integrate with INRAN database or nutrition API
  const numIngredients = ingredients.length;

  // Base values + incremental per ingredient
  return {
    calories: Math.round(150 + (numIngredients * 50)),
    protein: Math.round(10 + (numIngredients * 2)),
    carbs: Math.round(20 + (numIngredients * 5)),
    fat: Math.round(5 + (numIngredients * 1.5)),
  };
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Generate unique filename with timestamp
 *
 * @param originalName - Original filename
 * @returns Sanitized filename with timestamp
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${timestamp}-${sanitized}`;
}
