/**
 * Oracle Red Bull Racing - Recipe Management API (Single Recipe)
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

const updateRecipeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['APPETIZER', 'FIRST_COURSE', 'SECOND_COURSE', 'SIDE_DISH', 'DESSERT', 'BEVERAGE', 'EXTRA']).optional(),
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.number().positive(),
    unit: z.string(),
    inranCode: z.string().optional(),
  })).optional(),
  instructions: z.string().optional(),
  prepTime: z.number().int().positive().optional(),
  cookTime: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
  portionSize: z.number().int().positive().optional(),
  calories: z.number().int().positive().optional(),
  allergens: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  // MinIO image URL
  imageUrl: z.string().url('URL immagine non valido').optional(),
  // INRAN nutritional data
  nutritionalValues: z.record(z.union([z.number(), z.record(z.number())])).optional(),
  inranCode: z.string().optional(),
  nutritionalSource: z.enum(['INRAN', 'CREA', 'MANUAL', 'CALCULATED']).optional(),
});

/**
 * GET /api/kitchen/recipes/[id]
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  // Rate limiting: MODERATE (30 req/min)
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const params = await props.params;
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Ricetta non trovata' }, { status: 404 });
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    logger.error('[API] Get recipe error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * PATCH /api/kitchen/recipes/[id]
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  // Rate limiting: MODERATE (30 req/min)
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const params = await props.params;
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    if (!['SUPER_ADMIN', 'KITCHEN_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateRecipeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.errors },
        { status: 400 }
      );
    }

    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: params.id },
    });

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Ricetta non trovata' }, { status: 404 });
    }

    const recipe = await prisma.recipe.update({
      where: { id: params.id },
      data: validation.data,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'recipe.updated',
        entity: 'Recipe',
        entityId: recipe.id,
        changes: {
          before: existingRecipe,
          after: recipe,
        },
      },
    });

    return NextResponse.json({
      message: 'Ricetta aggiornata con successo',
      recipe,
    });
  } catch (error) {
    logger.error('[API] Update recipe error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * DELETE /api/kitchen/recipes/[id]
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  // Rate limiting: MODERATE (30 req/min)
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const params = await props.params;
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    if (!['SUPER_ADMIN', 'KITCHEN_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Ricetta non trovata' }, { status: 404 });
    }

    await prisma.recipe.delete({
      where: { id: params.id },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'recipe.deleted',
        entity: 'Recipe',
        entityId: params.id,
        changes: { name: recipe.name },
      },
    });

    return NextResponse.json({ message: 'Ricetta eliminata con successo' });
  } catch (error) {
    logger.error('[API] Delete recipe error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

