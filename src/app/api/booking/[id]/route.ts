/**
 * Oracle Red Bull Racing - Booking API (Single Booking)
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/booking/[id]
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

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    // Check ownership or admin access
    const userRole = (session.user as { role: string }).role;
    const isOwner = booking.userId === session.user.id;
    const isAdmin = ['SUPER_ADMIN', 'KITCHEN_ADMIN'].includes(userRole);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    logger.error('[API] Get booking error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * DELETE /api/booking/[id]
 * Cancel booking
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

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    // Check ownership
    if (booking.userId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Check if can be cancelled
    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Questa prenotazione non può essere cancellata' },
        { status: 400 }
      );
    }

    // Check cancellation deadline (e.g., 2 hours before)
    const bookingDateTime = new Date(booking.date);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking < 2) {
      return NextResponse.json(
        { error: 'Non è più possibile cancellare questa prenotazione (scadenza: 2 ore prima)' },
        { status: 400 }
      );
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    // Decrement menu currentBookings
    await prisma.menu.update({
      where: { id: booking.menuId },
      data: {
        currentBookings: {
          decrement: 1,
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'booking.cancelled',
        entity: 'Booking',
        entityId: params.id,
        changes: {
          status: 'CANCELLED',
        },
      },
    });

    return NextResponse.json({
      message: 'Prenotazione cancellata con successo',
      booking: updatedBooking,
    });
  } catch (error) {
    logger.error('[API] Cancel booking error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * PATCH /api/booking/[id]
 * Update booking status (Kitchen Admin only)
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
    const { status } = body;

    if (!status || !['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { error: 'Stato non valido' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        items: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    const updateData: any = { status };

    if (status === 'CONFIRMED') {
      updateData.confirmedAt = new Date();
    } else if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'booking.status_updated',
        entity: 'Booking',
        entityId: params.id,
        changes: {
          oldStatus: booking.status,
          newStatus: status,
        },
      },
    });

    return NextResponse.json({
      message: 'Stato prenotazione aggiornato',
      booking: updatedBooking,
    });
  } catch (error) {
    logger.error('[API] Update booking error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

