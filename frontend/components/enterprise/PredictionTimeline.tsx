"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { Reading } from "@/lib/supabase/types";

const CLASS_COLORS = {
  normal:    "#10b981",
  pre_leak:  "#f59e0b",
  minor:     "#f97316",
  major:     "#ef4444",
};

interface TimelinePoint {
  time: string;
  normal: number;
  pre_leak: number;
  minor: number;
  major: number;
  severity: number;
}

function readingToPoint(r: Reading): TimelinePoint {
  const sev = r.severity_pct;
  return {
    time: r.reading_time.slice(0, 5),
    normal:   sev === 0 ? 1 : 0,
    pre_leak: sev > 0 && sev < 25 ? 1 : 0,
    minor:    sev >= 25 && sev < 55 ? 1 : 0,
    major:    sev >= 55 ? 1 : 0,
    severity: sev,
  };
}

interface PredictionTimelineProps {
  readings: Reading[];
}

export function PredictionTimeline({ readings }: PredictionTimelineProps) {
  const data = useMemo(() => {
    return [...readings].reverse().slice(-30).map(readingToPoint);
  }, [readings]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const sev = payload[0]?.payload?.severity ?? 0;
    const cls = sev === 0 ? "Normal" : sev < 25 ? "Pre-Leak" : sev < 55 ? "Minor Leak" : "Major Leak";
    const color = sev === 0 ? CLASS_COLORS.normal : sev < 25 ? CLASS_COLORS.pre_leak : sev < 55 ? CLASS_COLORS.minor : CLASS_COLORS.major;
    return (
      <div className="rounded-lg p-2.5 text-xs shadow-lg border" style={{ background: "rgba(15,23,42,0.95)", borderColor: color, color: "#e2e8f0" }}>
        <p className="font-medium mb-1">{label}</p>
        <p style={{ color }}>Class: {cls}</p>
        <p style={{ color: "rgb(148,163,184)" }}>Severity: {sev}%</p>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-sm font-semibold" style={{ color: "rgb(var(--text-primary))" }}>
          Prediction Timeline
        </h3>
        <span className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>Last 30 readings</span>
      </div>
      <div className="card-body pt-2">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              {Object.entries(CLASS_COLORS).map(([key, color]) => (
                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} domain={[0, 1]} hide />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "10px" }} iconType="circle" iconSize={7} />
            <Area type="monotone" dataKey="normal"   name="Normal"    stroke={CLASS_COLORS.normal}   fill={`url(#grad-normal)`}   strokeWidth={1.5} stackId="1" />
            <Area type="monotone" dataKey="pre_leak" name="Pre-Leak"  stroke={CLASS_COLORS.pre_leak} fill={`url(#grad-pre_leak)`} strokeWidth={1.5} stackId="1" />
            <Area type="monotone" dataKey="minor"    name="Minor"     stroke={CLASS_COLORS.minor}    fill={`url(#grad-minor)`}    strokeWidth={1.5} stackId="1" />
            <Area type="monotone" dataKey="major"    name="Major"     stroke={CLASS_COLORS.major}    fill={`url(#grad-major)`}    strokeWidth={1.5} stackId="1" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}