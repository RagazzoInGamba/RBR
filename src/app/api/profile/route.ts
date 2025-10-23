/**
 * Oracle Red Bull Racing - Profile API
 * User profile management
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
// import bcrypt from 'bcryptjs'; // Reserved for password update feature
import { z } from 'zod';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  department: z.string().optional(),
  badgeCode: z.string().optional(),
  ticketCode: z.string().optional(),
  dietaryRestrictions: z.object({
    allergies: z.array(z.string()),
    preferences: z.array(z.string()),
  }).optional(),
});

// Reserved for future password update feature
// const updatePasswordSchema = z.object({
//   currentPassword: z.string(),
//   newPassword: z.string().min(8),
// });

/**
 * GET /api/profile
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        badgeCode: true,
        ticketCode: true,
        dietaryRestrictions: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    logger.error('[API] Profile get error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * PATCH /api/profile
 * Update user profile
 */
export async function PATCH(request: NextRequest) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        badgeCode: true,
        ticketCode: true,
        dietaryRestrictions: true,
      },
    });

    return NextResponse.json({ message: 'Profilo aggiornato con successo', user });
  } catch (error) {
    logger.error('[API] Profile update error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
