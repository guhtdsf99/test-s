/**
 * Security utilities for CSWORD platform (Gamified copy)
 * Implements secure coding practices and input validation
 */

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove potential XSS vectors
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Email validation with security considerations
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const sanitized = sanitizeInput(email);
  return emailRegex.test(sanitized) && sanitized.length <= 254; // RFC 5321 limit
};

// URL validation for secure redirects
export const validateUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// Secure random ID generation
export const generateSecureId = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Rate limiting helper (client-side tracking)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export const checkRateLimit = (key: string, maxRequests = 10, windowMs = 60000): boolean => {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count++;
  return true;
};

// Content Security Policy helper
export const getCSPHeader = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' ws: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
};

// Secure session storage helpers
export const secureStorage = {
  set: (key: string, value: any): void => {
    try {
      const sanitizedKey = sanitizeInput(key);
      const data = JSON.stringify(value);
      sessionStorage.setItem(sanitizedKey, data);
    } catch (error) {
      console.error('Failed to store data securely:', error);
    }
  },
  get: (key: string): any => {
    try {
      const sanitizedKey = sanitizeInput(key);
      const data = sessionStorage.getItem(sanitizedKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      return null;
    }
  },
  remove: (key: string): void => {
    try {
      const sanitizedKey = sanitizeInput(key);
      sessionStorage.removeItem(sanitizedKey);
    } catch (error) {
      console.error('Failed to remove data securely:', error);
    }
  },
};

// Security audit logging
export const auditLog = {
  info: (action: string, details?: any): void => {
    console.info(`[SECURITY AUDIT] ${action}`, details);
  },
  warn: (action: string, details?: any): void => {
    console.warn(`[SECURITY WARNING] ${action}`, details);
  },
  error: (action: string, details?: any): void => {
    console.error(`[SECURITY ERROR] ${action}`, details);
  },
};
