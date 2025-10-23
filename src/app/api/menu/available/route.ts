/**
 * Red Bull Racing - Available Menus API
 * Get menus available for booking (future dates)
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.RELAXED);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get('days') || '7');

    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + daysAhead);

    const menus = await prisma.menu.findMany({
      where: {
        isActive: true,
        startDate: {
          lte: futureDate,
        },
        endDate: {
          gte: now,
        },
      },
      orderBy: [
        { startDate: 'asc' },
        { mealType: 'asc' },
      ],
    });

    // Parse recipes JSON and fetch recipe details
    const menusWithRecipes = await Promise.all(
      menus.map(async (menu) => {
        const courses = menu.courses as Record<string, any[]>;
        const recipeIds = Object.values(courses).flat().map((r: any) => r.recipeId);
        const recipes = await prisma.recipe.findMany({
          where: {
            id: {
              in: recipeIds,
            },
            isAvailable: true,
          },
        });

        return {
          ...menu,
          recipesDetails: recipes,
          availableSlots: menu.maxBookings - menu.currentBookings,
        };
      })
    );

    return NextResponse.json({ menus: menusWithRecipes });
  } catch (error) {
    logger.error('[API] Available menus error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
