import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

export function notFoundHandler(request: Request, response: Response): void {
  response.status(404).json({
    error: 'Not Found',
    path: request.originalUrl,
  });
}

export function errorHandler(
  error: Error,
  request: Request,
  response: Response,
  _next: NextFunction,
): void {
  logger.error('Unhandled request error', {
    path: request.originalUrl,
    method: request.method,
    error: error.message,
  });

  response.status(500).json({
    error: 'Internal Server Error',
    message: error.message,
  });
}
