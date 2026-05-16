"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Reading } from "@/lib/supabase/types";

// Module-level singleton — prevents duplicate subscriptions under React StrictMode
const _supabase = createClient();

interface UseRealTimeReadingsOptions {
  pipeId?: string;
  zoneId?: string;
  limit?: number;
}

export function useRealTimeReadings({
  pipeId,
  zoneId,
  limit = 50,
}: UseRealTimeReadingsOptions = {}) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const channelRef = useRef<string | null>(null);

  const fetchReadings = useCallback(async () => {
    try {
      let query = _supabase
        .from("readings")
        .select("*")
        .order("reading_date", { ascending: false })
        .order("reading_time", { ascending: false })
        .limit(limit);

      if (pipeId) query = query.eq("pipe_id", pipeId);
      if (zoneId) query = query.eq("zone_id", zoneId);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setReadings(data ?? []);
      setError(null);
      retryCountRef.current = 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch readings");
    } finally {
      setLoading(false);
    }
  }, [pipeId, zoneId, limit]);

  const setupRealtimeSubscription = useCallback(() => {
    const channelName = `readings-realtime-${pipeId ?? "all"}-${zoneId ?? "all"}`;

    // Remove existing channel before re-subscribing
    const existing = _supabase
      .getChannels()
      .find((ch) => ch.topic === `realtime:${channelName}`);
    if (existing) _supabase.removeChannel(existing);

    _supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "readings",
          ...(pipeId ? { filter: `pipe_id=eq.${pipeId}` } : {}),
        },
        (payload) => {
          const newReading = payload.new as Reading;
          setReadings((prev) => [newReading, ...prev.slice(0, limit - 1)]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "readings",
          ...(pipeId ? { filter: `pipe_id=eq.${pipeId}` } : {}),
        },
        (payload) => {
          const updated = payload.new as Reading;
          setReadings((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r))
          );
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          setError(null);
          retryCountRef.current = 0;
        } else if (status === "CHANNEL_ERROR") {
          console.error("Readings subscription error:", err);
          setError("Real-time connection failed");
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
          retryCountRef.current += 1;
          setTimeout(setupRealtimeSubscription, delay);
        }
      });

    channelRef.current = channelName;
  }, [pipeId, zoneId, limit]);

  useEffect(() => {
    fetchReadings();
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        const ch = _supabase
          .getChannels()
          .find((c) => c.topic === `realtime:${channelRef.current}`);
        if (ch) _supabase.removeChannel(ch);
      }
    };
  }, [fetchReadings, setupRealtimeSubscription]);

  return {
    readings,
    loading,
    error,
    refetch: fetchReadings,
  };
}
