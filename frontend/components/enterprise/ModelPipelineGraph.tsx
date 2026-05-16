"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PipelineNode {
  id: string;
  label: string;
  sublabel: string;
  outputSize: string;
  processingMs?: number;
  active: boolean;
  color: string;
  icon: string;
}

const PIPELINE_NODES: PipelineNode[] = [
  { id: "sensor",  label: "Piezo Sensor",         sublabel: "4000 Hz ADC",        outputSize: "8000 samples", color: "#6366f1", icon: "🎙️", active: false, processingMs: 0 },
  { id: "adc",     label: "ADC Conversion",        sublabel: "12-bit → float32",   outputSize: "8000 × f32",   color: "#8b5cf6", icon: "⚡", active: false, processingMs: 0 },
  { id: "fft",     label: "FFT Extraction",        sublabel: "Spectral features",  outputSize: "5 features",   color: "#06b6d4", icon: "📊", active: false, processingMs: 0 },
  { id: "spec",    label: "Mel Spectrogram",       sublabel: "128×128 px",         outputSize: "128×128",      color: "#0891b2", icon: "🌊", active: false, processingMs: 0 },
  { id: "cnn",     label: "CNN Extractor",         sublabel: "3×Conv2D+Dense",     outputSize: "64 features",  color: "#7c3aed", icon: "🧠", active: false, processingMs: 0 },
  { id: "fusion",  label: "Feature Fusion",        sublabel: "CNN + FFT",          outputSize: "69 features",  color: "#4f46e5", icon: "🔗", active: false, processingMs: 0 },
  { id: "rf",      label: "Random Forest",         sublabel: "200 trees, balanced","outputSize": "4 classes",  color: "#059669", icon: "🌲", active: false, processingMs: 0 },
  { id: "output",  label: "Decision Output",       sublabel: "Leak classification","outputSize": "class + conf",color: "#10b981", icon: "✅", active: false, processingMs: 0 },
];

interface ModelPipelineGraphProps {
  activeStage?: string;
  inferenceTotalMs?: number;
}

export function ModelPipelineGraph({ activeStage, inferenceTotalMs = 184 }: ModelPipelineGraphProps) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Animate pipeline every 3 seconds
    let step = 0;
    const completed = new Set<number>();

    const advance = () => {
      if (step < PIPELINE_NODES.length) {
        setCurrentStep(step);
        completed.add(step);
        setCompletedSteps(new Set(completed));
        step++;
        setTimeout(advance, inferenceTotalMs / PIPELINE_NODES.length);
      } else {
        // Reset after pause
        setTimeout(() => {
          step = 0;
          completed.clear();
          setCurrentStep(-1);
          setCompletedSteps(new Set());
          setTimeout(advance, 300);
        }, 2000);
      }
    };

    const timer = setTimeout(advance, 500);
    return () => clearTimeout(timer);
  }, [inferenceTotalMs]);

  return (
    <div className="card p-4">
      <div className="card-header mb-4 px-0 pt-0 border-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          <h3 className="text-sm font-semibold" style={{ color: "rgb(var(--text-primary))" }}>
            ML Pipeline
          </h3>
        </div>
        <span className="text-xs font-mono text-brand-500">{inferenceTotalMs}ms total</span>
      </div>

      {/* Horizontal pipeline on desktop, vertical on mobile */}
      <div className="flex flex-col gap-2">
        {PIPELINE_NODES.map((node, idx) => {
          const isActive = currentStep === idx;
          const isDone = completedSteps.has(idx) && currentStep !== idx;
          const stepMs = Math.round(inferenceTotalMs / PIPELINE_NODES.length);

          return (
            <div key={node.id} className="flex items-center gap-3">
              {/* Node */}
              <div
                className={cn(
                  "flex items-center gap-3 flex-1 rounded-xl px-3 py-2.5 border transition-all duration-300",
                  isActive && "border-brand-400 shadow-lg",
                  isDone && "opacity-60",
                  !isActive && !isDone && "opacity-40"
                )}
                style={{
                  borderColor: isActive ? node.color : "rgb(var(--border))",
                  backgroundColor: isActive ? `${node.color}15` : "transparent",
                  boxShadow: isActive ? `0 0 20px ${node.color}30` : "none",
                }}
              >
                <span className="text-lg flex-shrink-0">{node.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold truncate" style={{ color: isActive ? node.color : "rgb(var(--text-primary))" }}>
                      {node.label}
                    </p>
                    <span className="text-xs font-mono flex-shrink-0" style={{ color: "rgb(var(--text-muted))" }}>
                      {node.outputSize}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: "rgb(var(--text-muted))" }}>
                    {node.sublabel}
                  </p>
                </div>
                {isActive && (
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: node.color }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: node.color, animationDelay: "0.1s" }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: node.color, animationDelay: "0.2s" }} />
                  </div>
                )}
                {isDone && (
                  <span className="text-success-500 text-xs flex-shrink-0">✓ {stepMs}ms</span>
                )}
              </div>

              {/* Arrow connector (not on last) */}
              {idx < PIPELINE_NODES.length - 1 && (
                <div className="flex-shrink-0 w-4 flex justify-center">
                  <div
                    className="w-0.5 h-4 rounded-full transition-all duration-300"
                    style={{ backgroundColor: isDone ? node.color : "rgb(var(--border))" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
