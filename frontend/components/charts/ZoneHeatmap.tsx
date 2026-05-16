"use client";

import { cn } from "@/lib/utils";

interface ZoneData {
  zone_id: string;
  total_pipes: number;
  active_leaks: number;
  avg_severity: number;
  avg_anomaly: number;
}

interface ZoneHeatmapProps {
  zones: ZoneData[];
}

function getZoneColor(avgSeverity: number, activeLeaks: number): string {
  if (activeLeaks === 0) return "bg-success-100 border-success-200 text-success-800";
  if (avgSeverity < 30) return "bg-warning-100 border-warning-200 text-warning-800";
  if (avgSeverity < 70) return "bg-orange-100 border-orange-200 text-orange-800";
  return "bg-danger-100 border-danger-200 text-danger-800";
}

function getZoneIntensity(avgSeverity: number): string {
  if (avgSeverity === 0) return "bg-success-500";
  if (avgSeverity < 30) return "bg-warning-500";
  if (avgSeverity < 70) return "bg-orange-500";
  return "bg-danger-500";
}

export function ZoneHeatmap({ zones }: ZoneHeatmapProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {zones.map((zone) => (
        <div
          key={zone.zone_id}
          className={cn(
            "rounded-xl border p-3 flex flex-col gap-2 transition-all hover:shadow-md cursor-pointer",
            getZoneColor(zone.avg_severity, zone.active_leaks)
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">{zone.zone_id}</span>
            {zone.active_leaks > 0 && (
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="opacity-70">Pipes</span>
              <span className="font-medium">{zone.total_pipes}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="opacity-70">Leaks</span>
              <span className="font-bold">{zone.active_leaks}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="opacity-70">Severity</span>
              <span className="font-medium">{zone.avg_severity.toFixed(0)}%</span>
            </div>
          </div>
          {/* Severity bar */}
          <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", getZoneIntensity(zone.avg_severity))}
              style={{ width: `${Math.min(zone.avg_severity, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
