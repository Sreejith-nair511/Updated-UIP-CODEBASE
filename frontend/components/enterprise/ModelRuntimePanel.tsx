"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STAGES = [
  { id: "receive",  label: "Receiving signal",        color: "#6366f1", ms: 5  },
  { id: "fft",      label: "Running FFT",              color: "#06b6d4", ms: 12 },
  { id: "spec",     label: "Generating spectrogram",   color: "#0891b2", ms: 25 },
  { id: "cnn",      label: "Extracting CNN features",  color: "#7c3aed", ms: 80 },
  { id: "fusion",   label: "Fusing features",          color: "#4f46e5", ms: 10 },
  { id: "rf",       label: "Running Random Forest",    color: "#059669", ms: 45 },
  { id: "output",   label: "Generating prediction",    color: "#10b981", ms: 7  },
];

export function ModelRuntimePanel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());

  useEffect(() => {
    let idx = 0;
    const completed = new Set<number>();

    const run = () => {
      if (idx < STAGES.length) {
        setActiveIdx(idx);
        completed.add(idx);
        setDone(new Set(completed));
        const delay = STAGES[idx].ms;
        idx++;
        setTimeout(run, delay * 2);
      } else {
        setTimeout(() => {
          idx = 0;
          completed.clear();
          setDone(new Set());
          setTimeout(run, 300);
        }, 1500);
      }
    };

    const t = setTimeout(run, 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
        <h3 className="text-sm font-semibold" style={{ color: "rgb(var(--text-primary))" }}>
          Processing Stage
        </h3>
      </div>
      <div className="space-y-2">
        {STAGES.map((stage, idx) => {
          const isActive = activeIdx === idx;
          const isDone = done.has(idx) && !isActive;
          return (
            <div key={stage.id} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300",
                  isActive && "animate-ping-slow",
                  isDone && "opacity-50"
                )}
                style={{ backgroundColor: isActive || isDone ? stage.color : "rgb(var(--border))" }}
              />
              <div className="flex-1 flex items-center justify-between">
                <span
                  className={cn("text-xs transition-all duration-300", isActive && "font-semibold")}
                  style={{ color: isActive ? stage.color : isDone ? "rgb(var(--text-muted))" : "rgb(var(--text-muted))", opacity: isDone ? 0.6 : 1 }}
                >
                  {stage.label}
                </span>
                {isDone && (
                  <span className="text-xs font-mono text-success-500">{stage.ms}ms</span>
                )}
                {isActive && (
                  <span className="text-xs font-mono animate-pulse" style={{ color: stage.color }}>running...</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}