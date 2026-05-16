"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { getAnomalyColor } from "@/lib/utils";

interface AnomalyGaugeProps {
  score: number;
  size?: number;
}

export function AnomalyGauge({ score, size = 120 }: AnomalyGaugeProps) {
  const color = getAnomalyColor(score);
  const pct = Math.round(score * 100);

  const data = [
    { value: pct, fill: color },
  ];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="65%"
          outerRadius="90%"
          startAngle={90}
          endAngle={-270}
          data={data}
          barSize={10}
        >
          <RadialBar
            background={{ fill: "#f3f4f6" }}
            dataKey="value"
            cornerRadius={5}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums" style={{ color }}>
          {pct}%
        </span>
        <span className="text-xs text-gray-500">Anomaly</span>
      </div>
    </div>
  );
}
