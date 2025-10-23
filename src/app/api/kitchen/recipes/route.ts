/**
 * Oracle Red Bull Racing - Recipe Management API
 * Kitchen Admin CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

const createRecipeSchema = z.object({
  name: z.string().min(1, 'Nome richiesto'),
  description: z.string().optional(),
  category: z.enum(['APPETIZER', 'FIRST_COURSE', 'SECOND_COURSE', 'SIDE_DISH', 'DESSERT', 'BEVERAGE', 'EXTRA']),
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.number().positive(),
    unit: z.string(),
    inranCode: z.string().optional(),
  })),
  instructions: z.string().min(1, 'Istruzioni richieste'),
  prepTime: z.number().int().positive(),
  cookTime: z.number().int().positive(),
  servings: z.number().int().positive(),
  portionSize: z.number().int().positive().optional(), // grams per portion
  calories: z.number().int().positive().optional(),
  allergens: z.array(z.string()).optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  // MinIO image URL
  imageUrl: z.string().url('URL immagine non valido').optional(),
  // INRAN nutritional data (per 100g)
  nutritionalValues: z.record(z.union([z.number(), z.record(z.number())])).optional(),
  inranCode: z.string().optional(),
  nutritionalSource: z.enum(['INRAN', 'CREA', 'MANUAL', 'CALCULATED']).optional(),
});

/**
 * GET /api/kitchen/recipes
 * List all recipes with filtering
 */
export async function GET(request: NextRequest) {
  // Rate limiting: MODERATE (30 req/min)
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    if (!['SUPER_ADMIN', 'KITCHEN_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isAvailable = searchParams.get('isAvailable');
    const nutritionalSource = searchParams.get('nutritionalSource');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isAvailable) {
      where.isAvailable = isAvailable === 'true';
    }
    if (nutritionalSource) {
      where.nutritionalSource = nutritionalSource;
    }

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.recipe.count({ where }),
    ]);

    return NextResponse.json({
      recipes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('[API] Recipe list error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * POST /api/kitchen/recipes
 * Create new recipe
 */
export async function POST(request: NextRequest) {
  // Rate limiting: MODERATE (30 req/min)
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    if (!['SUPER_ADMIN', 'KITCHEN_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createRecipeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const recipe = await prisma.recipe.create({
      data: {
        ...data,
        allergens: data.allergens || [],
        createdBy: session.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'recipe.created',
        entity: 'Recipe',
        entityId: recipe.id,
        changes: { name: recipe.name, category: recipe.category },
      },
    });

    return NextResponse.json(
      { message: 'Ricetta creata con successo', recipe },
      { status: 201 }
    );
  } catch (error) {
    logger.error('[API] Recipe creation error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}









