/**
 * Oracle Red Bull Racing - Group Detail API
 * Individual group operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

const updateGroupSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Reserved for future member management feature
// const addMemberSchema = z.object({
//   userIds: z.array(z.string()),
//   role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
// });

/**
 * GET /api/customer/groups/[id]
 * Get group details
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  const params = await props.params;
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    if (!['SUPER_ADMIN', 'CUSTOMER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            addedAt: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Gruppo non trovato' }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    logger.error('[API] Group detail error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * PATCH /api/customer/groups/[id]
 * Update group
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  const params = await props.params;
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    if (!['SUPER_ADMIN', 'CUSTOMER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateGroupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get existing group
    const existingGroup = await prisma.group.findUnique({
      where: { id: params.id },
    });

    if (!existingGroup) {
      return NextResponse.json({ error: 'Gruppo non trovato' }, { status: 404 });
    }

    // Update group
    const group = await prisma.group.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'group.updated',
        entity: 'Group',
        entityId: group.id,
        changes: {
          before: existingGroup,
          after: data,
        },
      },
    });

    return NextResponse.json({ message: 'Gruppo aggiornato con successo', group });
  } catch (error) {
    logger.error('[API] Group update error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * DELETE /api/customer/groups/[id]
 * Delete group
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  const params = await props.params;
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    if (!['SUPER_ADMIN', 'CUSTOMER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const group = await prisma.group.findUnique({
      where: { id: params.id },
    });

    if (!group) {
      return NextResponse.json({ error: 'Gruppo non trovato' }, { status: 404 });
    }

    // Delete group (cascade will delete members)
    await prisma.group.delete({
      where: { id: params.id },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'group.deleted',
        entity: 'Group',
        entityId: params.id,
        changes: {
          name: group.name,
        },
      },
    });

    return NextResponse.json({ message: 'Gruppo eliminato con successo' });
  } catch (error) {
    logger.error('[API] Group deletion error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
