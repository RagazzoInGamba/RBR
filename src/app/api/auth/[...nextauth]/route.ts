/**
 * Oracle Red Bull Racing - NextAuth v5 Route Handler
 */

import { handlers } from '@/lib/auth';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

// Export handlers directly
export const GET = handlers.GET;
export const POST = handlers.POST;
