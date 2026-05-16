"use client";

import React, { useState, useMemo } from "react";
import { GitBranch, Search, Filter, TrendingUp, AlertCircle } from "lucide-react";
import { usePipes } from "@/hooks/usePipes";
import { useRealTimeReadings } from "@/hooks/useRealTimeReadings";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { FrequencyChart } from "@/components/charts/FrequencyChart";
import { PressureFlowChart } from "@/components/charts/PressureFlowChart";
import { AnomalyGauge } from "@/components/charts/AnomalyGauge";
import { formatRelativeTime, formatFrequency, formatPressure, formatFlow, cn } from "@/lib/utils";

import type { Pipe, Reading } from "@/lib/supabase/types";

export default function PipesPage() {
  const { pipes, loading: pipesLoading } = usePipes();
  const { readings, loading: readingsLoading } = useRealTimeReadings({ limit: 100 });
  const [selectedPipe, setSelectedPipe] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState<string>("all");

  const zones = useMemo(() => {
    const unique = Array.from(new Set(pipes.map((p: Pipe) => p.zone_id))).sort();
    return ["all", ...unique];
  }, [pipes]);

  const pipeStats = useMemo(() => {
    const stats: Record<
      string,
      {
        latestReading: Reading;
        leakCount: number;
        avgSeverity: number;
        avgAnomaly: number;
        readingCount: number;
      }
    > = {};

    readings.forEach((r: Reading) => {
      if (!stats[r.pipe_id]) {
        stats[r.pipe_id] = {
          latestReading: r,
          leakCount: 0,
          avgSeverity: 0,
          avgAnomaly: 0,
          readingCount: 0,
        };
      }
      const s = stats[r.pipe_id];
      if (new Date(r.created_at) > new Date(s.latestReading.created_at)) {
        s.latestReading = r;
      }
      if (r.leak) s.leakCount++;
      s.avgSeverity += r.severity_pct;
      s.avgAnomaly += r.anomaly_score;
      s.readingCount++;
    });

    Object.values(stats).forEach((s) => {
      s.avgSeverity /= s.readingCount;
      s.avgAnomaly /= s.readingCount;
    });

    return stats;
  }, [readings]);

  const filteredPipes = useMemo(() => {
    return pipes.filter((p: Pipe) => {
      const matchesSearch =
        p.pipe_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesZone = zoneFilter === "all" || p.zone_id === zoneFilter;
      return matchesSearch && matchesZone;
    });
  }, [pipes, searchQuery, zoneFilter]);

  const selectedPipeData = useMemo(() => {
    if (!selectedPipe) return null;
    return readings.filter((r: Reading) => r.pipe_id === selectedPipe).slice(0, 30);
  }, [selectedPipe, readings]);

  if (pipesLoading || readingsLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold" style={{ color: "rgb(var(--text-primary))" }}>Pipe Monitoring</h2>
        <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>
          {pipes.length} pipes · {Object.keys(pipeStats).length} with data
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search pipes..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select
          value={zoneFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setZoneFilter(e.target.value)}
          className="input w-full sm:w-40"
        >
          {zones.map((z: string) => (
            <option key={z} value={z}>
              {z === "all" ? "All Zones" : `Zone ${z}`}
            </option>
          ))}
        </select>
      </div>

      {/* Pipe grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredPipes.map((pipe: Pipe) => {
          const stats = pipeStats[pipe.pipe_id];
          const latest = stats?.latestReading;
          const hasLeak = latest?.leak ?? false;

          return (
            <button
              key={pipe.id}
              onClick={() => setSelectedPipe(pipe.pipe_id)}
              className={cn(
                "card p-4 text-left transition-all hover:shadow-md border-2",
                selectedPipe === pipe.pipe_id
                  ? "border-brand-500 ring-2 ring-brand-100"
                  : "border-transparent",
                hasLeak && "bg-danger-50/30"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {pipe.pipe_id}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {pipe.name}
                  </p>
                </div>
                {hasLeak && (
                  <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0 animate-pulse" />
                )}
              </div>

              <div className="space-y-1.5 mb-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Zone</span>
                  <span className="font-medium text-gray-700">{pipe.zone_id}</span>
                </div>
                {latest && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Frequency</span>
                      <span className="font-mono text-purple-700">
                        {formatFrequency(latest.frequency_hz)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Pressure</span>
                      <span className="font-mono">{formatPressure(latest.pressure_bar)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Flow</span>
                      <span className="font-mono">{formatFlow(latest.flow_lpm)}</span>
                    </div>
                  </>
                )}
              </div>

              {latest && (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  <SeverityBadge severity={latest.severity_pct} showValue={false} />
                  <span className="text-xs text-gray-400">
                    {formatRelativeTime(latest.created_at)}
                  </span>
                </div>
              )}

              {!stats && (
                <p className="text-xs text-gray-400 italic">No data available</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected pipe detail */}
      {selectedPipe && selectedPipeData && selectedPipeData.length > 0 && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                {selectedPipe} — Detailed View
              </h3>
              <p className="text-xs text-gray-500">
                {selectedPipeData.length} readings loaded
              </p>
            </div>
            <button
              onClick={() => setSelectedPipe(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <div className="card-body space-y-4">
            {/* Latest reading + anomaly */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Latest Reading
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: "Frequency",
                      value: formatFrequency(selectedPipeData[0].frequency_hz),
                    },
                    {
                      label: "Pressure",
                      value: formatPressure(selectedPipeData[0].pressure_bar),
                    },
                    {
                      label: "Flow",
                      value: formatFlow(selectedPipeData[0].flow_lpm),
                    },
                    {
                      label: "Temp",
                      value: `${selectedPipeData[0].temp_c}°C`,
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <AnomalyGauge score={selectedPipeData[0].anomaly_score} size={110} />
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Frequency Trend
                </p>
                <FrequencyChart
                  data={[...selectedPipeData].reverse().map((r) => ({
                    date: r.reading_date,
                    time: r.reading_time,
                    frequency_hz: r.frequency_hz,
                    pipe_id: r.pipe_id,
                  }))}
                  height={160}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Pressure & Flow
                </p>
                <PressureFlowChart
                  data={[...selectedPipeData].reverse().map((r) => ({
                    date: r.reading_date,
                    time: r.reading_time,
                    pressure_bar: r.pressure_bar,
                    flow_lpm: r.flow_lpm,
                    leak: r.leak,
                  }))}
                  height={160}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
