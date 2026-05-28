import type { NextFunction, Request, Response } from 'express';
import { config } from '../utils/config.js';

function extractBearerToken(request: Request): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length).trim();
}

export function requireAdmin(request: Request, response: Response, next: NextFunction): void {
  const adminKey = request.header('x-admin-key');
  const bearer = extractBearerToken(request);

  if (adminKey === config.adminApiKey || bearer === config.adminApiKey) {
    next();
    return;
  }

  response.status(401).json({
    error: 'Unauthorized',
    message: 'Developer credentials are required for this endpoint.',
  });
}
