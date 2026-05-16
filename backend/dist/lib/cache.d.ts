/**
 * In-memory caching layer for ML predictions and zone summaries
 * In production, this should be replaced with Redis
 */
export declare class MemoryCache {
    private defaultTTL;
    private cache;
    private cleanupInterval;
    constructor(defaultTTL?: number);
    set<T>(key: string, data: T, ttl?: number): void;
    get<T>(key: string): T | null;
    delete(key: string): boolean;
    clear(): void;
    size(): number;
    private cleanup;
    destroy(): void;
}
export declare const cache: MemoryCache;
export declare const CacheKeys: {
    mlPrediction: (features: Record<string, any>) => string;
    zoneSummary: (zoneId: string) => string;
    pipeLatestReading: (pipeId: string) => string;
    alertsActive: () => string;
};
export declare const CacheTTL: {
    ML_PREDICTION: number;
    ZONE_SUMMARY: number;
    PIPE_READING: number;
    ALERTS_ACTIVE: number;
};
//# sourceMappingURL=cache.d.ts.map