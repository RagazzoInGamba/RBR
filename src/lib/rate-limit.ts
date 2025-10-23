/**
 * Oracle Red Bull Racing - Rate Limiting Middleware
 * DDoS and brute-force attack protection using Redis
 *
 * Features:
 * - Sliding window algorithm
 * - Per-IP and per-user rate limiting
 * - Configurable limits per endpoint
 * - Rate limit headers (X-RateLimit-*)
 * - 429 Too Many Requests responses
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { RateLimiter } from './redis';

export interface RateLimitConfig {
  /**
   * Maximum requests allowed in the time window
   * @default 100
   */
  limit?: number;

  /**
   * Time window in seconds
   * @default 60 (1 minute)
   */
  windowSeconds?: number;

  /**
   * Custom error message
   */
  message?: string;

  /**
   * Skip rate limiting if condition is true
   */
  skip?: (req: Request) => boolean | Promise<boolean>;
}

/**
 * Default rate limit configuration
 */
export const DEFAULT_RATE_LIMIT: Required<Omit<RateLimitConfig, 'skip'>> = {
  limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  windowSeconds: parseInt(process.env.RATE_LIMIT_WINDOW || '60'),
  message: 'Troppe richieste. Riprova tra qualche istante.',
};

/**
 * Endpoint-specific rate limits
 */
export const RATE_LIMITS = {
  /**
   * Authentication endpoints
   * Strict limit to prevent brute-force attacks
   */
  AUTH: {
    limit: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5'),
    windowSeconds: 60, // 5 requests per minute
    message: 'Troppi tentativi di login. Riprova tra 1 minuto.',
  },

  /**
   * API endpoints (general)
   * Moderate limit for normal API usage
   */
  API: {
    limit: 100,
    windowSeconds: 60, // 100 requests per minute
    message: 'Limite richieste API superato. Riprova tra qualche istante.',
  },

  /**
   * Password reset endpoints
   * Very strict to prevent abuse
   */
  PASSWORD_RESET: {
    limit: 3,
    windowSeconds: 3600, // 3 requests per hour
    message: 'Troppi tentativi di reset password. Riprova tra 1 ora.',
  },

  /**
   * Booking creation
   * Moderate to prevent spam
   */
  BOOKING: {
    limit: 20,
    windowSeconds: 60, // 20 bookings per minute
    message: 'Troppe prenotazioni. Riprova tra qualche istante.',
  },

  /**
   * Search/Query endpoints
   * Higher limit for read-only operations
   */
  SEARCH: {
    limit: 200,
    windowSeconds: 60, // 200 searches per minute
    message: 'Troppe ricerche. Riprova tra qualche istante.',
  },
} as const;

/**
 * Extract identifier from request (IP address or user ID)
 * @param req Request object
 * @param useUserId If true, prefer user ID over IP (requires auth)
 */
export function getIdentifier(req: Request, useUserId: boolean = false): string {
  // Try to get user ID from session if requested
  if (useUserId) {
    // This would require parsing JWT or getting session
    // For now, we'll use IP as primary identifier
  }

  // Get IP address from headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';

  // Sanitize IP
  const sanitizedIp = ip.replace(/[^0-9a-f.:]/gi, '');

  return sanitizedIp || 'unknown';
}

/**
 * Rate limiting middleware
 * @param config Rate limit configuration
 * @returns NextResponse or null (continue)
 */
export async function rateLimitMiddleware(
  config: RateLimitConfig = {}
): Promise<(req: Request) => Promise<NextResponse | null>> {
  const { limit, windowSeconds, message, skip } = {
    ...DEFAULT_RATE_LIMIT,
    ...config,
  };

  return async (req: Request) => {
    try {
      // Skip rate limiting if condition is met
      if (skip && (await skip(req))) {
        return null;
      }

      // Get identifier (IP address)
      const identifier = getIdentifier(req);

      // Check rate limit
      const { allowed, remaining, resetAt } = await RateLimiter.check(
        identifier,
        limit,
        windowSeconds
      );

      // If not allowed, return 429 Too Many Requests
      if (!allowed) {
        return NextResponse.json(
          {
            error: message || DEFAULT_RATE_LIMIT.message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((resetAt.getTime() - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.floor(resetAt.getTime() / 1000).toString(),
              'Retry-After': Math.ceil((resetAt.getTime() - Date.now()) / 1000).toString(),
            },
          }
        );
      }

      // Allow request, but add rate limit headers for transparency
      // This will be added by the calling function
      (req as any).__rateLimitHeaders = {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.floor(resetAt.getTime() / 1000).toString(),
      };

      return null; // Continue with request
    } catch (error) {
      logger.error('[RATE_LIMIT] Error checking rate limit:', error);
      // On error, allow the request (fail open for availability)
      return null;
    }
  };
}

/**
 * Apply rate limit middleware to API route
 * @param handler API route handler
 * @param config Rate limit configuration
 */
export function withRateLimit(
  handler: (req: Request, ...args: any[]) => Promise<Response>,
  config: RateLimitConfig = {}
) {
  return async (req: Request, ...args: any[]): Promise<Response> => {
    // Check rate limit
    const rateLimitCheck = await rateLimitMiddleware(config);
    const rateLimitResponse = await rateLimitCheck(req);

    // If rate limit exceeded, return 429
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Continue with handler
    const response = await handler(req, ...args);

    // Add rate limit headers to response
    const headers = (req as any).__rateLimitHeaders;
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value as string);
      });
    }

    return response;
  };
}

/**
 * Rate limit decorator for API routes
 * Usage:
 * @rateLimit({ limit: 10, windowSeconds: 60 })
 * export async function POST(req: Request) { ... }
 */
export function rateLimit(config: RateLimitConfig = {}) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = withRateLimit(originalMethod, config);

    return descriptor;
  };
}

/**
 * Helper: Rate limit by user ID (for authenticated endpoints)
 * Requires session to be available
 */
export async function rateLimitByUser(
  userId: string,
  config: RateLimitConfig = {}
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const { limit, windowSeconds } = {
    ...DEFAULT_RATE_LIMIT,
    ...config,
  };

  return await RateLimiter.check(`user:${userId}`, limit, windowSeconds);
}

/**
 * Helper: Rate limit by custom key
 */
export async function rateLimitByKey(
  key: string,
  config: RateLimitConfig = {}
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const { limit, windowSeconds } = {
    ...DEFAULT_RATE_LIMIT,
    ...config,
  };

  return await RateLimiter.check(key, limit, windowSeconds);
}

/**
 * Helper: Reset rate limit for identifier
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  await RateLimiter.reset(identifier);
}

export default rateLimitMiddleware;
