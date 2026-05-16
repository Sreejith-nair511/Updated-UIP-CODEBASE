/**
 * Structured error handling for the Digital Stethoscope API
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly code?: string;
    constructor(message: string, statusCode?: number, isOperational?: boolean, code?: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: any);
}
export declare class MLServiceError extends AppError {
    constructor(message: string, originalError?: Error);
}
export declare class DatabaseError extends AppError {
    constructor(message: string, originalError?: Error);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
/**
 * Global error handler middleware
 */
export declare function errorHandler(err: Error, req: any, res: any, next: any): any;
//# sourceMappingURL=errors.d.ts.map