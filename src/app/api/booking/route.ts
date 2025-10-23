/**
 * Oracle Red Bull Racing - Booking API
 * End User meal booking operations
 * With rate limiting to prevent spam
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { validateBookingItems, validateTotalPrice } from '@/lib/booking-validation';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

const createBookingSchema = z.object({
  menuId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  items: z.array(z.object({
    recipeId: z.string(),
    recipeName: z.string(),
    recipeCategory: z.enum(['APPETIZER', 'FIRST_COURSE', 'SECOND_COURSE', 'SIDE_DISH', 'DESSERT', 'BEVERAGE', 'EXTRA']),
    quantity: z.number().int().positive(),
    unitPrice: z.number().int().positive(), // cents
  })).min(1, 'At least one item required'),
  totalPrice: z.number().int().positive(), // cents
  paymentMethod: z.enum(['CREDIT_CARD', 'BADGE', 'TICKET_RESTAURANT', 'SATISPAY', 'NEXY']).optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/booking
 * List user's bookings
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    const where: any = { userId: session.user.id };
    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { bookedAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: true,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('[API] Booking list error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * POST /api/booking
 * Create new booking
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createBookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if menu exists and is available
    const menu = await prisma.menu.findUnique({
      where: { id: data.menuId },
    });

    if (!menu) {
      return NextResponse.json({ error: 'Menu non trovato' }, { status: 404 });
    }

    if (!menu.isActive) {
      return NextResponse.json({ error: 'Menu non disponibile' }, { status: 400 });
    }

    if (menu.currentBookings >= menu.maxBookings) {
      return NextResponse.json({ error: 'Prenotazioni esaurite per questo menu' }, { status: 400 });
    }

    // Validate booking rules
    const rulesValidation = await validateBookingItems(data.mealType as any, data.items as any);
    if (!rulesValidation.valid) {
      return NextResponse.json(
        {
          error: 'Selezione non valida',
          details: rulesValidation.errors,
        },
        { status: 400 }
      );
    }

    // Validate total price
    if (!validateTotalPrice(data.items as any, data.totalPrice)) {
      return NextResponse.json(
        { error: 'Prezzo totale non corrispondente' },
        { status: 400 }
      );
    }

    // Check for existing booking (same user, date, mealType)
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: session.user.id,
        date: new Date(data.date),
        mealType: data.mealType,
        status: {
          notIn: ['CANCELLED', 'COMPLETED'],
        },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Hai già una prenotazione per questo pasto' },
        { status: 409 }
      );
    }

    // Calculate subtotals for validation
    const itemsWithSubtotals = data.items.map(item => ({
      ...item,
      subtotal: item.quantity * item.unitPrice,
    }));

    // Create booking with items
    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        menuId: data.menuId,
        date: new Date(data.date),
        mealType: data.mealType,
        totalPrice: data.totalPrice,
        paymentMethod: data.paymentMethod,
        paymentStatus: 'PENDING',
        status: 'PENDING',
        notes: data.notes,
        items: {
          create: itemsWithSubtotals,
        },
      },
      include: {
        items: true,
      },
    });

    // Update menu currentBookings
    await prisma.menu.update({
      where: { id: data.menuId },
      data: {
        currentBookings: {
          increment: 1,
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'booking.created',
        entity: 'Booking',
        entityId: booking.id,
        changes: {
          date: data.date,
          mealType: data.mealType,
          totalPrice: data.totalPrice,
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Prenotazione creata con successo',
        booking,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('[API] Booking creation error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}





