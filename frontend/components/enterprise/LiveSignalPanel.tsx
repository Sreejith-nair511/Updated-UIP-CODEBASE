"use client";

import { useEffect, useRef, useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Activity, Zap, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalPoint { t: number; v: number; }
interface FFTPoint { freq: number; mag: number; }

function generateWaveform(cls: number, n = 80): SignalPoint[] {
  return Array.from({ length: n }, (_, i) => {
    const base = cls === 0 ? 0.05 : cls === 1 ? 0.15 : cls === 2 ? 0.35 : 0.7;
    const freq = cls === 0 ? 15 : cls === 1 ? 35 : cls === 2 ? 55 : 72;
    return {
      t: i,
      v: base * Math.sin((2 * Math.PI * freq * i) / 4000) + (Math.random() - 0.5) * base * 0.4,
    };
  });
}

function generateFFT(cls: number): FFTPoint[] {
  const dominant = cls === 0 ? 15 : cls === 1 ? 35 : cls === 2 ? 55 : 72;
  return Array.from({ length: 40 }, (_, i) => {
    const freq = i * 5;
    const dist = Math.abs(freq - dominant);
    const mag = Math.max(0, 1 - dist / 30) * (0.8 + Math.random() * 0.2);
    return { freq, mag: parseFloat(mag.toFixed(3)) };
  });
}

interface LiveSignalPanelProps {
  leakClassId?: number;
  confidence?: number;
  fftDominantFreq?: number;
}

export function LiveSignalPanel({
  leakClassId = 0,
  confidence = 0.9,
  fftDominantFreq = 15,
}: LiveSignalPanelProps) {
  const [waveform, setWaveform] = useState<SignalPoint[]>(() => generateWaveform(leakClassId));
  const [fftData, setFFTData] = useState<FFTPoint[]>(() => generateFFT(leakClassId));
  const [activeTab, setActiveTab] = useState<"waveform" | "fft" | "spectrogram">("waveform");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setWaveform(generateWaveform(leakClassId));
      setFFTData(generateFFT(leakClassId));
    }, 500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [leakClassId]);

  const waveColor = leakClassId === 0 ? "#10b981" : leakClassId === 1 ? "#f59e0b" : leakClassId === 2 ? "#f97316" : "#ef4444";

  // Spectrogram: 16x32 grid of intensity values
  const spectrogram = Array.from({ length: 16 }, (_, row) =>
    Array.from({ length: 32 }, (_, col) => {
      const freqBin = row / 16;
      const timeBin = col / 32;
      const dominantBin = (leakClassId === 0 ? 0.1 : leakClassId === 1 ? 0.3 : leakClassId === 2 ? 0.5 : 0.7);
      const dist = Math.abs(freqBin - dominantBin);
      return Math.max(0, Math.min(1, (1 - dist * 3) * (0.6 + Math.random() * 0.4)));
    })
  );

  const tabs = [
    { id: "waveform" as const, label: "Waveform", icon: Activity },
    { id: "fft" as const, label: "FFT Spectrum", icon: Zap },
    { id: "spectrogram" as const, label: "Spectrogram", icon: Radio },
  ];

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
          <h3 className="text-sm font-semibold" style={{ color: "rgb(var(--text-primary))" }}>
            Live Acoustic Signal
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-success-100 text-success-700 font-medium">
            500ms refresh
          </span>
        </div>
        <div className="text-xs font-mono" style={{ color: "rgb(var(--text-muted))" }}>
          DOM: {fftDominantFreq.toFixed(1)} Hz · Conf: {(confidence * 100).toFixed(0)}%
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "rgb(var(--border))" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-brand-500 text-brand-600"
                : "border-transparent hover:text-gray-700"
            )}
            style={{ color: activeTab === tab.id ? undefined : "rgb(var(--text-muted))" }}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="p-4">
        {activeTab === "waveform" && (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={waveform} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval={15} />
              <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} domain={[-1, 1]} />
              <Tooltip
                contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.2)", background: "rgba(15,23,42,0.9)", color: "#e2e8f0" }}
                formatter={(v: number) => [v.toFixed(4), "Amplitude"]}
              />
              <ReferenceLine y={0} stroke="rgba(99,102,241,0.3)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="v" stroke={waveColor} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === "fft" && (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={fftData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="freq" tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false}
                tickFormatter={(v) => `${v}Hz`} interval={7} />
              <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} domain={[0, 1]} />
              <Tooltip
                contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid rgba(6,182,212,0.2)", background: "rgba(15,23,42,0.9)", color: "#e2e8f0" }}
                formatter={(v: number) => [v.toFixed(3), "Magnitude"]}
              />
              <ReferenceLine x={fftDominantFreq} stroke="#f59e0b" strokeDasharray="4 4"
                label={{ value: "DOM", position: "top", fontSize: 9, fill: "#f59e0b" }} />
              <Bar dataKey="mag" fill="#06b6d4" opacity={0.85} radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === "spectrogram" && (
          <div className="relative" style={{ height: 180 }}>
            <div className="absolute inset-0 flex flex-col gap-px">
              {spectrogram.map((row, ri) => (
                <div key={ri} className="flex gap-px flex-1">
                  {row.map((val, ci) => (
                    <div
                      key={ci}
                      className="flex-1 rounded-sm"
                      style={{
                        backgroundColor: `hsla(${240 - val * 240}, 80%, ${20 + val * 50}%, ${0.4 + val * 0.6})`,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-xs text-gray-500">
              <span>0 Hz</span><span>1000 Hz</span><span>2000 Hz</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
