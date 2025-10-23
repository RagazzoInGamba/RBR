/**
 * Oracle Red Bull Racing - Kitchen Stats API
 * Real-time statistics for kitchen admin dashboard with trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.STATS);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    if (!['KITCHEN_ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Date calculations
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
    const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);

    // Parallel queries for optimal performance
    const [
      totalRecipes,
      lastWeekRecipes,
      activeMenus,
      todaysOrders,
      yesterdayOrders,
      avgPrepTimeData,
      recentOrders,
    ] = await Promise.all([
      // Total recipes
      prisma.recipe.count({
        where: {
          isAvailable: true,
        },
      }),

      // Last week recipes for trend
      prisma.recipe.count({
        where: {
          isAvailable: true,
          createdAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Active menus
      prisma.menu.count({
        where: {
          isActive: true,
          startDate: {
            lte: endOfToday,
          },
          endDate: {
            gte: startOfToday,
          },
        },
      }),

      // Today's pending orders
      prisma.booking.count({
        where: {
          date: {
            gte: startOfToday,
            lte: endOfToday,
          },
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      }),

      // Yesterday's pending orders for trend
      prisma.booking.count({
        where: {
          date: {
            gte: startOfYesterday,
            lte: endOfYesterday,
          },
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      }),

      // Average prep time from recipes
      prisma.recipe.aggregate({
        _avg: {
          prepTime: true,
        },
        where: {
          isAvailable: true,
        },
      }),

      // Recent orders
      prisma.booking.findMany({
        where: {
          date: {
            gte: startOfToday,
          },
          status: {
            notIn: ['CANCELLED', 'COMPLETED'],
          },
        },
        select: {
          id: true,
          mealType: true,
          status: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          bookedAt: true,
        },
        orderBy: {
          bookedAt: 'desc',
        },
        take: 5,
      }),
    ]);

    // Calculate trends
    const recipeTrend = lastWeekRecipes > 0
      ? ((totalRecipes - lastWeekRecipes) / lastWeekRecipes) * 100
      : totalRecipes > 0 ? 100 : 0;

    const ordersTrend = yesterdayOrders > 0
      ? ((todaysOrders - yesterdayOrders) / yesterdayOrders) * 100
      : todaysOrders > 0 ? 100 : 0;

    const avgPrepTime = Math.round(avgPrepTimeData._avg.prepTime || 25);

    return NextResponse.json({
      stats: {
        totalRecipes: {
          value: totalRecipes,
          formatted: totalRecipes.toLocaleString('it-IT'),
          trend: {
            value: Math.abs(recipeTrend).toFixed(1),
            direction: recipeTrend >= 0 ? 'up' : 'down',
          },
        },
        activeMenus: {
          value: activeMenus,
          formatted: activeMenus.toString(),
        },
        pendingOrders: {
          value: todaysOrders,
          formatted: todaysOrders.toLocaleString('it-IT'),
          trend: {
            value: Math.abs(ordersTrend).toFixed(1),
            direction: ordersTrend >= 0 ? 'up' : 'down',
          },
        },
        avgPrepTime: {
          value: avgPrepTime,
          formatted: `${avgPrepTime}m`,
        },
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        mealType: order.mealType,
        status: order.status,
        user: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'N/A',
        time: formatRelativeTime(order.bookedAt),
      })),
    });
  } catch (error) {
    logger.error('[API] Kitchen stats error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * Format date as relative time in Italian
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Adesso';
  if (diffMins === 1) return '1 minuto fa';
  if (diffMins < 60) return `${diffMins} minuti fa`;
  if (diffHours === 1) return '1 ora fa';
  if (diffHours < 24) return `${diffHours} ore fa`;
  if (diffDays === 1) return '1 giorno fa';
  return `${diffDays} giorni fa`;
}





