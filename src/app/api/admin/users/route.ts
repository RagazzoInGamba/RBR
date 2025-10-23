/**
 * Oracle Red Bull Racing - User Management API
 * Enterprise-grade CRUD operations with role-based access
 * 
 * @author Universal Full-Stack Architect
 * @date 2025-01-20
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z
    .string()
    .min(8, 'La password deve contenere almeno 8 caratteri')
    .regex(/[A-Z]/, 'Password deve contenere almeno una maiuscola')
    .regex(/[0-9]/, 'Password deve contenere almeno un numero')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password deve contenere almeno un carattere speciale'),
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  role: z.enum(['SUPER_ADMIN', 'KITCHEN_ADMIN', 'CUSTOMER_ADMIN', 'END_USER']),
  department: z.string().optional(),
  badgeCode: z.string().optional(),
  ticketCode: z.string().optional(),
  groupIds: z.array(z.string()).optional(),
});

/**
 * GET /api/admin/users
 * List all users with pagination and filtering
 */
export async function GET(request: NextRequest) {
  // Rate limiting: MODERATE (30 req/min)
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // Check authorization (only SUPER_ADMIN and CUSTOMER_ADMIN)
    const userRole = (session.user as { role: string }).role;
    if (!['SUPER_ADMIN', 'CUSTOMER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch users
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
          // Exclude password
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'user.list',
        entity: 'User',
        changes: { filters: where, page, limit },
      },
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('[API] User list error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  // Rate limiting: MODERATE (30 req/min)
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // Check authorization (SUPER_ADMIN and CUSTOMER_ADMIN can create users)
    const userRole = (session.user as { role: string }).role;
    if (!['SUPER_ADMIN', 'CUSTOMER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Parse and validate body
    const body = await request.json();
    const validation = createUserSchema.safeParse(body);
    
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
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        department: data.department,
        badgeCode: data.badgeCode,
        ticketCode: data.ticketCode,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    // Add user to groups if specified
    if (data.groupIds && data.groupIds.length > 0) {
      await prisma.groupMember.createMany({
        data: data.groupIds.map((groupId) => ({
          groupId,
          userId: user.id,
          role: 'MEMBER',
          addedBy: session.user.id,
        })),
        skipDuplicates: true,
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'user.created',
        entity: 'User',
        entityId: user.id,
        changes: {
          email: user.email,
          role: user.role,
          groups: data.groupIds || [],
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Utente creato con successo',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('[API] User creation error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}



