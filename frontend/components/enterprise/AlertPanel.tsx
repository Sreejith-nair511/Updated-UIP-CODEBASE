"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Alert } from "@/lib/supabase/types";

const ACTIONS: Record<string, string> = {
  major_leak:     "Inspect pipe joint immediately",
  minor_leak:     "Schedule maintenance within 24h",
  anomaly:        "Monitor closely — elevated risk",
  pressure_spike: "Reduce system pressure",
};

const ICONS: Record<string, React.ReactNode> = {
  major_leak:     <AlertTriangle className="w-4 h-4 text-danger-500" />,
  minor_leak:     <AlertTriangle className="w-4 h-4 text-warning-500" />,
  anomaly:        <Zap className="w-4 h-4 text-purple-500" />,
  pressure_spike: <Clock className="w-4 h-4 text-orange-500" />,
};

interface AlertPanelProps {
  alerts: Alert[];
  onAcknowledge?: (id: string) => void;
}

export function AlertPanel({ alerts, onAcknowledge }: AlertPanelProps) {
  const active = alerts.filter((a) => a.status === "active").slice(0, 5);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {active.length > 0 && <span className="w-2 h-2 rounded-full bg-danger-500 animate-pulse" />}
          <h3 className="text-sm font-semibold" style={{ color: "rgb(var(--text-primary))" }}>
            Alert Intelligence
          </h3>
        </div>
        <span className={cn("badge text-xs", active.length > 0 ? "bg-danger-100 text-danger-700 border-danger-200" : "bg-success-100 text-success-700 border-success-200")}>
          {active.length > 0 ? `${active.length} Active` : "All Clear"}
        </span>
      </div>

      {active.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2">
          <CheckCircle className="w-8 h-8 text-success-500" />
          <p className="text-sm text-success-600 font-medium">No active alerts</p>
          <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>All pipes operating normally</p>
        </div>
      ) : (
        <div className="space-y-2">
          {active.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "rounded-xl p-3 border-l-4",
                alert.alert_type === "major_leak" ? "border-l-danger-500 bg-danger-50/40" :
                alert.alert_type === "minor_leak" ? "border-l-warning-500 bg-warning-50/40" :
                "border-l-purple-500 bg-purple-50/40"
              )}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">{ICONS[alert.alert_type]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "rgb(var(--text-primary))" }}>
                    {alert.message}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgb(var(--text-muted))" }}>
                    Pipe {alert.pipe_id} · Zone {alert.zone_id} · {alert.severity_pct}%
                  </p>
                  <p className="text-xs mt-1 font-medium text-brand-600">
                    → {ACTIONS[alert.alert_type]}
                  </p>
                </div>
                {onAcknowledge && (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="text-xs px-2 py-1 rounded-lg border transition-colors flex-shrink-0"
                    style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--text-muted))" }}
                  >
                    ACK
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}