/**
 * In-memory caching layer for ML predictions and zone summaries
 * In production, this should be replaced with Redis
 */

import crypto from 'crypto';
import { logger } from './logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private defaultTTL: number = 300000) { // 5 minutes default
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    };
    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.debug(`Cache cleanup: removed ${expiredCount} expired entries`);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Singleton cache instance
export const cache = new MemoryCache();

// Cache key generators
export const CacheKeys = {
  mlPrediction: (features: Record<string, any>): string => {
    // Create deterministic hash of features for caching identical predictions
    const normalized = JSON.stringify(features, Object.keys(features).sort());
    return `ml:prediction:${crypto.createHash('md5').update(normalized).digest('hex')}`;
  },
  
  zoneSummary: (zoneId: string): string => {
    return `zone:summary:${zoneId}`;
  },
  
  pipeLatestReading: (pipeId: string): string => {
    return `pipe:latest:${pipeId}`;
  },
  
  alertsActive: (): string => {
    return 'alerts:active';
  },
};

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
  ML_PREDICTION: 300000,    // 5 minutes
  ZONE_SUMMARY: 300000,     // 5 minutes  
  PIPE_READING: 60000,      // 1 minute
  ALERTS_ACTIVE: 30000,     // 30 seconds
};