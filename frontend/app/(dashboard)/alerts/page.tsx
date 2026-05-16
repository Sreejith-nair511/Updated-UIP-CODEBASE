"use client";

import { useState } from "react";
import {
  AlertTriangle, CheckCircle, Clock, Zap, Bell,
  ShieldAlert, ShieldCheck, ShieldX, Filter,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRealTimeAlerts } from "@/hooks/useRealTimeAlerts";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { AlertStatus } from "@/lib/supabase/types";

/* ── Types ── */
const FILTERS: { label: string; value: AlertStatus | "all" }[] = [
  { label: "All",           value: "all"          },
  { label: "Active",        value: "active"       },
  { label: "Acknowledged",  value: "acknowledged" },
  { label: "Resolved",      value: "resolved"     },
];

const TYPE_META: Record<string, { icon: React.ElementType; accent: string; darkBg: string; lightBg: string }> = {
  major_leak:     { icon: ShieldX,     accent: "#ef4444", darkBg: "rgb(127 29 29 / 0.2)",  lightBg: "rgb(254 242 242)" },
  minor_leak:     { icon: ShieldAlert, accent: "#f59e0b", darkBg: "rgb(120 53 15 / 0.2)",  lightBg: "rgb(255 251 235)" },
  anomaly:        { icon: Zap,         accent: "#8b5cf6", darkBg: "rgb(88 28 135 / 0.2)",  lightBg: "rgb(245 243 255)" },
  pressure_spike: { icon: Bell,        accent: "#f97316", darkBg: "rgb(124 45 18 / 0.2)",  lightBg: "rgb(255 247 237)" },
};

/* ── Stat card ── */
function StatCard({ label, count, accent, icon: Icon }: {
  label: string; count: number; accent: string; icon: React.ElementType;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}18` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-2xl font-bold tabular" style={{ color: accent }}>{count}</p>
        <p className="text-xs font-medium mt-0.5" style={{ color: "rgb(var(--text-muted))" }}>{label}</p>
      </div>
    </div>
  );
}

/* ── Alert card ── */
function AlertCard({ alert, onAck, onResolve }: {
  alert: any;
  onAck: () => void;
  onResolve: () => void;
}) {
  const meta = TYPE_META[alert.alert_type] ?? TYPE_META.anomaly;
  const Icon = meta.icon;
  const prob = alert.leak_probability ?? 0;

  return (
    <div className="card overflow-hidden animate-slide-up group">
      {/* Accent bar */}
      <div className="h-0.5 w-full" style={{ background: meta.accent }} />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: `${meta.accent}18` }}>
            <Icon className="w-4.5 h-4.5" style={{ color: meta.accent, width: 18, height: 18 }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-snug" style={{ color: "rgb(var(--text-primary))" }}>
                  {alert.message}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md"
                    style={{ background: "rgb(var(--bg-tertiary))", color: "rgb(var(--text-secondary))" }}>
                    {alert.pipe_id}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md"
                    style={{ background: "rgb(var(--bg-tertiary))", color: "rgb(var(--text-secondary))" }}>
                    {alert.zone_id}
                  </span>
                  <span className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>
                    {formatRelativeTime(alert.created_at)}
                  </span>
                </div>
              </div>

              {/* Severity badge */}
              <div className="flex-shrink-0">
                {alert.severity_pct > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: `${meta.accent}18`,
                      color: meta.accent,
                      border: `1px solid ${meta.accent}30`,
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: meta.accent }} />
                    {alert.severity_pct}%
                  </span>
                ) : (
                  <span className="pill pill-green">
                    <CheckCircle className="w-3 h-3" /> Clear
                  </span>
                )}
              </div>
            </div>

            {/* Probability bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "rgb(var(--text-muted))" }}>
                  Leak Probability
                </span>
                <span className="text-xs font-bold tabular" style={{ color: meta.accent }}>
                  {(prob * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgb(var(--bg-tertiary))" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${prob * 100}%`, background: meta.accent }} />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2">
              {alert.status === "active" && (
                <>
                  <button onClick={onAck}
                    className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Acknowledge
                  </button>
                  <button onClick={onResolve}
                    className="btn-primary text-xs py-1.5 px-3 gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                </>
              )}
              {alert.status === "acknowledged" && (
                <>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                    <Clock className="w-3 h-3" /> Acknowledged
                  </span>
                  <button onClick={onResolve}
                    className="btn-primary text-xs py-1.5 px-3 gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Mark Resolved
                  </button>
                </>
              )}
              {alert.status === "resolved" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                  <CheckCircle className="w-3 h-3" /> Resolved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ── */
function Empty({ filter }: { filter: string }) {
  return (
    <div className="card p-16 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-4">
        <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
      </div>
      <p className="text-base font-semibold" style={{ color: "rgb(var(--text-primary))" }}>
        {filter === "active" ? "All clear" : "No alerts"}
      </p>
      <p className="text-sm mt-1" style={{ color: "rgb(var(--text-muted))" }}>
        {filter === "active"
          ? "No active leaks detected right now."
          : "No alerts match this filter."}
      </p>
    </div>
  );
}

/* ── Page ── */
export default function AlertsPage() {
  const [filter, setFilter] = useState<AlertStatus | "all">("all");
  const { user } = useUser();
  const { alerts, loading, activeCount, acknowledgeAlert, resolveAlert } = useRealTimeAlerts();

  const filtered = alerts.filter(a => filter === "all" || a.status === filter);

  const counts = {
    active:       alerts.filter(a => a.status === "active").length,
    acknowledged: alerts.filter(a => a.status === "acknowledged").length,
    resolved:     alerts.filter(a => a.status === "resolved").length,
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "rgb(var(--text-primary))" }}>
            Leak Alerts
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "rgb(var(--text-muted))" }}>
            {activeCount} active · {alerts.length} total
          </p>
        </div>
        {activeCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
            style={{
              background: "rgb(127 29 29 / 0.1)",
              borderColor: "rgb(127 29 29 / 0.3)",
            }}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-500">{activeCount} Active</span>
          </div>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active"       count={counts.active}       accent="#ef4444" icon={ShieldX}     />
        <StatCard label="Acknowledged" count={counts.acknowledged} accent="#f59e0b" icon={ShieldAlert} />
        <StatCard label="Resolved"     count={counts.resolved}     accent="#10b981" icon={ShieldCheck} />
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit"
        style={{ background: "rgb(var(--bg-tertiary))", border: "1px solid rgb(var(--border))" }}>
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={cn(
              "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150",
              filter === f.value
                ? "bg-indigo-600 text-white shadow-sm"
                : "hover:bg-[rgb(var(--bg-primary))]"
            )}
            style={filter !== f.value ? { color: "rgb(var(--text-secondary))" } : undefined}>
            {f.label}
            {f.value !== "all" && (
              <span className={cn(
                "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                filter === f.value ? "bg-white/20 text-white" : "bg-[rgb(var(--border))]"
              )}
                style={filter !== f.value ? { color: "rgb(var(--text-muted))" } : undefined}>
                {f.value === "active" ? counts.active : f.value === "acknowledged" ? counts.acknowledged : counts.resolved}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Alert list ── */}
      {filtered.length === 0 ? (
        <Empty filter={filter} />
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAck={() => acknowledgeAlert(alert.id, user?.id ?? "admin")}
              onResolve={() => resolveAlert(alert.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
