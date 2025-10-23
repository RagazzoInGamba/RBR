/**
 * Oracle Red Bull Racing - Dashboard Stats API
 * Unified stats endpoint for all user roles
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
    let stats: any = {};

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (userRole === 'SUPER_ADMIN') {
      const [totalUsers, activeGateways, auditEvents] = await Promise.all([
        prisma.user.count(),
        prisma.paymentGatewayConfig.count({ where: { isActive: true } }),
        prisma.auditLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      ]);

      stats = {
        totalUsers,
        activeGateways,
        auditEvents,
        systemUptime: 99.8, // Mock
      };
    } else if (userRole === 'KITCHEN_ADMIN') {
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);

      const [totalRecipes, weeklyMenus, todayOrders] = await Promise.all([
        prisma.recipe.count({ where: { isAvailable: true } }),
        prisma.menu.count({
          where: {
            startDate: { lte: endOfWeek },
            endDate: { gte: today }
          }
        }),
        prisma.booking.count({ where: { date: today, status: { in: ['PENDING', 'CONFIRMED'] } } }),
      ]);

      stats = {
        totalRecipes,
        weeklyMenus,
        todayOrders,
        avgPrepTime: 25, // Mock
      };
    } else if (userRole === 'CUSTOMER_ADMIN') {
      const [totalEmployees, monthlyOrders, activeGroupsCount] = await Promise.all([
        prisma.user.count({ where: { role: 'END_USER' } }),
        prisma.booking.count({ where: { bookedAt: { gte: thirtyDaysAgo } } }),
        prisma.group.count({ where: { isActive: true } }),
      ]);

      stats = {
        totalEmployees,
        activeGroups: activeGroupsCount,
        monthlyOrders,
        monthlySpend: monthlyOrders * 12, // Mock €12/order
      };
    } else if (userRole === 'END_USER') {
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);

      const [availableMeals, myOrders] = await Promise.all([
        prisma.menu.count({
          where: {
            startDate: { lte: endOfWeek },
            endDate: { gte: today },
            isActive: true
          }
        }),
        prisma.booking.count({ where: { userId: session.user.id } }),
      ]);

      stats = {
        availableMeals,
        myOrders,
        monthlySpend: myOrders * 12, // Mock
      };
    }

    return NextResponse.json({ stats, role: userRole });
  } catch (error) {
    logger.error('[API] Stats error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}





