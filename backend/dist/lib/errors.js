"use strict";
/**
 * Structured error handling for the Digital Stethoscope API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.NotFoundError = exports.AuthenticationError = exports.DatabaseError = exports.MLServiceError = exports.ValidationError = exports.AppError = void 0;
exports.errorHandler = errorHandler;
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 400, true, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class MLServiceError extends AppError {
    constructor(message, originalError) {
        super(`ML Service Error: ${message}`, 503, true, 'ML_SERVICE_ERROR');
        this.name = 'MLServiceError';
        if (originalError) {
            this.stack = originalError.stack;
        }
    }
}
exports.MLServiceError = MLServiceError;
class DatabaseError extends AppError {
    constructor(message, originalError) {
        super(`Database Error: ${message}`, 500, true, 'DATABASE_ERROR');
        this.name = 'DatabaseError';
        if (originalError) {
            this.stack = originalError.stack;
        }
    }
}
exports.DatabaseError = DatabaseError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, true, 'AUTH_ERROR');
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class NotFoundError extends AppError {
    constructor(resource) {
        super(`${resource} not found`, 404, true, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, true, 'RATE_LIMIT');
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: {
                message: err.message,
                code: err.code,
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
            },
        });
    }
    // Unhandled errors
    console.error('Unhandled error:', err);
    return res.status(500).json({
        error: {
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
            ...(process.env.NODE_ENV === 'development' && {
                originalMessage: err.message,
                stack: err.stack
            }),
        },
    });
}
//# sourceMappingURL=errors.js.map