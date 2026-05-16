/**
 * Request tracing middleware for correlating requests across services
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from './logger';

declare global {
  namespace Express {
    interface Request {
      traceId?: string;
      startTime?: number;
    }
  }
}

export function tracingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Generate or extract trace ID
  req.traceId = req.headers['x-trace-id'] as string || randomUUID();
  req.startTime = Date.now();

  // Add trace ID to response headers
  res.setHeader('x-trace-id', req.traceId);

  // Log request start
  logger.info('Request started', {
    traceId: req.traceId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || 0);
    logger.info('Request completed', {
      traceId: req.traceId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length'),
    });
  });

  next();
}

export function createTraceHeaders(traceId?: string): Record<string, string> {
  return {
    'x-trace-id': traceId || randomUUID(),
  };
}

export function extractTraceId(req: Request): string {
  return req.traceId || 'unknown';
}