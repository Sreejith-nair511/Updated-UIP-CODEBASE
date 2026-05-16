"use client";

import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from "recharts";

interface ConfidencePanelProps {
  probabilities?: {
    Normal: number;
    "Pre-Leak": number;
    "Minor Leak": number;
    "Major Leak": number;
  };
}

export function ConfidencePanel({ probabilities }: ConfidencePanelProps) {
  const probs = probabilities ?? { Normal: 0.85, "Pre-Leak": 0.08, "Minor Leak": 0.05, "Major Leak": 0.02 };

  const data = [
    { name: "Normal",     value: Math.round(probs.Normal * 100),       fill: "#10b981" },
    { name: "Pre-Leak",   value: Math.round(probs["Pre-Leak"] * 100),  fill: "#f59e0b" },
    { name: "Minor Leak", value: Math.round(probs["Minor Leak"] * 100),fill: "#f97316" },
    { name: "Major Leak", value: Math.round(probs["Major Leak"] * 100),fill: "#ef4444" },
  ];

  const topClass = data.reduce((a, b) => a.value > b.value ? a : b);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "rgb(var(--text-primary))" }}>Confidence</h3>
        <span className="text-xs font-bold" style={{ color: topClass.fill }}>
          {topClass.name} {topClass.value}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={data} startAngle={180} endAngle={0}>
          <RadialBar dataKey="value" cornerRadius={4} label={false} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }} />
          <Tooltip
            contentStyle={{ fontSize: "11px", borderRadius: "8px", background: "rgba(15,23,42,0.95)", border: "1px solid rgba(99,102,241,0.2)", color: "#e2e8f0" }}
            formatter={(v: number) => [`${v}%`, "Probability"]}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}