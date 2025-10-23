/**
 * Red Bull Racing - Booking Rules API
 * Get booking rules for meal type
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getBookingRules } from '@/lib/booking-validation';
import { MealType } from '@prisma/client';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/booking/rules?mealType=LUNCH
 * Get booking rules for a meal type
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.RELAXED);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const mealType = searchParams.get('mealType') as MealType;

    if (!mealType || !['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].includes(mealType)) {
      return NextResponse.json(
        { error: 'mealType parameter required (BREAKFAST, LUNCH, DINNER, SNACK)' },
        { status: 400 }
      );
    }

    const rules = await getBookingRules(mealType);

    return NextResponse.json({ rules });
  } catch (error) {
    logger.error('[API] Booking rules error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}





