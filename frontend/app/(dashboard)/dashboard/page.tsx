"use client";

import { useMemo } from "react";
import {
  Droplets, AlertTriangle, Activity, Gauge,
  TrendingUp, TrendingDown, Minus, Zap, Wifi,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useRealTimeReadings } from "@/hooks/useRealTimeReadings";
import { useRealTimeAlerts }   from "@/hooks/useRealTimeAlerts";
import { SeverityBadge }       from "@/components/ui/SeverityBadge";
import { PageLoader }          from "@/components/ui/LoadingSpinner";
import { formatFrequency, formatPressure, formatFlow, cn } from "@/lib/utils";

/* ── Trend chip ─────────────────────────────────────────────────────────────── */
function Trend({ current, prev }: { current: number; prev: number }) {
  if (!prev) return null;
  const diff = current - prev;
  const pct  = Math.abs(Math.round((diff / prev) * 100));
  if (Math.abs(diff) < 0.01)
    return <span className="inline-flex items-center gap-0.5 text-xs text-gray-400 font-medium"><Minus className="w-3 h-3" /> stable</span>;
  return diff > 0
    ? <span className="inline-flex items-center gap-0.5 text-xs text-red-500 font-medium"><ArrowUpRight className="w-3 h-3" />+{pct}%</span>
    : <span className="inline-flex items-center gap-0.5 text-xs text-emerald-500 font-medium"><ArrowDownRight className="w-3 h-3" />-{pct}%</span>;
}

/* ── KPI card ───────────────────────────────────────────────────────────────── */
function KpiCard({
  label, value, sub, icon: Icon, color, trend,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string;
  trend?: { current: number; prev: number };
}) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="metric-label">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div>
        <p className="metric-value" style={{ color }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "rgb(var(--text-muted))" }}>{sub}</p>}
      </div>
      {trend && <Trend current={trend.current} prev={trend.prev} />}
    </div>
  );
}

/* ── Chart wrapper ──────────────────────────────────────────────────────────── */
function ChartCard({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <span className="card-title">{title}</span>
        {badge && <span className="pill pill-gray">{badge}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { readings, loading } = useRealTimeReadings({ limit: 60 });
  const { alerts, activeCount } = useRealTimeAlerts(true);

  const stats = useMemo(() => {
    if (!readings.length) return null;
    const leaks = readings.filter(r => r.leak);
    const avg   = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const half  = Math.floor(readings.length / 2);
    return {
      leakRate:    Math.round((leaks.length / readings.length) * 100),
      avgPressure: avg(readings.map(r => r.pressure_bar)),
      avgFlow:     avg(readings.map(r => r.flow_lpm)),
      maxFreq:     Math.max(...readings.map(r => r.frequency_hz)),
      totalLeaks:  leaks.length,
      prevPressure: avg(readings.slice(half).map(r => r.pressure_bar)),
      prevFlow:     avg(readings.slice(half).map(r => r.flow_lpm)),
    };
  }, [readings]);

  const chartData = useMemo(() =>
    [...readings].reverse().slice(-24).map(r => ({
      t:    r.reading_time?.slice(0, 5) ?? "",
      sev:  r.severity_pct,
      anom: parseFloat((r.anomaly_score * 100).toFixed(1)),
      freq: r.frequency_hz,
      pres: r.pressure_bar,
      flow: r.flow_lpm,
    })), [readings]);

  const zoneData = useMemo(() => {
    const z: Record<string, { leaks: number; total: number }> = {};
    readings.forEach(r => {
      if (!z[r.zone_id]) z[r.zone_id] = { leaks: 0, total: 0 };
      z[r.zone_id].total++;
      if (r.leak) z[r.zone_id].leaks++;
    });
    return Object.entries(z)
      .map(([zone, d]) => ({ zone, rate: Math.round((d.leaks / d.total) * 100), total: d.total }))
      .sort((a, b) => b.rate - a.rate);
  }, [readings]);

  if (loading) return <PageLoader />;
  const latest = readings[0];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "rgb(var(--text-primary))" }}>
            Overview
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "rgb(var(--text-muted))" }}>
            {readings.length} readings across {zoneData.length} zones
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <span className="pill pill-red">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {activeCount} alert{activeCount > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="pill pill-green">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              All clear
            </span>
          )}
          <span className="pill pill-indigo">
            <Wifi className="w-3 h-3" />
            Live
          </span>
        </div>
      </div>

      {/* ── Active alert banner ── */}
      {activeCount > 0 && alerts[0] && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-900 dark:text-red-200">{alerts[0].message}</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              Pipe {alerts[0].pipe_id} · Zone {alerts[0].zone_id} · {alerts[0].severity_pct}% severity
            </p>
          </div>
          <a href="/alerts"
            className="flex-shrink-0 text-xs font-semibold text-red-700 dark:text-red-300 hover:text-red-800 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
            View all
          </a>
        </div>
      )}

      {/* ── KPI row ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Leak Rate"
            value={`${stats.leakRate}%`}
            sub={`${stats.totalLeaks} of ${readings.length} readings`}
            icon={Droplets}
            color={stats.leakRate > 20 ? "#ef4444" : "#10b981"}
            trend={{ current: stats.leakRate, prev: stats.leakRate * 0.9 }}
          />
          <KpiCard
            label="Avg Pressure"
            value={formatPressure(stats.avgPressure)}
            sub="across all pipes"
            icon={Gauge}
            color="#6366f1"
            trend={{ current: stats.avgPressure, prev: stats.prevPressure }}
          />
          <KpiCard
            label="Avg Flow"
            value={formatFlow(stats.avgFlow)}
            sub="liters per minute"
            icon={Activity}
            color="#06b6d4"
            trend={{ current: stats.avgFlow, prev: stats.prevFlow }}
          />
          <KpiCard
            label="Peak Frequency"
            value={formatFrequency(stats.maxFreq)}
            sub="dominant acoustic peak"
            icon={Zap}
            color="#8b5cf6"
          />
        </div>
      )}

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Severity trend */}
        <ChartCard title="Severity Trend" badge="last 24 readings">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="sevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: "rgb(var(--text-muted))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "rgb(var(--text-muted))" }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 10 }}
                formatter={(v: number) => [`${v}%`, "Severity"]}
              />
              <Area type="monotone" dataKey="sev" stroke="#6366f1" strokeWidth={2} fill="url(#sevGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Frequency */}
        <ChartCard title="Acoustic Frequency" badge={latest ? `${latest.frequency_hz.toFixed(1)} Hz now` : undefined}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: "rgb(var(--text-muted))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "rgb(var(--text-muted))" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}Hz`} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 10 }}
                formatter={(v: number) => [`${v} Hz`, "Frequency"]}
              />
              <Line type="monotone" dataKey="freq" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Pressure & Flow ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Pressure" badge="bar">
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="presGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#06b6d4" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: "rgb(var(--text-muted))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "rgb(var(--text-muted))" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} formatter={(v: number) => [`${v} bar`, "Pressure"]} />
              <Area type="monotone" dataKey="pres" stroke="#06b6d4" strokeWidth={2} fill="url(#presGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Zone leak rates */}
        <ChartCard title="Zone Leak Rates" badge={`${zoneData.length} zones`}>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={zoneData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="zone" tick={{ fontSize: 10, fill: "rgb(var(--text-muted))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "rgb(var(--text-muted))" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} formatter={(v: number) => [`${v}%`, "Leak rate"]} />
              <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Recent readings table ── */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <span className="card-title">Recent Readings</span>
          <span className="pill pill-gray">{readings.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgb(var(--border-subtle))" }}>
                {["Time", "Pipe", "Zone", "Freq (Hz)", "Pressure", "Anomaly", "Status"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "rgb(var(--text-muted))" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {readings.slice(0, 10).map((r, i) => (
                <tr key={r.id}
                  className={cn(
                    "table-row-hover border-b last:border-0",
                    r.leak && "bg-red-50/40 dark:bg-red-950/10"
                  )}
                  style={{ borderColor: "rgb(var(--border-subtle))" }}>
                  <td className="px-5 py-3 font-mono text-xs tabular" style={{ color: "rgb(var(--text-muted))" }}>
                    {r.reading_time?.slice(0, 5)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-semibold" style={{ color: "rgb(var(--text-primary))" }}>{r.pipe_id}</span>
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: "rgb(var(--text-secondary))" }}>{r.zone_id}</td>
                  <td className="px-5 py-3 font-mono text-sm tabular text-violet-600 dark:text-violet-400 font-medium">
                    {r.frequency_hz.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 font-mono text-sm tabular" style={{ color: "rgb(var(--text-secondary))" }}>
                    {r.pressure_bar.toFixed(2)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${r.anomaly_score * 100}%`,
                            background: r.anomaly_score > 0.7 ? "#ef4444" : r.anomaly_score > 0.4 ? "#f59e0b" : "#10b981",
                          }} />
                      </div>
                      <span className="font-mono text-xs tabular" style={{ color: "rgb(var(--text-secondary))" }}>
                        {r.anomaly_score.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><SeverityBadge severity={r.severity_pct} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
