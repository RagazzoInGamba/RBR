/**
 * Oracle Red Bull Racing - Kitchen Order Status Update API
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

const updateStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED']),
});

/**
 * PATCH /api/kitchen/orders/[id]/status
 * Update order status with workflow validation
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
    const validation = updateStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Status non valido', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { status } = validation.data;

    // Get current booking
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY', 'CANCELLED'],
      READY: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[booking.status]?.includes(status)) {
      return NextResponse.json(
        {
          error: `Transizione non valida: ${booking.status} → ${status}`,
          currentStatus: booking.status,
          allowedTransitions: validTransitions[booking.status],
        },
        { status: 400 }
      );
    }

    // Update booking with appropriate timestamps
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

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'booking.status_updated',
        entity: 'Booking',
        entityId: params.id,
        changes: {
          oldStatus: booking.status,
          newStatus: status,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: `Ordine aggiornato a ${status}`,
      booking: updatedBooking,
    });
  } catch (error) {
    logger.error('[API] Update order status error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

