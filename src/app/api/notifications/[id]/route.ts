/**
 * Oracle Red Bull Racing - Notification Detail API
 * Individual notification operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/notifications/[id]
 * Mark notification as read
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.DEFAULT);
  if (rateLimitResponse) return rateLimitResponse;

  const params = await props.params;
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notifica non trovata' }, { status: 404 });
    }

    // Check ownership
    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Notifica segnata come letta',
      notification: updated,
    });
  } catch (error) {
    logger.error('[API] Notification update error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete notification
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.DEFAULT);
  if (rateLimitResponse) return rateLimitResponse;

  const params = await props.params;
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notifica non trovata' }, { status: 404 });
    }

    // Check ownership
    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await prisma.notification.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Notifica eliminata con successo' });
  } catch (error) {
    logger.error('[API] Notification deletion error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
