/**
 * Oracle Red Bull Racing - Menu Management API (Single Menu)
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

const updateMenuSchema = z.object({
  name: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']).optional(),
  recipes: z.array(z.object({
    recipeId: z.string().cuid(),
    quantity: z.number().int().positive(),
  })).optional(),
  maxBookings: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/kitchen/menus/[id]
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const params = await props.params;
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const menu = await prisma.menu.findUnique({
      where: { id: params.id },
    });

    if (!menu) {
      return NextResponse.json({ error: 'Menu non trovato' }, { status: 404 });
    }

    // Fetch recipe details from courses
    const courses = menu.courses as Record<string, any[]>;
    const recipeIds = Object.values(courses).flat().map((r: any) => r.recipeId);
    const recipes = await prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
    });

    return NextResponse.json({
      menu: {
        ...menu,
        recipeDetails: recipes,
      },
    });
  } catch (error) {
    logger.error('[API] Get menu error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * PATCH /api/kitchen/menus/[id]
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
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
    const validation = updateMenuSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.errors },
        { status: 400 }
      );
    }

    const existingMenu = await prisma.menu.findUnique({
      where: { id: params.id },
    });

    if (!existingMenu) {
      return NextResponse.json({ error: 'Menu non trovato' }, { status: 404 });
    }

    const data = validation.data;

    // If recipes are being updated, check availability
    if (data.recipes) {
      const recipeIds = data.recipes.map(r => r.recipeId);
      const recipes = await prisma.recipe.findMany({
        where: { id: { in: recipeIds } },
        select: { id: true, isAvailable: true },
      });

      if (recipes.length !== recipeIds.length) {
        return NextResponse.json(
          { error: 'Una o più ricette non esistono' },
          { status: 404 }
        );
      }

      const unavailableRecipes = recipes.filter(r => !r.isAvailable);
      if (unavailableRecipes.length > 0) {
        return NextResponse.json(
          { error: 'Una o più ricette non sono disponibili' },
          { status: 400 }
        );
      }
    }

    // Update menu
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.date) updateData.date = new Date(data.date);
    if (data.mealType) updateData.mealType = data.mealType;
    if (data.recipes) updateData.recipes = data.recipes;
    if (data.maxBookings !== undefined) updateData.maxBookings = data.maxBookings;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const menu = await prisma.menu.update({
      where: { id: params.id },
      data: updateData,
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'menu.updated',
        entity: 'Menu',
        entityId: menu.id,
        changes: {
          before: existingMenu,
          after: menu,
        },
      },
    });

    return NextResponse.json({
      message: 'Menu aggiornato con successo',
      menu,
    });
  } catch (error) {
    logger.error('[API] Update menu error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * DELETE /api/kitchen/menus/[id]
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
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

    const menu = await prisma.menu.findUnique({
      where: { id: params.id },
    });

    if (!menu) {
      return NextResponse.json({ error: 'Menu non trovato' }, { status: 404 });
    }

    // Check if there are active bookings for this menu
    const activeBookingsCount = await prisma.booking.count({
      where: {
        menuId: params.id,
        status: {
          notIn: ['CANCELLED', 'COMPLETED'],
        },
      },
    });

    if (activeBookingsCount > 0) {
      return NextResponse.json(
        {
          error: 'Non è possibile eliminare un menu con prenotazioni attive',
          activeBookings: activeBookingsCount,
        },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const updatedMenu = await prisma.menu.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'menu.deleted',
        entity: 'Menu',
        entityId: params.id,
        changes: {
          name: menu.name,
          startDate: menu.startDate.toISOString(),
          endDate: menu.endDate.toISOString(),
          mealType: menu.mealType,
        },
      },
    });

    return NextResponse.json({
      message: 'Menu disattivato con successo',
      menu: updatedMenu,
    });
  } catch (error) {
    logger.error('[API] Delete menu error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

