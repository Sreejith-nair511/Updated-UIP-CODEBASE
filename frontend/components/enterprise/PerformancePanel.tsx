"use client";

import { useEffect, useState } from "react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

interface Metric { label: string; value: number; max: number; unit: string; color: string; }

function GaugeCard({ label, value, max, unit, color }: Metric) {
  const pct = Math.min(100, (value / max) * 100);
  const data = [{ name: label, value: pct, fill: color }];
  return (
    <div className="rounded-xl p-3 border" style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--bg-tertiary))" }}>
      <p className="text-xs font-medium mb-1" style={{ color: "rgb(var(--text-muted))" }}>{label}</p>
      <div className="relative h-20">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={data}>
            <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "rgba(99,102,241,0.08)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="text-sm font-bold font-mono" style={{ color }}>{value}{unit}</span>
        </div>
      </div>
    </div>
  );
}

export function PerformancePanel() {
  const [metrics, setMetrics] = useState({ latency: 184, cpu: 12, memory: 38, throughput: 5.4 });

  useEffect(() => {
    const t = setInterval(() => {
      setMetrics({
        latency:    Math.round(160 + Math.random() * 60),
        cpu:        Math.round(8 + Math.random() * 20),
        memory:     Math.round(30 + Math.random() * 20),
        throughput: parseFloat((4 + Math.random() * 3).toFixed(1)),
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const gauges: Metric[] = [
    { label: "Inference",  value: metrics.latency,    max: 500,  unit: "ms", color: "#6366f1" },
    { label: "CPU",        value: metrics.cpu,         max: 100,  unit: "%",  color: "#06b6d4" },
    { label: "Memory",     value: metrics.memory,      max: 100,  unit: "%",  color: "#8b5cf6" },
    { label: "Throughput", value: metrics.throughput,  max: 10,   unit: "/s", color: "#10b981" },
  ];

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "rgb(var(--text-primary))" }}>Performance</h3>
        <span className="text-xs text-success-500 font-medium">Live · 2s refresh</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {gauges.map((g) => <GaugeCard key={g.label} {...g} />)}
      </div>
    </div>
  );
}