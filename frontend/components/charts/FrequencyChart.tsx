"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatDateTime } from "@/lib/utils";
import { ChartTooltip } from "./ChartTooltip";

interface FrequencyDataPoint {
  date: string;
  time: string;
  frequency_hz: number;
  pipe_id: string;
}

interface FrequencyChartProps {
  data: FrequencyDataPoint[];
  height?: number;
}

export function FrequencyChart({ data, height = 200 }: FrequencyChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatDateTime(d.date, d.time),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="freqGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
          tickFormatter={(v) => `${v}Hz`}
        />
        <Tooltip
          content={
            <ChartTooltip
              formatter={(e) => (
                <span className="font-semibold" style={{ color: e.color }}>
                  {Number(e.value).toFixed(1)} Hz
                </span>
              )}
            />
          }
        />
        {/* Leak threshold line at ~30Hz */}
        <ReferenceLine
          y={30}
          stroke="#f59e0b"
          strokeDasharray="4 4"
          label={{ value: "Threshold", position: "right", fontSize: 9, fill: "#f59e0b" }}
        />
        <Area
          type="monotone"
          dataKey="frequency_hz"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#freqGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#3b82f6" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
