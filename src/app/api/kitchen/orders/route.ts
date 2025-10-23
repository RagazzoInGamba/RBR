/**
 * Oracle Red Bull Racing - Kitchen Orders API
 * View and manage orders for kitchen staff
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/kitchen/orders
 * List orders for kitchen with filtering
 */
export async function GET(request: NextRequest) {
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
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const mealType = searchParams.get('mealType');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (date) {
      where.date = new Date(date);
    } else {
      // Default to today's orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      where.date = {
        gte: today,
        lt: tomorrow,
      };
    }

    if (mealType) {
      where.mealType = mealType;
    }

    // Fetch orders
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: [
          { status: 'asc' }, // PENDING first
          { bookedAt: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    // Calculate priority scores
    const bookingsWithPriority = bookings.map(booking => {
      let priority = 0;

      // High priority for CONFIRMED status
      if (booking.status === 'CONFIRMED') priority += 10;
      // Medium for PREPARING
      if (booking.status === 'PREPARING') priority += 5;
      // Older bookings have higher priority
      const ageHours = (Date.now() - booking.bookedAt.getTime()) / (1000 * 60 * 60);
      priority += Math.min(ageHours, 24); // Max 24 points for age

      return {
        ...booking,
        priority,
      };
    });

    // Sort by priority
    bookingsWithPriority.sort((a, b) => b.priority - a.priority);

    return NextResponse.json({
      orders: bookingsWithPriority,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('[API] Kitchen orders list error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}





