/**
 * Oracle Red Bull Racing - User Stats API
 * Real-time statistics for end user (booking) dashboard with trends
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

    const userId = session.user.id;

    // Date calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + 7);

    // Parallel queries for optimal performance
    const [
      availableMenusCount,
      myBookingsCount,
      prevMonthBookingsCount,
      monthlyBookings,
      nextBooking,
      recentBookings,
    ] = await Promise.all([
      // Available menus this week
      prisma.menu.count({
        where: {
          isActive: true,
          startDate: {
            lte: endOfWeek,
          },
          endDate: {
            gte: now,
          },
        },
      }),

      // My bookings this month
      prisma.booking.count({
        where: {
          userId,
          bookedAt: {
            gte: startOfMonth,
          },
          status: {
            notIn: ['CANCELLED'],
          },
        },
      }),

      // Previous month bookings for trend
      prisma.booking.count({
        where: {
          userId,
          bookedAt: {
            gte: startOfPrevMonth,
            lte: endOfPrevMonth,
          },
          status: {
            notIn: ['CANCELLED'],
          },
        },
      }),

      // Monthly spend calculation
      prisma.booking.aggregate({
        where: {
          userId,
          bookedAt: {
            gte: startOfMonth,
          },
          status: {
            notIn: ['CANCELLED'],
          },
        },
        _sum: {
          totalPrice: true,
        },
      }),

      // Next upcoming booking
      prisma.booking.findFirst({
        where: {
          userId,
          date: {
            gte: now,
          },
          status: {
            notIn: ['CANCELLED', 'COMPLETED'],
          },
        },
        orderBy: {
          date: 'asc',
        },
      }),

      // Recent bookings for activity
      prisma.booking.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
          date: true,
          mealType: true,
          status: true,
          totalPrice: true,
          bookedAt: true,
        },
        orderBy: {
          bookedAt: 'desc',
        },
        take: 5,
      }),
    ]);

    // Calculate trends
    const bookingTrend = prevMonthBookingsCount > 0
      ? ((myBookingsCount - prevMonthBookingsCount) / prevMonthBookingsCount) * 100
      : myBookingsCount > 0 ? 100 : 0;

    // Calculate monthly spend in euros
    const monthlySpend = (monthlyBookings._sum.totalPrice || 0) / 100;

    // Format next booking info
    const nextBookingInfo = nextBooking
      ? {
          value: 'Oggi',
          description: nextBooking.mealType === 'BREAKFAST' ? '08:00' : nextBooking.mealType === 'LUNCH' ? '12:30' : '19:00',
          formatted: formatDate(nextBooking.date),
          time: nextBooking.mealType === 'BREAKFAST' ? '08:00' : nextBooking.mealType === 'LUNCH' ? '12:30' : '19:00',
        }
      : {
          value: 'Nessuna',
          description: 'Prenota ora',
          formatted: '',
          time: '',
        };

    return NextResponse.json({
      stats: {
        availableMenus: {
          value: availableMenusCount,
          formatted: availableMenusCount.toString(),
        },
        myBookings: {
          value: myBookingsCount,
          formatted: myBookingsCount.toString(),
          trend: {
            value: Math.abs(bookingTrend).toFixed(1),
            direction: bookingTrend >= 0 ? 'up' : 'down',
          },
        },
        monthlySpending: {
          value: monthlySpend,
          formatted: `€${monthlySpend.toFixed(0)}`,
        },
        nextBooking: nextBookingInfo,
      },
      recentBookings: recentBookings.map(booking => ({
        id: booking.id,
        date: formatDate(booking.date),
        mealType: booking.mealType,
        status: booking.status,
        amount: `€${(booking.totalPrice / 100).toFixed(2)}`,
        time: formatRelativeTime(booking.bookedAt),
      })),
    });
  } catch (error) {
    logger.error('[API] User stats error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * Format date to Italian format
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
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





