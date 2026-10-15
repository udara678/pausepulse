import rateLimit from 'express-rate-limit';

// Global API rate limiter: 120 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

// Strict Auth rate limiter: 5 attempts per 15 minutes per IP (Brute-force protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    error: 'Too many login/registration attempts. Account access throttled for 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});

// License verification limiter: 15 requests per 10 minutes (Anti-key-enumeration protection)
export const licenseLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many license verification requests. Please try again later.',
    code: 'LICENSE_RATE_LIMIT_EXCEEDED',
  },
});

// Checkout creation limiter: 10 sessions per 15 minutes
export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many checkout requests. Please wait a few moments before trying again.',
    code: 'CHECKOUT_RATE_LIMIT_EXCEEDED',
  },
});

// Sync activity limiter: 60 sync operations per 15 minutes
export const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Sync rate limit exceeded. Sync will resume shortly.',
    code: 'SYNC_RATE_LIMIT_EXCEEDED',
  },
});
