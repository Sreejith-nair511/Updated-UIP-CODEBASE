/**
 * Circuit Breaker pattern implementation for ML service calls
 * Prevents cascading failures and provides graceful degradation
 */
export declare enum CircuitState {
    CLOSED = "CLOSED",// Normal operation
    OPEN = "OPEN",// Circuit is open, calls fail fast
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerOptions {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
    successThreshold: number;
}
export declare class CircuitBreaker {
    private options;
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime;
    private nextAttemptTime;
    constructor(options: CircuitBreakerOptions);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    getState(): CircuitState;
    getStats(): {
        state: CircuitState;
        failureCount: number;
        successCount: number;
        lastFailureTime: number;
        nextAttemptTime: number;
    };
    forceOpen(): void;
    forceClose(): void;
}
//# sourceMappingURL=circuit-breaker.d.ts.map