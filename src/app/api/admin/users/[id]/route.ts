/**
 * Oracle Red Bull Racing - User Management API (Single User)
 * Update and delete operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z
    .string()
    .min(8, 'La password deve contenere almeno 8 caratteri')
    .regex(/[A-Z]/, 'Password deve contenere almeno una maiuscola')
    .regex(/[0-9]/, 'Password deve contenere almeno un numero')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password deve contenere almeno un carattere speciale')
    .optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['SUPER_ADMIN', 'KITCHEN_ADMIN', 'CUSTOMER_ADMIN', 'END_USER']).optional(),
  department: z.string().optional(),
  badgeCode: z.string().optional(),
  ticketCode: z.string().optional(),
  groupIds: z.array(z.string()).optional(),
});

/**
 * GET /api/admin/users/[id]
 * Get user by ID
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

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        badgeCode: true,
        ticketCode: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    logger.error('[API] Get user error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user
 */
export async function PATCH(
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

    // Check authorization (SUPER_ADMIN and CUSTOMER_ADMIN can update users)
    const userRole = (session.user as { role: string }).role;
    if (!['SUPER_ADMIN', 'CUSTOMER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    // If email is being changed, check uniqueness
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (emailExists) {
        return NextResponse.json({ error: 'Email già registrata' }, { status: 409 });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.role) updateData.role = data.role;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.badgeCode !== undefined) updateData.badgeCode = data.badgeCode;
    if (data.ticketCode !== undefined) updateData.ticketCode = data.ticketCode;

    // Hash password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        updatedAt: true,
      },
    });

    // Update group memberships if specified
    if (data.groupIds !== undefined) {
      // Remove existing memberships
      await prisma.groupMember.deleteMany({
        where: { userId: params.id },
      });

      // Add new memberships
      if (data.groupIds.length > 0) {
        await prisma.groupMember.createMany({
          data: data.groupIds.map((groupId) => ({
            groupId,
            userId: params.id,
            role: 'MEMBER',
            addedBy: session.user.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'user.updated',
        entity: 'User',
        entityId: user.id,
        changes: {
          before: {
            email: existingUser.email,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            role: existingUser.role,
          },
          after: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Utente aggiornato con successo',
      user,
    });
  } catch (error) {
    logger.error('[API] Update user error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user
 */
export async function DELETE(
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
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Prevent self-deletion
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: 'Non puoi eliminare il tuo account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    // Delete user (cascades to accounts and sessions)
    await prisma.user.delete({
      where: { id: params.id },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'user.deleted',
        entity: 'User',
        entityId: params.id,
        changes: {
          email: user.email,
          role: user.role,
        },
      },
    });

    return NextResponse.json({
      message: 'Utente eliminato con successo',
    });
  } catch (error) {
    logger.error('[API] Delete user error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

