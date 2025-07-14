import { useCallback, useEffect } from 'react';
import { sanitizeInput, validateEmail, validateUrl, checkRateLimit, auditLog } from '@/lib/securityGamified';

export const useSecurityGamified = () => {
  useEffect(() => {
    auditLog.info('Security hook initialized');
    const handleError = (event: ErrorEvent) => {
      auditLog.error('JavaScript error detected', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
      });
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const validateAndSanitizeForm = useCallback((formData: Record<string, any>) => {
    const sanitized: Record<string, any> = {};
    const errors: string[] = [];
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
        if (key.toLowerCase().includes('email') && !validateEmail(value)) {
          errors.push(`Invalid email format for ${key}`);
        }
        if (key.toLowerCase().includes('url') && value && !validateUrl(value)) {
          errors.push(`Invalid URL format for ${key}`);
        }
      } else {
        sanitized[key] = value;
      }
    });
    return { sanitized, errors, isValid: errors.length === 0 };
  }, []);

  const checkApiRateLimitWrapper = useCallback((endpoint: string) => {
    const key = `api_${endpoint}`;
    const allowed = checkRateLimit(key, 50, 60000);
    if (!allowed) {
      auditLog.warn('Rate limit exceeded', { endpoint });
    }
    return allowed;
  }, []);

  const validateFileUpload = useCallback((file: File) => {
    const errors: string[] = [];
    if (file.size > 10 * 1024 * 1024) {
      errors.push('File size exceeds 10MB limit');
    }
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed');
    }
    const suspiciousPatterns = /\.(exe|bat|cmd|scr|vbs|js|jar)$/i;
    if (suspiciousPatterns.test(file.name)) {
      errors.push('Suspicious file extension detected');
    }
    return { isValid: errors.length === 0, errors };
  }, []);

  return {
    sanitizeInput,
    validateEmail,
    validateUrl,
    validateAndSanitizeForm,
    checkApiRateLimit: checkApiRateLimitWrapper,
    validateFileUpload,
    auditLog,
  };
};
