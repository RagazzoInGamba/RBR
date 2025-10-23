/**
 * Oracle Red Bull Racing - Customer Admin Stats API
 * Real-time statistics for customer admin dashboard with trends
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
    if (!['CUSTOMER_ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Date calculations for current and previous month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Parallel queries for optimal performance
    const [
      totalEmployees,
      prevMonthEmployees,
      activeGroupsCount,
      monthlyOrders,
      prevMonthOrders,
      monthlySpend,
      recentEmployees,
      recentGroups,
    ] = await Promise.all([
      // Current total employees
      prisma.user.count({
        where: {
          role: 'END_USER',
        },
      }),

      // Previous month employees for trend
      prisma.user.count({
        where: {
          role: 'END_USER',
          createdAt: {
            lt: startOfMonth,
          },
        },
      }),

      // Active groups count
      prisma.group.count({
        where: {
          isActive: true,
        },
      }),

      // Monthly orders
      prisma.booking.count({
        where: {
          bookedAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          status: {
            notIn: ['CANCELLED'],
          },
        },
      }),

      // Previous month orders for trend
      prisma.booking.count({
        where: {
          bookedAt: {
            gte: startOfPrevMonth,
            lte: endOfPrevMonth,
          },
          status: {
            notIn: ['CANCELLED'],
          },
        },
      }),

      // Monthly spending aggregate
      prisma.booking.aggregate({
        where: {
          bookedAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          status: {
            notIn: ['CANCELLED'],
          },
        },
        _sum: {
          totalPrice: true,
        },
      }),

      // Recent employees for activity feed
      prisma.user.findMany({
        where: {
          role: 'END_USER',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          department: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      }),

      // Recent groups for activity feed
      prisma.group.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 2,
      }),
    ]);

    // Calculate monetary amount from cents
    const monthlySpendAmount = (monthlySpend._sum.totalPrice || 0) / 100;

    // Calculate trends
    const employeeTrend = prevMonthEmployees > 0
      ? ((totalEmployees - prevMonthEmployees) / prevMonthEmployees) * 100
      : totalEmployees > 0 ? 100 : 0;

    const ordersTrend = prevMonthOrders > 0
      ? ((monthlyOrders - prevMonthOrders) / prevMonthOrders) * 100
      : monthlyOrders > 0 ? 100 : 0;

    return NextResponse.json({
      stats: {
        totalEmployees: {
          value: totalEmployees,
          formatted: totalEmployees.toLocaleString('it-IT'),
          trend: {
            value: Math.abs(employeeTrend).toFixed(1),
            direction: employeeTrend >= 0 ? 'up' : 'down',
          },
        },
        activeGroups: {
          value: activeGroupsCount,
          formatted: activeGroupsCount.toString(),
        },
        monthlyOrders: {
          value: monthlyOrders,
          formatted: monthlyOrders.toLocaleString('it-IT'),
          trend: {
            value: Math.abs(ordersTrend).toFixed(1),
            direction: ordersTrend >= 0 ? 'up' : 'down',
          },
        },
        monthlySpending: {
          value: monthlySpendAmount,
          formatted: `€${monthlySpendAmount.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        },
      },
      recentActivity: [
        ...recentEmployees.map(emp => ({
          action: 'Nuovo dipendente aggiunto',
          user: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'N/A',
          department: emp.department || 'N/A',
          time: formatRelativeTime(emp.createdAt),
        })),
        ...recentGroups.map(group => ({
          action: 'Gruppo creato',
          user: group.name,
          department: group.description || 'N/A',
          time: formatRelativeTime(group.createdAt),
        })),
      ],
    });
  } catch (error) {
    logger.error('[API] Customer admin stats error:', error);
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





