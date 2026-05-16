"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type LogLevel = "INFO" | "WARNING" | "ERROR" | "DEBUG";

interface LogEntry { ts: string; level: LogLevel; stage: string; msg: string; }

const SAMPLE_LOGS: LogEntry[] = [
  { ts:"14:48:49", level:"INFO",    stage:"app",          msg:"InferenceEngine loaded. Model version: 1.0.0" },
  { ts:"14:48:51", level:"INFO",    stage:"cnn_model",    msg:"CNN model loaded from models/cnn_feature_extractor.h5" },
  { ts:"14:48:51", level:"INFO",    stage:"rf_model",     msg:"Random Forest model loaded from models/random_forest_classifier.joblib" },
  { ts:"14:48:51", level:"INFO",    stage:"inference",    msg:"FFT normalisation stats loaded for hybrid inference" },
  { ts:"14:48:56", level:"INFO",    stage:"app",          msg:"Uvicorn running on http://0.0.0.0:8000" },
  { ts:"14:49:02", level:"INFO",    stage:"inference",    msg:"Prediction: class=Normal, confidence=0.912, latency=184ms" },
  { ts:"14:49:32", level:"WARNING", stage:"inference",    msg:"Distribution shift detected: dominant_frequency=65.0, z=3.2 > 3.0" },
  { ts:"14:49:33", level:"INFO",    stage:"inference",    msg:"Prediction: class=Minor Leak, confidence=0.418, latency=127ms" },
  { ts:"14:50:01", level:"INFO",    stage:"signal_proc",  msg:"Signal processed: 8000 samples" },
  { ts:"14:50:01", level:"INFO",    stage:"fft_features", msg:"FFT features: dom_freq=44.0Hz, centroid=308.0Hz, energy=0.0003" },
  { ts:"14:50:02", level:"INFO",    stage:"inference",    msg:"Prediction: class=Normal, confidence=0.887, latency=191ms" },
  { ts:"14:50:45", level:"ERROR",   stage:"app",          msg:"Connection timeout to Supabase — retrying in 5s" },
  { ts:"14:50:50", level:"INFO",    stage:"app",          msg:"Supabase connection restored" },
];

const LEVEL_COLORS: Record<LogLevel, string> = {
  INFO:    "text-success-400",
  WARNING: "text-warning-400",
  ERROR:   "text-danger-400",
  DEBUG:   "text-gray-500",
};

const LEVEL_BG: Record<LogLevel, string> = {
  INFO:    "bg-success-900/20",
  WARNING: "bg-warning-900/20",
  ERROR:   "bg-danger-900/30",
  DEBUG:   "bg-gray-900/10",
};

export function LogViewer() {
  const [filter, setFilter] = useState<LogLevel | "ALL">("ALL");
  const [logs, setLogs] = useState<LogEntry[]>(SAMPLE_LOGS);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => {
      const newLog: LogEntry = {
        ts: new Date().toTimeString().slice(0,8),
        level: Math.random() > 0.9 ? "WARNING" : "INFO",
        stage: ["inference","fft_features","signal_proc","app"][Math.floor(Math.random()*4)],
        msg: [
          "Prediction: class=Normal, confidence=0.91, latency=183ms",
          "FFT features: dom_freq=18.5Hz, centroid=290Hz, energy=0.0002",
          "Signal processed: 8000 samples",
          "POST /predict 200 OK in 184ms",
        ][Math.floor(Math.random()*4)],
      };
      setLogs((prev) => [...prev.slice(-50), newLog]);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const filtered = filter === "ALL" ? logs : logs.filter((l) => l.level === filter);

  return (
    <div className="card p-4 flex flex-col" style={{ height: 320 }}>
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-sm font-semibold" style={{ color: "rgb(var(--text-primary))" }}>Log Viewer</h3>
        <div className="flex gap-1">
          {(["ALL","INFO","WARNING","ERROR"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={cn(
                "px-2 py-0.5 rounded text-xs font-mono transition-all",
                filter === lvl ? "bg-brand-600 text-white" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto font-mono text-xs space-y-0.5 scrollbar-thin" style={{ backgroundColor: "rgb(var(--bg-secondary))", borderRadius: "0.5rem", padding: "0.5rem" }}>
        {filtered.map((log, i) => (
          <div key={i} className={cn("flex gap-2 px-2 py-0.5 rounded", LEVEL_BG[log.level])}>
            <span className="text-gray-600 flex-shrink-0">{log.ts}</span>
            <span className={cn("flex-shrink-0 w-14", LEVEL_COLORS[log.level])}>[{log.level}]</span>
            <span className="text-accent-400 flex-shrink-0 w-20 truncate">{log.stage}</span>
            <span className="text-gray-300 truncate">{log.msg}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}