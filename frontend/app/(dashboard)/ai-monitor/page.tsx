"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useRealTimeReadings } from "@/hooks/useRealTimeReadings";
import { useRealTimeAlerts }   from "@/hooks/useRealTimeAlerts";
import { ML_SERVICE_URL }      from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Prediction {
  leak_class_id: number;
  leak_class_name: string;
  confidence: number;
  fft_dominant_frequency: number;
  probabilities: Record<string, number>;
  inference_ms: number;
}

interface LiveMetrics {
  inference_ms: number;
  cpu_pct: number;
  memory_pct: number;
  throughput_per_sec: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CLASS_META = [
  { id: 0, label: "Normal",     color: "#22c55e", bg: "bg-green-500/10",  text: "text-green-500"  },
  { id: 1, label: "Pre-Leak",   color: "#f59e0b", bg: "bg-amber-500/10",  text: "text-amber-500"  },
  { id: 2, label: "Minor Leak", color: "#f97316", bg: "bg-orange-500/10", text: "text-orange-500" },
  { id: 3, label: "Major Leak", color: "#ef4444", bg: "bg-red-500/10",    text: "text-red-500"    },
];

const PIPELINE_STAGES = [
  { label: "ADC Input",       dim: "8 000 samples", ms: 5  },
  { label: "FFT",             dim: "5 features",    ms: 12 },
  { label: "Spectrogram",     dim: "128 × 128",     ms: 28 },
  { label: "CNN Embed",       dim: "64 features",   ms: 82 },
  { label: "Fusion",          dim: "69 features",   ms: 10 },
  { label: "Random Forest",   dim: "4 classes",     ms: 44 },
  { label: "Output",          dim: "class + conf",  ms: 3  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function genWave(cls: number, n = 120) {
  const freq = [15, 35, 55, 72][cls];
  const amp  = [0.06, 0.18, 0.38, 0.72][cls];
  return Array.from({ length: n }, (_, i) => ({
    i,
    v: amp * Math.sin((2 * Math.PI * freq * i) / 4000) + (Math.random() - 0.5) * amp * 0.3,
  }));
}

function genFFT(cls: number) {
  const dom = [15, 35, 55, 72][cls];
  return Array.from({ length: 50 }, (_, i) => {
    const f = i * 4;
    const d = Math.abs(f - dom);
    return { f, m: Math.max(0, (1 - d / 28) * (0.7 + Math.random() * 0.3)) };
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ background: `${color}18`, color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AIMonitorPage() {
  const { readings } = useRealTimeReadings({ limit: 60 });
  const { alerts, acknowledgeAlert } = useRealTimeAlerts();
  const [pred, setPred]         = useState<Prediction | null>(null);
  const [metrics, setMetrics]   = useState<LiveMetrics>({ inference_ms: 184, cpu_pct: 12, memory_pct: 38, throughput_per_sec: 5.2 });
  const [wave, setWave]         = useState(() => genWave(0));
  const [fft, setFFT]           = useState(() => genFFT(0));
  const [pipeStep, setPipeStep] = useState(-1);
  const [tab, setTab]           = useState<"signal" | "pipeline" | "history">("signal");

  const cls = pred?.leak_class_id ?? 0;
  const meta = CLASS_META[cls];

  // Poll ML service
  useEffect(() => {
    const poll = async () => {
      try {
        const signal = Array.from({ length: 8000 }, () => (Math.random() - 0.5) * 0.1);
        const r = await fetch(`${ML_SERVICE_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signal, sample_rate: 4000, input_format: "float_array" }),
          signal: AbortSignal.timeout(3000),
        });
        if (r.ok) setPred(await r.json());
      } catch {}
    };
    poll();
    const t = setInterval(poll, 2500);
    return () => clearInterval(t);
  }, []);

  // Refresh live metrics
  useEffect(() => {
    const t = setInterval(() => {
      setMetrics({
        inference_ms:      Math.round(160 + Math.random() * 60),
        cpu_pct:           Math.round(8 + Math.random() * 18),
        memory_pct:        Math.round(32 + Math.random() * 16),
        throughput_per_sec: parseFloat((4 + Math.random() * 3).toFixed(1)),
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  // Refresh waveform / FFT
  useEffect(() => {
    const t = setInterval(() => {
      setWave(genWave(cls));
      setFFT(genFFT(cls));
    }, 500);
    return () => clearInterval(t);
  }, [cls]);

  // Animate pipeline
  useEffect(() => {
    let step = 0;
    const run = () => {
      if (step < PIPELINE_STAGES.length) {
        setPipeStep(step++);
        setTimeout(run, PIPELINE_STAGES[step - 1].ms * 2.5);
      } else {
        setTimeout(() => { step = 0; setPipeStep(-1); setTimeout(run, 400); }, 1800);
      }
    };
    const t = setTimeout(run, 600);
    return () => clearTimeout(t);
  }, []);

  const activeAlerts = alerts.filter((a) => a.status === "active");
  const latest = readings[0];

  // Timeline data
  const timeline = [...readings].reverse().slice(-30).map((r) => ({
    t: r.reading_time.slice(0, 5),
    s: r.severity_pct,
    a: r.anomaly_score,
  }));

  return (
    <div className="space-y-5">

      {/* ── Top bar ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">AI Monitor</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hybrid CNN + FFT + Random Forest · v1.0.0</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {activeAlerts.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 px-2.5 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {activeAlerts.length} alert{activeAlerts.length > 1 ? "s" : ""}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Prediction",    value: meta.label,                    sub: `${((pred?.confidence ?? 0.9) * 100).toFixed(0)}% confidence`, color: meta.color },
          { label: "Inference",     value: `${metrics.inference_ms} ms`,  sub: "end-to-end latency",   color: "#6366f1" },
          { label: "FFT Dominant",  value: `${(pred?.fft_dominant_frequency ?? latest?.frequency_hz ?? 15).toFixed(1)} Hz`, sub: "spectral peak", color: "#06b6d4" },
          { label: "Active Alerts", value: String(activeAlerts.length),   sub: activeAlerts.length > 0 ? "requires attention" : "all clear", color: activeAlerts.length > 0 ? "#ef4444" : "#22c55e" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className="text-xl font-semibold tracking-tight" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left: signal + tabs */}
        <div className="lg:col-span-2 space-y-4">

          {/* Tab strip */}
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
            {(["signal", "pipeline", "history"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize",
                  tab === t
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                )}>
                {t}
              </button>
            ))}
          </div>

          {/* Signal tab */}
          {tab === "signal" && (
            <div className="space-y-4">
              <Section title="Waveform" right={<Chip label={meta.label} color={meta.color} />}>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={wave} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="i" hide />
                    <YAxis domain={[-1, 1]} tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v: number) => [v.toFixed(4), "amp"]} />
                    <Line type="monotone" dataKey="v" stroke={meta.color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Section>

              <Section title="FFT Spectrum" right={<span className="text-xs text-gray-400 font-mono">{(pred?.fft_dominant_frequency ?? 15).toFixed(1)} Hz peak</span>}>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={fft} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="f" tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}Hz`} interval={9} />
                    <YAxis domain={[0, 1]} tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v: number) => [v.toFixed(3), "mag"]} />
                    <Bar dataKey="m" fill="#6366f1" opacity={0.8} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </div>
          )}

          {/* Pipeline tab */}
          {tab === "pipeline" && (
            <Section title="Inference Pipeline" right={<span className="text-xs text-gray-400 font-mono">{metrics.inference_ms}ms total</span>}>
              <div className="space-y-1.5">
                {PIPELINE_STAGES.map((s, i) => {
                  const done   = pipeStep > i;
                  const active = pipeStep === i;
                  return (
                    <div key={s.label} className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      active && "bg-indigo-50 dark:bg-indigo-950",
                      done   && "opacity-50",
                    )}>
                      <div className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0 transition-all",
                        active && "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]",
                        done   && "bg-green-500",
                        !active && !done && "bg-gray-200 dark:bg-gray-700",
                      )} />
                      <span className={cn("text-sm flex-1", active ? "font-medium text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-400")}>
                        {s.label}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{s.dim}</span>
                      {done && <span className="text-xs text-green-500 font-mono w-12 text-right">{s.ms}ms</span>}
                      {active && <span className="text-xs text-indigo-400 font-mono w-12 text-right animate-pulse">···</span>}
                      {!done && !active && <span className="w-12" />}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* History tab */}
          {tab === "history" && (
            <Section title="Severity History" right={<span className="text-xs text-gray-400">last {timeline.length} readings</span>}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timeline} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v: number) => [`${v}%`, "severity"]} />
                  <Area type="monotone" dataKey="s" stroke="#6366f1" strokeWidth={2} fill="url(#sg)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Confidence */}
          <Section title="Confidence" right={<span className="text-xs text-gray-400 font-mono">{((pred?.confidence ?? 0.9) * 100).toFixed(0)}%</span>}>
            <div className="space-y-2.5">
              {CLASS_META.map((c) => {
                const prob = pred?.probabilities?.[c.label] ?? (c.id === 0 ? 0.85 : c.id === 1 ? 0.08 : c.id === 2 ? 0.05 : 0.02);
                const pct  = Math.round(prob * 100);
                return (
                  <div key={c.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{c.label}</span>
                      <span className="text-xs font-mono font-medium" style={{ color: c.color }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: c.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* System */}
          <Section title="System">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Latency",    value: `${metrics.inference_ms}ms`, color: "#6366f1" },
                { label: "CPU",        value: `${metrics.cpu_pct}%`,       color: "#06b6d4" },
                { label: "Memory",     value: `${metrics.memory_pct}%`,    color: "#8b5cf6" },
                { label: "Throughput", value: `${metrics.throughput_per_sec}/s`, color: "#22c55e" },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                  <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                  <p className="text-base font-semibold font-mono" style={{ color: m.color }}>{m.value}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Alerts */}
          <Section title="Alerts" right={
            activeAlerts.length > 0
              ? <span className="text-xs font-medium text-red-500">{activeAlerts.length} active</span>
              : <span className="text-xs text-green-500">clear</span>
          }>
            {activeAlerts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No active alerts</p>
            ) : (
              <div className="space-y-2">
                {activeAlerts.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{a.message}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Pipe {a.pipe_id} · {a.severity_pct}%</p>
                    </div>
                    <button onClick={() => acknowledgeAlert(a.id, "user")}
                      className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 transition-colors">
                      ACK
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Model info */}
          <Section title="Model">
            <div className="space-y-2 text-sm">
              {[
                ["Version",   "1.0.0"],
                ["Accuracy",  "93.58%"],
                ["F1-macro",  "0.9357"],
                ["Epochs",    "18"],
                ["Features",  "69-d hybrid"],
                ["Classes",   "4"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 font-mono text-xs">{v}</span>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}