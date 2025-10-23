/**
 * Oracle Red Bull Racing - Menu Management API
 * Kitchen Admin menu operations with drag-drop course structure
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

const courseRecipeSchema = z.object({
  recipeId: z.string().cuid(),
  recipeName: z.string(),
  quantity: z.number().int().positive(),
  category: z.string(),
});

const coursesSchema = z.object({
  antipasto: z.array(courseRecipeSchema),
  primo: z.array(courseRecipeSchema),
  secondo: z.array(courseRecipeSchema),
  contorno: z.array(courseRecipeSchema),
  dessert: z.array(courseRecipeSchema),
  extra: z.array(courseRecipeSchema),
});

const createMenuSchema = z.object({
  name: z.string().min(1, 'Nome richiesto'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido'),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  menuType: z.enum(['STANDARD', 'VEGETARIAN', 'VEGAN', 'CELIAC', 'LOW_SODIUM']),
  courses: coursesSchema,
  targetDiners: z.number().int().positive().optional(),
  maxBookings: z.number().int().positive().default(100),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/kitchen/menus
 * List menus with filtering
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const mealType = searchParams.get('mealType');
    const menuType = searchParams.get('menuType');
    const isActive = searchParams.get('isActive');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dateFrom || dateTo) {
      where.startDate = {};
      if (dateFrom) where.startDate.gte = new Date(dateFrom);
      if (dateTo) where.startDate.lte = new Date(dateTo);
    }

    if (mealType) {
      where.mealType = mealType;
    }

    if (menuType) {
      where.menuType = menuType;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [menus, total] = await Promise.all([
      prisma.menu.findMany({
        where,
        orderBy: [
          { startDate: 'desc' },
          { mealType: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.menu.count({ where }),
    ]);

    return NextResponse.json({
      menus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('[API] Menu list error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * POST /api/kitchen/menus
 * Create new menu with multi-course structure
 */
export async function POST(request: NextRequest) {
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
    const validation = createMenuSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate date range
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'La data di fine deve essere successiva o uguale alla data di inizio' },
        { status: 400 }
      );
    }

    // Extract all recipe IDs from courses
    const allRecipeIds = [
      ...data.courses.antipasto.map(r => r.recipeId),
      ...data.courses.primo.map(r => r.recipeId),
      ...data.courses.secondo.map(r => r.recipeId),
      ...data.courses.contorno.map(r => r.recipeId),
      ...data.courses.dessert.map(r => r.recipeId),
      ...data.courses.extra.map(r => r.recipeId),
    ];

    if (allRecipeIds.length === 0) {
      return NextResponse.json(
        { error: 'Il menu deve contenere almeno una ricetta' },
        { status: 400 }
      );
    }

    // Check if recipes exist and are available
    const recipes = await prisma.recipe.findMany({
      where: {
        id: { in: allRecipeIds },
      },
      select: {
        id: true,
        name: true,
        isAvailable: true,
        nutritionalValues: true,
        allergens: true,
      },
    });

    if (recipes.length !== allRecipeIds.length) {
      return NextResponse.json(
        { error: 'Una o più ricette non esistono' },
        { status: 404 }
      );
    }

    const unavailableRecipes = recipes.filter(r => !r.isAvailable);
    if (unavailableRecipes.length > 0) {
      return NextResponse.json(
        { error: 'Una o più ricette non sono disponibili', unavailable: unavailableRecipes.map(r => r.id) },
        { status: 400 }
      );
    }

    // Calculate nutritional summary (aggregate from all recipes)
    const nutritionalSummary = {
      energy_kcal: 0,
      energy_kj: 0,
      protein: 0,
      carbohydrates: 0,
      fats: 0,
      fiber: 0,
      sodium: 0,
      allergens: new Set<string>(),
    };

    Object.values(data.courses).flat().forEach((courseRecipe: any) => {
      const recipe = recipes.find(r => r.id === courseRecipe.recipeId);
      if (recipe && recipe.nutritionalValues) {
        const nutritional = recipe.nutritionalValues as any;
        nutritionalSummary.energy_kcal += (nutritional.energy_kcal || 0) * courseRecipe.quantity;
        nutritionalSummary.energy_kj += (nutritional.energy_kj || 0) * courseRecipe.quantity;
        nutritionalSummary.protein += (nutritional.protein || 0) * courseRecipe.quantity;
        nutritionalSummary.carbohydrates += (nutritional.carbohydrates || 0) * courseRecipe.quantity;
        nutritionalSummary.fats += (nutritional.fats || 0) * courseRecipe.quantity;
        nutritionalSummary.fiber += (nutritional.fiber || 0) * courseRecipe.quantity;
        nutritionalSummary.sodium += (nutritional.sodium || 0) * courseRecipe.quantity;
      }

      if (recipe && recipe.allergens) {
        recipe.allergens.forEach((allergen: string) => {
          nutritionalSummary.allergens.add(allergen);
        });
      }
    });

    // Convert Set to Array for JSON
    const nutritionalSummaryJSON = {
      ...nutritionalSummary,
      allergens: Array.from(nutritionalSummary.allergens),
    };

    // Create menu
    const menu = await prisma.menu.create({
      data: {
        name: data.name,
        startDate: startDate,
        endDate: endDate,
        mealType: data.mealType,
        menuType: data.menuType,
        courses: data.courses,
        maxBookings: data.maxBookings,
        targetDiners: data.targetDiners,
        nutritionalSummary: nutritionalSummaryJSON,
        isActive: data.isActive,
        createdBy: session.user.id,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'menu.created',
        entity: 'Menu',
        entityId: menu.id,
        changes: {
          name: menu.name,
          startDate: data.startDate,
          endDate: data.endDate,
          mealType: menu.mealType,
          menuType: menu.menuType,
          recipeCount: allRecipeIds.length,
        },
      },
    });

    return NextResponse.json(
      { message: 'Menu creato con successo', menu },
      { status: 201 }
    );
  } catch (error) {
    logger.error('[API] Menu creation error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
