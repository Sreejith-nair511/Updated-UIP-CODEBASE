"use client";

import { useMemo } from "react";
import type { Reading } from "@/lib/supabase/types";

interface PipeNetworkViewProps {
  readings: Reading[];
}

const PIPE_POSITIONS: Record<string, { x: number; y: number }> = {
  P101: { x: 80,  y: 60  }, P102: { x: 180, y: 60  }, P103: { x: 280, y: 60  },
  P203: { x: 80,  y: 140 }, P204: { x: 180, y: 140 }, P205: { x: 280, y: 140 },
  P305: { x: 80,  y: 220 }, P306: { x: 180, y: 220 }, P307: { x: 280, y: 220 },
  P401: { x: 80,  y: 300 }, P402: { x: 180, y: 300 },
  P501: { x: 80,  y: 380 }, P502: { x: 180, y: 380 },
};

function getSeverityColor(sev: number): string {
  if (sev === 0) return "#10b981";
  if (sev < 25)  return "#f59e0b";
  if (sev < 55)  return "#f97316";
  return "#ef4444";
}

export function PipeNetworkView({ readings }: PipeNetworkViewProps) {
  const pipeStatus = useMemo(() => {
    const map: Record<string, { severity: number; anomaly: number; leak: boolean }> = {};
    readings.forEach((r) => {
      if (!map[r.pipe_id] || r.created_at > (readings.find(x => x.pipe_id === r.pipe_id)?.created_at ?? "")) {
        map[r.pipe_id] = { severity: r.severity_pct, anomaly: r.anomaly_score, leak: r.leak };
      }
    });
    return map;
  }, [readings]);

  return (
    <div className="card p-4">
      <div className="card-header px-0 pt-0 border-0 mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "rgb(var(--text-primary))" }}>
          Digital Twin — Pipe Network
        </h3>
        <div className="flex items-center gap-3 text-xs" style={{ color: "rgb(var(--text-muted))" }}>
          {[["#10b981","Normal"],["#f59e0b","Pre-Leak"],["#f97316","Minor"],["#ef4444","Major"]].map(([c,l]) => (
            <span key={l} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />{l}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg width="380" height="420" viewBox="0 0 380 420" className="w-full">
          {/* Zone labels */}
          {[["Z1",30],["Z2",110],["Z3",190],["Z4",270],["Z5",350]].map(([z,y]) => (
            <text key={z as string} x="10" y={(y as number)+10} fontSize="10" fill="#6b7280" fontFamily="monospace">{z as string}</text>
          ))}
          {/* Horizontal pipe connections */}
          {Object.entries(PIPE_POSITIONS).map(([pid, pos]) => {
            const status = pipeStatus[pid];
            const color = status ? getSeverityColor(status.severity) : "#374151";
            const isLeak = status?.leak;
            return (
              <g key={pid}>
                {/* Pipe node */}
                <circle
                  cx={pos.x} cy={pos.y} r={isLeak ? 14 : 10}
                  fill={`${color}20`}
                  stroke={color}
                  strokeWidth={isLeak ? 2.5 : 1.5}
                />
                {isLeak && (
                  <circle cx={pos.x} cy={pos.y} r={18} fill="none" stroke={color} strokeWidth={1} opacity={0.4}>
                    <animate attributeName="r" values="14;22;14" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                <text x={pos.x} y={pos.y+4} textAnchor="middle" fontSize="8" fill={color} fontFamily="monospace" fontWeight="bold">
                  {pid}
                </text>
                {/* Pressure gradient bar */}
                {status && (
                  <rect x={pos.x-10} y={pos.y+16} width={20} height={3} rx={1.5} fill="#1f2937" />
                )}
                {status && (
                  <rect x={pos.x-10} y={pos.y+16} width={Math.max(2, status.anomaly * 20)} height={3} rx={1.5} fill={color} />
                )}
              </g>
            );
          })}
          {/* Flow arrows between connected pipes */}
          {[
            [80,60,180,60],[180,60,280,60],
            [80,140,180,140],[180,140,280,140],
            [80,220,180,220],[180,220,280,220],
            [80,300,180,300],
            [80,380,180,380],
            [80,60,80,140],[80,140,80,220],[80,220,80,300],[80,300,80,380],
          ].map(([x1,y1,x2,y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#374151" strokeWidth={1} strokeDasharray="4 3" opacity={0.4} />
          ))}
        </svg>
      </div>
    </div>
  );
}