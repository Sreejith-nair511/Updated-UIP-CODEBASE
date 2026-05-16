"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Alert } from "@/lib/supabase/types";
import { toast } from "sonner";

// Module-level singleton — prevents duplicate subscriptions under React StrictMode
const _supabase = createClient();

export function useRealTimeAlerts(activeOnly = false) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const channelRef = useRef<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      let query = _supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (activeOnly) query = query.eq("status", "active");

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setAlerts(data ?? []);
      setError(null);
      retryCountRef.current = 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  const setupRealtimeSubscription = useCallback(() => {
    const channelName = `alerts-realtime-${activeOnly ? "active" : "all"}`;

    // Remove existing channel before creating a new one
    const existing = _supabase
      .getChannels()
      .find((ch) => ch.topic === `realtime:${channelName}`);
    if (existing) _supabase.removeChannel(existing);

    _supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => {
          const newAlert = payload.new as Alert;
          if (activeOnly && newAlert.status !== "active") return;
          setAlerts((prev) => [newAlert, ...prev]);

          const isSerious =
            newAlert.alert_type === "major_leak" || newAlert.severity_pct >= 70;
          if (isSerious) {
            toast.error(`Alert: ${newAlert.message}`, {
              description: `Pipe ${newAlert.pipe_id} · Zone ${newAlert.zone_id} · Severity ${newAlert.severity_pct}%`,
              duration: 8000,
            });
          } else {
            toast.warning(`Warning: ${newAlert.message}`, {
              description: `Pipe ${newAlert.pipe_id} · Zone ${newAlert.zone_id}`,
              duration: 5000,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "alerts" },
        (payload) => {
          const updated = payload.new as Alert;
          setAlerts((prev) => {
            if (activeOnly && updated.status !== "active") {
              return prev.filter((a) => a.id !== updated.id);
            }
            return prev.map((a) => (a.id === updated.id ? updated : a));
          });
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          setError(null);
          retryCountRef.current = 0;
        } else if (status === "CHANNEL_ERROR") {
          console.error("Alert subscription error:", err);
          setError("Real-time connection failed");
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
          retryCountRef.current += 1;
          setTimeout(setupRealtimeSubscription, delay);
        }
      });

    channelRef.current = channelName;
  }, [activeOnly]);

  useEffect(() => {
    fetchAlerts();
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        const ch = _supabase
          .getChannels()
          .find((c) => c.topic === `realtime:${channelRef.current}`);
        if (ch) _supabase.removeChannel(ch);
      }
    };
  }, [fetchAlerts, setupRealtimeSubscription]);

  const acknowledgeAlert = async (alertId: string, userId: string) => {
    // Cast needed: @supabase/ssr v0.3 overload resolution fails with strict Update types
    const { error: updateError } = await (
      _supabase.from("alerts") as any
    )
      .update({
        status: "acknowledged",
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", alertId);

    if (!updateError) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, status: "acknowledged" as const, acknowledged_by: userId }
            : a
        )
      );
    }
    return { error: updateError };
  };

  const resolveAlert = async (alertId: string) => {
    const { error: updateError } = await (
      _supabase.from("alerts") as any
    )
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", alertId);

    if (!updateError) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, status: "resolved" as const } : a
        )
      );
    }
    return { error: updateError };
  };

  const activeCount = alerts.filter((a) => a.status === "active").length;

  return {
    alerts,
    loading,
    error,
    activeCount,
    refetch: fetchAlerts,
    acknowledgeAlert,
    resolveAlert,
  };
}
