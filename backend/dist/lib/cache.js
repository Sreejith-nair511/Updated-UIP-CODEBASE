"use strict";
/**
 * In-memory caching layer for ML predictions and zone summaries
 * In production, this should be replaced with Redis
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheTTL = exports.CacheKeys = exports.cache = exports.MemoryCache = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("./logger");
class MemoryCache {
    constructor(defaultTTL = 300000) {
        this.defaultTTL = defaultTTL;
        this.cache = new Map();
        // Clean up expired entries every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
    }
    set(key, data, ttl) {
        const entry = {
            data,
            timestamp: Date.now(),
            ttl: ttl ?? this.defaultTTL,
        };
        this.cache.set(key, entry);
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
    cleanup() {
        const now = Date.now();
        let expiredCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
                expiredCount++;
            }
        }
        if (expiredCount > 0) {
            logger_1.logger.debug(`Cache cleanup: removed ${expiredCount} expired entries`);
        }
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}
exports.MemoryCache = MemoryCache;
// Singleton cache instance
exports.cache = new MemoryCache();
// Cache key generators
exports.CacheKeys = {
    mlPrediction: (features) => {
        // Create deterministic hash of features for caching identical predictions
        const normalized = JSON.stringify(features, Object.keys(features).sort());
        return `ml:prediction:${crypto_1.default.createHash('md5').update(normalized).digest('hex')}`;
    },
    zoneSummary: (zoneId) => {
        return `zone:summary:${zoneId}`;
    },
    pipeLatestReading: (pipeId) => {
        return `pipe:latest:${pipeId}`;
    },
    alertsActive: () => {
        return 'alerts:active';
    },
};
// Cache TTL constants (in milliseconds)
exports.CacheTTL = {
    ML_PREDICTION: 300000, // 5 minutes
    ZONE_SUMMARY: 300000, // 5 minutes  
    PIPE_READING: 60000, // 1 minute
    ALERTS_ACTIVE: 30000, // 30 seconds
};
//# sourceMappingURL=cache.js.map