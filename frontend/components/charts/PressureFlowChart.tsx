"use client";

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatDateTime } from "@/lib/utils";

interface PressureFlowDataPoint {
  date: string;
  time: string;
  pressure_bar: number;
  flow_lpm: number;
  leak: boolean;
}

interface PressureFlowChartProps {
  data: PressureFlowDataPoint[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-medium text-gray-700 mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 mb-0.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-gray-600">{p.name}:</span>
            <span className="font-medium">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function PressureFlowChart({ data, height = 220 }: PressureFlowChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatDateTime(d.date, d.time),
    pressure: d.pressure_bar,
    flow: d.flow_lpm,
    fill: d.leak ? "#ef4444" : "#3b82f6",
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="pressure"
          orientation="left"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}b`}
        />
        <YAxis
          yAxisId="flow"
          orientation="right"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}L`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          yAxisId="flow"
          dataKey="flow"
          name="Flow (L/min)"
          fill="#bfdbfe"
          radius={[2, 2, 0, 0]}
          maxBarSize={20}
        />
        <Line
          yAxisId="pressure"
          type="monotone"
          dataKey="pressure"
          name="Pressure (bar)"
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
