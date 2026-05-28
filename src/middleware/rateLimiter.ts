import type { NextFunction, Request, Response } from 'express';
import { config } from '../utils/config.js';

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(request: Request, response: Response, next: NextFunction): void {
  const key = request.ip || request.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = requestCounts.get(key);

  if (!current || current.resetAt < now) {
    requestCounts.set(key, {
      count: 1,
      resetAt: now + config.rateLimitWindowMs,
    });
    next();
    return;
  }

  if (current.count >= config.rateLimitMax) {
    response.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded for this client.',
    });
    return;
  }

  current.count += 1;
  next();
}
