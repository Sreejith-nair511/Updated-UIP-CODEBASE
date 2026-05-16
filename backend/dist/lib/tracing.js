"use strict";
/**
 * Request tracing middleware for correlating requests across services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tracingMiddleware = tracingMiddleware;
exports.createTraceHeaders = createTraceHeaders;
exports.extractTraceId = extractTraceId;
const crypto_1 = require("crypto");
const logger_1 = require("./logger");
function tracingMiddleware(req, res, next) {
    // Generate or extract trace ID
    req.traceId = req.headers['x-trace-id'] || (0, crypto_1.randomUUID)();
    req.startTime = Date.now();
    // Add trace ID to response headers
    res.setHeader('x-trace-id', req.traceId);
    // Log request start
    logger_1.logger.info('Request started', {
        traceId: req.traceId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
    });
    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - (req.startTime || 0);
        logger_1.logger.info('Request completed', {
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
function createTraceHeaders(traceId) {
    return {
        'x-trace-id': traceId || (0, crypto_1.randomUUID)(),
    };
}
function extractTraceId(req) {
    return req.traceId || 'unknown';
}
//# sourceMappingURL=tracing.js.map