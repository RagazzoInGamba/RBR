/**
 * Oracle Red Bull Racing - Single Employee API
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

const updateEmployeeSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  monthlyBudget: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  badgeCode: z.string().optional(),
  ticketCode: z.string().optional(),
});

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const params = await props.params;
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: params.id, role: 'END_USER' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        position: true,
        monthlyBudget: true,
        spentThisMonth: true,
        isActive: true,
        badgeCode: true,
        ticketCode: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) return NextResponse.json({ error: 'Dipendente non trovato' }, { status: 404 });

    // Transform to Employee format
    const employee = {
      id: user.id,
      userId: user.id,
      department: user.department,
      position: user.position,
      monthlyBudget: user.monthlyBudget,
      spentThisMonth: user.spentThisMonth,
      isActive: user.isActive,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      createdAt: user.createdAt.toISOString(),
    };

    return NextResponse.json({ employee });
  } catch (error) {
    logger.error('[API] Get employee error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const params = await props.params;
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const userRole = (session.user as { role: string }).role;
    if (!['SUPER_ADMIN', 'CUSTOMER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateEmployeeSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });

    const data = validation.data;
    const updateData: any = {};
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.monthlyBudget !== undefined) updateData.monthlyBudget = data.monthlyBudget;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.badgeCode !== undefined) updateData.badgeCode = data.badgeCode;
    if (data.ticketCode !== undefined) updateData.ticketCode = data.ticketCode;
    if (data.password) updateData.password = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        position: true,
        monthlyBudget: true,
        spentThisMonth: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Transform to Employee format
    const employee = {
      id: user.id,
      userId: user.id,
      department: user.department,
      position: user.position,
      monthlyBudget: user.monthlyBudget,
      spentThisMonth: user.spentThisMonth,
      isActive: user.isActive,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      updatedAt: user.updatedAt.toISOString(),
    };

    await prisma.auditLog.create({
      data: { userId: session.user.id, action: 'employee.updated', entity: 'User', entityId: employee.id, changes: updateData },
    });

    return NextResponse.json({ message: 'Dipendente aggiornato', employee });
  } catch (error) {
    logger.error('[API] Update employee error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const params = await props.params;
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const userRole = (session.user as { role: string }).role;
    if (!['SUPER_ADMIN', 'CUSTOMER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id: params.id } });
    await prisma.auditLog.create({
      data: { userId: session.user.id, action: 'employee.deleted', entity: 'User', entityId: params.id, changes: {} },
    });

    return NextResponse.json({ message: 'Dipendente eliminato' });
  } catch (error) {
    logger.error('[API] Delete employee error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

