/**
 * Oracle Red Bull Racing - Employee Management API
 * Customer Admin employee operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

const createEmployeeSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'Password minimo 8 caratteri'),
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  department: z.string().optional(),
  position: z.string().optional(),
  monthlyBudget: z.number().int().min(0).default(0),
  badgeCode: z.string().optional(),
  ticketCode: z.string().optional(),
});

/**
 * GET /api/customer/employees
 * List employees (END_USER role)
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    if (!['SUPER_ADMIN', 'CUSTOMER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const skip = (page - 1) * limit;

    const where: any = {
      role: 'END_USER', // Only END_USER employees
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (department) {
      where.department = department;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Transform User objects into Employee format expected by frontend
    const employees = users.map((user) => ({
      id: user.id, // Use user.id as employee id
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
    }));

    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('[API] Employee list error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

/**
 * POST /api/customer/employees
 * Create new employee
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

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
    const validation = createEmployeeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email già registrata' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create employee (END_USER role)
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'END_USER',
        department: data.department,
        position: data.position,
        monthlyBudget: data.monthlyBudget || 0,
        spentThisMonth: 0,
        isActive: true,
        badgeCode: data.badgeCode,
        ticketCode: data.ticketCode,
      },
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
      createdAt: user.createdAt.toISOString(),
    };

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'employee.created',
        entity: 'User',
        entityId: employee.id,
        changes: {
          email: employee.user.email,
          department: employee.department,
          position: employee.position,
          monthlyBudget: employee.monthlyBudget,
        },
      },
    });

    return NextResponse.json(
      { message: 'Dipendente creato con successo', employee },
      { status: 201 }
    );
  } catch (error) {
    logger.error('[API] Employee creation error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}









