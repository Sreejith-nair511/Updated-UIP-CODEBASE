"use client";

import { useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { useRealTimeReadings } from "@/hooks/useRealTimeReadings";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatCard } from "@/components/ui/StatCard";
import { Activity, TrendingUp, Droplets, AlertTriangle } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

const ZONE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AnalyticsPage() {
  const { readings, loading } = useRealTimeReadings({ limit: 200 });
  const [activeZone, setActiveZone] = useState<string | null>(null);

  const analytics = useMemo(() => {
    if (!readings.length) return null;

    const leakReadings = readings.filter((r) => r.leak);
    const noLeakReadings = readings.filter((r) => !r.leak);

    // Zone distribution
    const zoneMap: Record<string, { total: number; leaks: number }> = {};
    readings.forEach((r) => {
      if (!zoneMap[r.zone_id]) zoneMap[r.zone_id] = { total: 0, leaks: 0 };
      zoneMap[r.zone_id].total++;
      if (r.leak) zoneMap[r.zone_id].leaks++;
    });

    const zoneDistribution = Object.entries(zoneMap).map(([zone, d]) => ({
      name: zone,
      value: d.total,
      leaks: d.leaks,
      leakRate: ((d.leaks / d.total) * 100).toFixed(1),
    }));

    // Leak class distribution
    const noLeak = readings.filter((r) => r.severity_pct === 0).length;
    const minorLeak = readings.filter(
      (r) => r.severity_pct > 0 && r.severity_pct < 50
    ).length;
    const majorLeak = readings.filter((r) => r.severity_pct >= 50).length;

    const leakClassDist = [
      { name: "No Leak", value: noLeak, color: "#22c55e" },
      { name: "Minor Leak", value: minorLeak, color: "#f59e0b" },
      { name: "Major Leak", value: majorLeak, color: "#ef4444" },
    ];

    // Frequency vs Anomaly scatter
    const scatterData = readings.map((r) => ({
      x: r.frequency_hz,
      y: r.anomaly_score,
      leak: r.leak,
      pipe: r.pipe_id,
      severity: r.severity_pct,
    }));

    // Daily trend
    const dailyMap: Record<
      string,
      { date: string; leaks: number; total: number; avgSeverity: number }
    > = {};
    readings.forEach((r) => {
      const key = r.reading_date;
      if (!dailyMap[key]) {
        dailyMap[key] = { date: key, leaks: 0, total: 0, avgSeverity: 0 };
      }
      dailyMap[key].total++;
      if (r.leak) {
        dailyMap[key].leaks++;
        dailyMap[key].avgSeverity += r.severity_pct;
      }
    });

    const dailyTrend = Object.values(dailyMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        label: formatDate(d.date),
        leakRate: ((d.leaks / d.total) * 100).toFixed(1),
        avgSeverity: d.leaks > 0 ? (d.avgSeverity / d.leaks).toFixed(1) : 0,
      }));

    // Correlation: pressure vs frequency
    const correlationData = readings.map((r) => ({
      x: r.pressure_bar,
      y: r.frequency_hz,
      leak: r.leak,
    }));

    return {
      totalReadings: readings.length,
      leakRate: ((leakReadings.length / readings.length) * 100).toFixed(1),
      avgSeverity:
        leakReadings.length > 0
          ? (
              leakReadings.reduce((s, r) => s + r.severity_pct, 0) /
              leakReadings.length
            ).toFixed(1)
          : 0,
      avgFrequency: (
        readings.reduce((s, r) => s + r.frequency_hz, 0) / readings.length
      ).toFixed(1),
      zoneDistribution,
      leakClassDist,
      scatterData,
      dailyTrend,
      correlationData,
    };
  }, [readings]);

  if (loading) return <PageLoader />;
  if (!analytics) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold" style={{ color: "rgb(var(--text-primary))" }}>Analytics</h2>
        <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>
          Trends, correlations, and ML insights
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Readings"
          value={analytics.totalReadings}
          icon={Activity}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />
        <StatCard
          title="Leak Rate"
          value={`${analytics.leakRate}%`}
          subtitle="Of all readings"
          icon={AlertTriangle}
          iconColor="text-danger-600"
          iconBg="bg-danger-50"
        />
        <StatCard
          title="Avg Severity"
          value={`${analytics.avgSeverity}%`}
          subtitle="When leak detected"
          icon={TrendingUp}
          iconColor="text-warning-600"
          iconBg="bg-warning-50"
        />
        <StatCard
          title="Avg Frequency"
          value={`${analytics.avgFrequency} Hz`}
          subtitle="FFT dominant"
          icon={Droplets}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leak class distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-800">
              Leak Classification
            </h3>
            <span className="text-xs text-gray-400">ML output distribution</span>
          </div>
          <div className="card-body flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analytics.leakClassDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {analytics.leakClassDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value, "Readings"]}
                  contentStyle={{
                    fontSize: "12px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px" }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zone distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-800">
              Zone Leak Rates
            </h3>
            <span className="text-xs text-gray-400">% of readings with leak</span>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {analytics.zoneDistribution.map((zone, i) => (
                <div key={zone.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      {zone.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {zone.leaks}/{zone.value} readings
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: ZONE_COLORS[i % ZONE_COLORS.length] }}
                      >
                        {zone.leakRate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${zone.leakRate}%`,
                        backgroundColor: ZONE_COLORS[i % ZONE_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Daily trend */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-800">
            Daily Leak Rate Trend
          </h3>
          <span className="text-xs text-gray-400">
            {analytics.dailyTrend.length} days
          </span>
        </div>
        <div className="card-body pt-2">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={analytics.dailyTrend}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
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
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  fontSize: "12px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
                formatter={(v: any) => [`${v}%`, "Leak Rate"]}
              />
              <Line
                type="monotone"
                dataKey="leakRate"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3, fill: "#ef4444" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scatter: Frequency vs Anomaly */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-800">
            Frequency vs Anomaly Score
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-danger-500 inline-block" />
              Leak
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success-500 inline-block" />
              No Leak
            </span>
          </div>
        </div>
        <div className="card-body pt-2">
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="x"
                name="Frequency"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}Hz`}
                label={{
                  value: "Frequency (Hz)",
                  position: "insideBottom",
                  offset: -2,
                  fontSize: 10,
                  fill: "#9ca3af",
                }}
              />
              <YAxis
                dataKey="y"
                name="Anomaly"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                domain={[0, 1]}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  fontSize: "12px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
                formatter={(value: any, name: string) => [
                  name === "Frequency" ? `${value} Hz` : value.toFixed(3),
                  name,
                ]}
              />
              <Scatter
                data={analytics.scatterData.filter((d) => !d.leak)}
                fill="#22c55e"
                opacity={0.6}
                r={3}
              />
              <Scatter
                data={analytics.scatterData.filter((d) => d.leak)}
                fill="#ef4444"
                opacity={0.7}
                r={4}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-xs text-center mt-1" style={{ color: "rgb(var(--text-muted))" }}>
            Leaks cluster at higher frequencies (30+ Hz) with anomaly scores above 0.7
          </p>
        </div>
      </div>
    </div>
  );
}
