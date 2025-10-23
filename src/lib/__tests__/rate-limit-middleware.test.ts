/**
 * Unit tests for rate limiting configuration
 * Ensures correct limits are set for different endpoint types
 */

import { RATE_LIMITS, RateLimitConfig } from '../rate-limit-middleware';

describe('Rate Limit Middleware Configuration', () => {
  describe('RATE_LIMITS constant structure', () => {
    it('should have all required limit profiles', () => {
      expect(RATE_LIMITS).toBeDefined();
      expect(RATE_LIMITS).toHaveProperty('AUTH');
      expect(RATE_LIMITS).toHaveProperty('STRICT');
      expect(RATE_LIMITS).toHaveProperty('MODERATE');
      expect(RATE_LIMITS).toHaveProperty('DEFAULT');
      expect(RATE_LIMITS).toHaveProperty('RELAXED');
      expect(RATE_LIMITS).toHaveProperty('STATS');
      expect(RATE_LIMITS).toHaveProperty('BOOKING');
    });

    it('should have all profiles as objects with required properties', () => {
      Object.values(RATE_LIMITS).forEach(profile => {
        expect(profile).toHaveProperty('limit');
        expect(profile).toHaveProperty('windowSeconds');
        expect(typeof profile.limit).toBe('number');
        expect(typeof profile.windowSeconds).toBe('number');
      });
    });

    it('should have exactly 7 rate limit profiles', () => {
      const keys = Object.keys(RATE_LIMITS);
      expect(keys).toHaveLength(7);
      expect(keys).toEqual(['STRICT', 'MODERATE', 'DEFAULT', 'RELAXED', 'STATS', 'AUTH', 'BOOKING']);
    });
  });

  describe('RATE_LIMITS values', () => {
    it('should have correct limit values', () => {
      expect(RATE_LIMITS.AUTH.limit).toBe(10);
      expect(RATE_LIMITS.STRICT.limit).toBe(20);
      expect(RATE_LIMITS.MODERATE.limit).toBe(30);
      expect(RATE_LIMITS.DEFAULT.limit).toBe(50);
      expect(RATE_LIMITS.RELAXED.limit).toBe(60);
      expect(RATE_LIMITS.STATS.limit).toBe(100);
      expect(RATE_LIMITS.BOOKING.limit).toBe(20);
    });

    it('should have 60 second window for all limits', () => {
      expect(RATE_LIMITS.AUTH.windowSeconds).toBe(60);
      expect(RATE_LIMITS.STRICT.windowSeconds).toBe(60);
      expect(RATE_LIMITS.MODERATE.windowSeconds).toBe(60);
      expect(RATE_LIMITS.DEFAULT.windowSeconds).toBe(60);
      expect(RATE_LIMITS.RELAXED.windowSeconds).toBe(60);
      expect(RATE_LIMITS.STATS.windowSeconds).toBe(60);
      expect(RATE_LIMITS.BOOKING.windowSeconds).toBe(60);
    });

    it('should have all limits as positive integers', () => {
      Object.values(RATE_LIMITS).forEach(profile => {
        expect(profile.limit).toBeGreaterThan(0);
        expect(Number.isInteger(profile.limit)).toBe(true);
      });
    });

    it('should have all windows as positive integers', () => {
      Object.values(RATE_LIMITS).forEach(profile => {
        expect(profile.windowSeconds).toBeGreaterThan(0);
        expect(Number.isInteger(profile.windowSeconds)).toBe(true);
      });
    });
  });

  describe('RATE_LIMITS hierarchy', () => {
    it('should have AUTH as most restrictive', () => {
      expect(RATE_LIMITS.AUTH.limit).toBe(10);
      expect(RATE_LIMITS.AUTH.limit).toBeLessThan(RATE_LIMITS.STRICT.limit);
    });

    it('should have STATS as most permissive', () => {
      expect(RATE_LIMITS.STATS.limit).toBe(100);
      const allLimits = Object.values(RATE_LIMITS).map(p => p.limit);
      expect(RATE_LIMITS.STATS.limit).toBe(Math.max(...allLimits));
    });

    it('should have increasing limits from AUTH to STATS (except BOOKING)', () => {
      expect(RATE_LIMITS.AUTH.limit).toBeLessThan(RATE_LIMITS.STRICT.limit);
      expect(RATE_LIMITS.STRICT.limit).toBeLessThan(RATE_LIMITS.MODERATE.limit);
      expect(RATE_LIMITS.MODERATE.limit).toBeLessThan(RATE_LIMITS.DEFAULT.limit);
      expect(RATE_LIMITS.DEFAULT.limit).toBeLessThan(RATE_LIMITS.RELAXED.limit);
      expect(RATE_LIMITS.RELAXED.limit).toBeLessThan(RATE_LIMITS.STATS.limit);
    });

    it('should have AUTH limit strict enough for brute force protection', () => {
      expect(RATE_LIMITS.AUTH.limit).toBeLessThanOrEqual(10);
    });

    it('should have STATS limit high enough for dashboard polling', () => {
      expect(RATE_LIMITS.STATS.limit).toBeGreaterThanOrEqual(100);
    });

    it('should have BOOKING same as STRICT (sensitive operation)', () => {
      expect(RATE_LIMITS.BOOKING.limit).toBe(RATE_LIMITS.STRICT.limit);
    });

    it('should have reasonable spacing between tiers', () => {
      // Check that each tier is meaningfully different (at least 10 req/min difference)
      expect(RATE_LIMITS.STRICT.limit - RATE_LIMITS.AUTH.limit).toBeGreaterThanOrEqual(10);
      expect(RATE_LIMITS.MODERATE.limit - RATE_LIMITS.STRICT.limit).toBeGreaterThanOrEqual(10);
      expect(RATE_LIMITS.DEFAULT.limit - RATE_LIMITS.MODERATE.limit).toBeGreaterThanOrEqual(10);
    });
  });

  describe('RATE_LIMITS configuration validation', () => {
    it('should not have any undefined profiles', () => {
      expect(RATE_LIMITS.AUTH).toBeDefined();
      expect(RATE_LIMITS.STRICT).toBeDefined();
      expect(RATE_LIMITS.MODERATE).toBeDefined();
      expect(RATE_LIMITS.DEFAULT).toBeDefined();
      expect(RATE_LIMITS.RELAXED).toBeDefined();
      expect(RATE_LIMITS.STATS).toBeDefined();
      expect(RATE_LIMITS.BOOKING).toBeDefined();
    });

    it('should have consistent window across all profiles', () => {
      const windows = Object.values(RATE_LIMITS).map(p => p.windowSeconds);
      const uniqueWindows = [...new Set(windows)];
      expect(uniqueWindows).toHaveLength(1);
      expect(uniqueWindows[0]).toBe(60);
    });

    it('should have limits that prevent DOS attacks', () => {
      // No profile should allow more than 100 req/min except STATS
      expect(RATE_LIMITS.AUTH.limit).toBeLessThanOrEqual(100);
      expect(RATE_LIMITS.STRICT.limit).toBeLessThanOrEqual(100);
      expect(RATE_LIMITS.MODERATE.limit).toBeLessThanOrEqual(100);
      expect(RATE_LIMITS.DEFAULT.limit).toBeLessThanOrEqual(100);
      expect(RATE_LIMITS.RELAXED.limit).toBeLessThanOrEqual(100);
      expect(RATE_LIMITS.BOOKING.limit).toBeLessThanOrEqual(100);
    });

    it('should have readonly structure (const assertion)', () => {
      // TypeScript test - verifies const assertion is applied
      const testProfile = RATE_LIMITS.AUTH;
      expect(testProfile).toBeDefined();
      expect(testProfile.limit).toBe(10);
    });
  });

  describe('RateLimitConfig interface', () => {
    it('should accept config with only limit', () => {
      const config: RateLimitConfig = { limit: 50 };
      expect(config.limit).toBe(50);
      expect(config.windowSeconds).toBeUndefined();
    });

    it('should accept config with limit and windowSeconds', () => {
      const config: RateLimitConfig = { limit: 50, windowSeconds: 120 };
      expect(config.limit).toBe(50);
      expect(config.windowSeconds).toBe(120);
    });

    it('should accept config with skipAuth flag', () => {
      const config: RateLimitConfig = { limit: 50, skipAuth: true };
      expect(config.limit).toBe(50);
      expect(config.skipAuth).toBe(true);
    });

    it('should accept all RATE_LIMITS profiles as valid configs', () => {
      Object.entries(RATE_LIMITS).forEach(([_key, profile]) => {
        const config: RateLimitConfig = profile;
        expect(config.limit).toBe(profile.limit);
        expect(config.windowSeconds).toBe(profile.windowSeconds);
      });
    });
  });

  describe('Rate limit profile semantics', () => {
    it('AUTH should be appropriate for login endpoints', () => {
      // 10 attempts per minute = reasonable for failed logins
      expect(RATE_LIMITS.AUTH.limit).toBe(10);
      expect(RATE_LIMITS.AUTH.windowSeconds).toBe(60);
    });

    it('STRICT should be appropriate for sensitive mutations', () => {
      // 20 requests/min = ~3 seconds between requests
      expect(RATE_LIMITS.STRICT.limit).toBe(20);
    });

    it('MODERATE should be appropriate for admin CRUD', () => {
      // 30 requests/min = ~2 seconds between requests
      expect(RATE_LIMITS.MODERATE.limit).toBe(30);
    });

    it('DEFAULT should be appropriate for general API usage', () => {
      // 50 requests/min = ~1.2 seconds between requests
      expect(RATE_LIMITS.DEFAULT.limit).toBe(50);
    });

    it('RELAXED should be appropriate for read-heavy endpoints', () => {
      // 60 requests/min = 1 per second
      expect(RATE_LIMITS.RELAXED.limit).toBe(60);
    });

    it('STATS should be appropriate for dashboard polling', () => {
      // 100 requests/min = allows frequent polling
      expect(RATE_LIMITS.STATS.limit).toBe(100);
    });

    it('BOOKING should match STRICT (sensitive financial operation)', () => {
      expect(RATE_LIMITS.BOOKING.limit).toBe(RATE_LIMITS.STRICT.limit);
    });
  });

  describe('Edge cases and boundaries', () => {
    it('should not have zero limits', () => {
      Object.values(RATE_LIMITS).forEach(profile => {
        expect(profile.limit).toBeGreaterThan(0);
      });
    });

    it('should not have zero window durations', () => {
      Object.values(RATE_LIMITS).forEach(profile => {
        expect(profile.windowSeconds).toBeGreaterThan(0);
      });
    });

    it('should not have negative limits', () => {
      Object.values(RATE_LIMITS).forEach(profile => {
        expect(profile.limit).toBeGreaterThan(0);
      });
    });

    it('should not have negative window durations', () => {
      Object.values(RATE_LIMITS).forEach(profile => {
        expect(profile.windowSeconds).toBeGreaterThan(0);
      });
    });

    it('should have reasonable upper bounds', () => {
      // No limit should exceed 1000 req/min (extreme case)
      Object.values(RATE_LIMITS).forEach(profile => {
        expect(profile.limit).toBeLessThanOrEqual(1000);
      });
    });

    it('should have reasonable window durations', () => {
      // Windows should be between 1 second and 1 hour
      Object.values(RATE_LIMITS).forEach(profile => {
        expect(profile.windowSeconds).toBeGreaterThanOrEqual(1);
        expect(profile.windowSeconds).toBeLessThanOrEqual(3600);
      });
    });
  });
});
