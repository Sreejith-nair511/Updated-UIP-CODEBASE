"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { formatDate } from "@/lib/utils";

interface SeverityDataPoint {
  date: string;
  severity_pct: number;
  pipe_id: string;
  leak: boolean;
}

interface SeverityTrendChartProps {
  data: SeverityDataPoint[];
  height?: number;
}

function getBarColor(severity: number): string {
  if (severity === 0) return "#22c55e";
  if (severity < 30) return "#f59e0b";
  if (severity < 70) return "#f97316";
  return "#ef4444";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-medium text-gray-700 mb-1">{label}</p>
        <p className="text-gray-600">Pipe: <span className="font-medium">{d.pipe_id}</span></p>
        <p className="text-gray-600">
          Severity:{" "}
          <span className="font-medium" style={{ color: getBarColor(d.severity_pct) }}>
            {d.severity_pct}%
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export function SeverityTrendChart({ data, height = 200 }: SeverityTrendChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="severity_pct" radius={[3, 3, 0, 0]} maxBarSize={24}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.severity_pct)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
