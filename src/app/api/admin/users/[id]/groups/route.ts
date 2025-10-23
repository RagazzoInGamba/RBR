/**
 * Oracle Red Bull Racing - User Groups API
 * Get user's group memberships
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/[id]/groups
 * Get user's group memberships
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  // Rate limiting: MODERATE (30 req/min)
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const params = await props.params;
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    if (!['SUPER_ADMIN', 'CUSTOMER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Fetch user's group memberships
    const groups = await prisma.groupMember.findMany({
      where: { userId: params.id },
      select: {
        id: true,
        groupId: true,
        role: true,
        addedAt: true,
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json({ groups });
  } catch (error) {
    logger.error('[API] Get user groups error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
