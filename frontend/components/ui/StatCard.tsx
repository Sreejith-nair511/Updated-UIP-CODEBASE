"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  color?: string;
  trend?: { value: number; label?: string };
  className?: string;
}

export function StatCard({ label, value, sub, icon: Icon, color = "#6366f1", trend, className }: StatCardProps) {
  return (
    <div className={cn("card p-5 flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "rgb(var(--text-muted))" }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight tabular" style={{ color }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "rgb(var(--text-muted))" }}>{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1">
          {trend.value > 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-red-500" />
          ) : trend.value < 0 ? (
            <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Minus className="w-3.5 h-3.5" style={{ color: "rgb(var(--text-muted))" }} />
          )}
          <span className={cn(
            "text-xs font-semibold",
            trend.value > 0 ? "text-red-500" : trend.value < 0 ? "text-emerald-500" : ""
          )}
            style={trend.value === 0 ? { color: "rgb(var(--text-muted))" } : undefined}>
            {trend.value > 0 ? "+" : ""}{trend.value}% {trend.label ?? ""}
          </span>
        </div>
      )}
    </div>
  );
}
