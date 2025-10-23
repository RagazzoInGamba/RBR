/**
 * Oracle Red Bull Racing - Rate Limiting Middleware
 * Standardized rate limiting for API routes
 *
 * Usage:
 * ```typescript
 * import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';
 *
 * export async function POST(request: NextRequest) {
 *   // Check rate limit first
 *   const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.MODERATE);
 *   if (rateLimitResponse) return rateLimitResponse;
 *
 *   // Continue with handler logic
 *   // ...
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/redis';
import { getIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export interface RateLimitConfig {
  limit: number;          // Max requests per window
  windowSeconds?: number; // Window duration (default: 60)
  skipAuth?: boolean;     // Skip for authenticated admins (future feature)
}

/**
 * Pre-configured rate limit profiles for different API categories
 */
export const RATE_LIMITS = {
  /** Strict: 20 req/min - For sensitive operations like booking */
  STRICT: { limit: 20, windowSeconds: 60 },

  /** Moderate: 30 req/min - For admin CRUD operations */
  MODERATE: { limit: 30, windowSeconds: 60 },

  /** Default: 50 req/min - For general API usage */
  DEFAULT: { limit: 50, windowSeconds: 60 },

  /** Relaxed: 60 req/min - For read-heavy endpoints like menu fetch */
  RELAXED: { limit: 60, windowSeconds: 60 },

  /** Stats: 100 req/min - For dashboard polling */
  STATS: { limit: 100, windowSeconds: 60 },

  /** Auth: 10 req/min - For login attempts */
  AUTH: { limit: 10, windowSeconds: 60 },

  /** Booking: 20 req/min - For booking operations */
  BOOKING: { limit: 20, windowSeconds: 60 },
} as const;

/**
 * Rate limit middleware for API routes
 * Returns NextResponse if rate limited, null if allowed to proceed
 *
 * @param request - Next.js request object
 * @param config - Rate limit configuration (use RATE_LIMITS constants)
 * @returns NextResponse with 429 status if rate limited, null if allowed
 */
export async function withRateLimitMiddleware(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.DEFAULT
): Promise<NextResponse | null> {
  try {
    const identifier = getIdentifier(request as any);
    const result = await RateLimiter.check(
      identifier,
      config.limit,
      config.windowSeconds || 60
    );

    if (!result.allowed) {
      // Rate limit exceeded - log and return 429
      logger.warn('Rate limit exceeded', {
        ip: request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown',
        path: request.nextUrl.pathname,
        limit: config.limit,
        resetAt: result.resetAt,
      });

      const retryAfterSeconds = Math.ceil(
        (result.resetAt.getTime() - Date.now()) / 1000
      );

      return NextResponse.json(
        {
          error: 'Troppe richieste. Riprova tra qualche istante.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor(result.resetAt.getTime() / 1000).toString(),
            'Retry-After': retryAfterSeconds.toString(),
          },
        }
      );
    }

    // Rate limit allowed - add headers to response for transparency
    // Note: These will be added by the calling API handler if needed
    (request as any).__rateLimitHeaders = {
      'X-RateLimit-Limit': config.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.floor(result.resetAt.getTime() / 1000).toString(),
    };

    return null; // Continue with request
  } catch (error) {
    logger.error('Rate limit check failed', { error, path: request.nextUrl.pathname });
    // Fail open - allow request if rate limiter has issues (availability over security)
    return null;
  }
}

/**
 * Get rate limit info for a request without checking/consuming the limit
 * Useful for informational purposes
 *
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns Rate limit status
 */
export async function getRateLimitInfo(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.DEFAULT
): Promise<{
  limit: number;
  remaining: number;
  resetAt: Date;
} | null> {
  try {
    const identifier = getIdentifier(request as any);
    const result = await RateLimiter.check(
      identifier,
      config.limit,
      config.windowSeconds || 60
    );

    return {
      limit: config.limit,
      remaining: result.remaining,
      resetAt: result.resetAt,
    };
  } catch (error) {
    logger.error('Failed to get rate limit info', { error });
    return null;
  }
}
