"use client";

import { useState } from "react";
import { Bell, Shield, Database, Cpu, Save, CheckCircle, Palette, Globe, Key, Wifi, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { usePushNotifications } from "@/hooks/usePushNotifications";

type Section = "appearance" | "alerts" | "notifications" | "signal" | "model" | "data" | "security";

const NAV: { id: Section; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "appearance",    label: "Appearance",    icon: Palette,  desc: "Theme and display" },
  { id: "alerts",        label: "Alert Rules",   icon: Bell,     desc: "Thresholds and triggers" },
  { id: "notifications", label: "Notifications", icon: Wifi,     desc: "Push and email" },
  { id: "signal",        label: "Signal",        icon: Cpu,      desc: "Sampling and FFT" },
  { id: "model",         label: "ML Model",      icon: Shield,   desc: "Model and inference" },
  { id: "data",          label: "Data",          icon: Database, desc: "Retention and export" },
  { id: "security",      label: "Security",      icon: Key,      desc: "API keys and access" },
];

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <div className="flex-shrink-0 ml-4">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={cn("relative w-10 h-5.5 rounded-full transition-colors", value ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700")}
      style={{ height: "22px" }}>
      <span className={cn("absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform", value && "translate-x-4.5")}
        style={{ width: "18px", height: "18px", transform: value ? "translateX(18px)" : "translateX(0)" }} />
    </button>
  );
}

export default function SettingsPage() {
  const [active, setActive] = useState<Section>("appearance");
  const [saved, setSaved]   = useState(false);
  const push = usePushNotifications();
  const [s, setS] = useState({
    leakThreshold: 0.7, severityThreshold: 30,
    pushNotifications: true, emailAlerts: false, autoResolve: false,
    samplingInterval: 60, fftWindowSize: 256,
    modelVersion: "hybrid_cnn_rf_v1",
    retentionDays: 90,
  });

  const update = (k: string, v: any) => setS(p => ({ ...p, [k]: v }));
  const save = async () => {
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
    } catch {
      // non-critical — settings still update locally
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const current = NAV.find(n => n.id === active)!;

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your system preferences</p>
      </div>

      <div className="flex gap-5">
        {/* Sidebar nav */}
        <div className="w-44 flex-shrink-0 space-y-0.5">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setActive(n.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors text-sm",
                active === n.id
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}>
              <n.icon className="w-4 h-4 flex-shrink-0" />
              {n.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{current.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{current.desc}</p>
            </div>
            <div className="px-5">

              {active === "appearance" && (
                <>
                  <Row label="Theme" desc="Choose light, dark, or follow system">
                    <ThemeToggle variant="segmented" />
                  </Row>
                  <Row label="Language" desc="Interface language">
                    <select className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>English</option>
                      <option>हिंदी</option>
                      <option>தமிழ்</option>
                      <option>తెలుగు</option>
                      <option>ಕನ್ನಡ</option>
                    </select>
                  </Row>
                </>
              )}

              {active === "alerts" && (
                <>
                  <Row label="Leak probability threshold" desc={`Alert when leak probability exceeds ${Math.round(s.leakThreshold * 100)}%`}>
                    <div className="flex items-center gap-3">
                      <input type="range" min="0.5" max="0.99" step="0.01" value={s.leakThreshold}
                        onChange={e => update("leakThreshold", parseFloat(e.target.value))}
                        className="w-28 accent-indigo-600" />
                      <span className="text-sm font-mono font-medium text-indigo-600 w-10">{Math.round(s.leakThreshold * 100)}%</span>
                    </div>
                  </Row>
                  <Row label="Severity threshold" desc={`Alert when severity exceeds ${s.severityThreshold}%`}>
                    <div className="flex items-center gap-3">
                      <input type="range" min="10" max="90" step="5" value={s.severityThreshold}
                        onChange={e => update("severityThreshold", parseInt(e.target.value))}
                        className="w-28 accent-amber-500" />
                      <span className="text-sm font-mono font-medium text-amber-600 w-10">{s.severityThreshold}%</span>
                    </div>
                  </Row>
                  <Row label="Auto-resolve alerts" desc="Automatically resolve when readings normalize">
                    <Toggle value={s.autoResolve} onChange={v => update("autoResolve", v)} />
                  </Row>
                </>
              )}

              {active === "notifications" && (
                <>
                  <Row label="Push notifications" desc={push.supported ? "Browser alerts for new leaks" : "Not supported in this browser"}>
                    {push.supported ? (
                      <button
                        onClick={push.subscribed ? push.unsubscribe : push.subscribe}
                        disabled={push.loading}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors",
                          push.subscribed
                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                            : "bg-indigo-600 text-white border-transparent hover:bg-indigo-700"
                        )}
                      >
                        {push.loading ? "…" : push.subscribed ? "✓ Subscribed" : "Enable"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Unavailable</span>
                    )}
                  </Row>
                  <Row label="Email alerts" desc="Send email for critical events">
                    <Toggle value={s.emailAlerts} onChange={v => update("emailAlerts", v)} />
                  </Row>
                </>
              )}

              {active === "signal" && (
                <>
                  <Row label="Sampling interval" desc="How often the ESP32 sends data">
                    <select value={s.samplingInterval} onChange={e => update("samplingInterval", parseInt(e.target.value))}
                      className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500">
                      {[15,30,60,120,300].map(v => <option key={v} value={v}>{v}s{v===60?" (recommended)":""}</option>)}
                    </select>
                  </Row>
                  <Row label="FFT window size" desc="Samples per FFT computation">
                    <select value={s.fftWindowSize} onChange={e => update("fftWindowSize", parseInt(e.target.value))}
                      className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500">
                      {[64,128,256,512,1024].map(v => <option key={v} value={v}>{v}{v===256?" (recommended)":""}</option>)}
                    </select>
                  </Row>
                </>
              )}

              {active === "model" && (
                <>
                  <Row label="Active model" desc="Hybrid CNN+FFT+RF v1.0.0">
                    <span className="text-xs font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900">v1.0.0</span>
                  </Row>
                  <Row label="Accuracy" desc="Test set performance">
                    <span className="text-sm font-semibold text-green-600">93.58%</span>
                  </Row>
                  <Row label="F1-macro" desc="Macro-averaged F1 score">
                    <span className="text-sm font-semibold text-green-600">0.9357</span>
                  </Row>
                  <Row label="Major Leak F1" desc="Critical class performance">
                    <span className="text-sm font-semibold text-green-600">1.000</span>
                  </Row>
                  <Row label="Feature vector" desc="CNN + FFT hybrid">
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400">69-d (64+5)</span>
                  </Row>
                </>
              )}

              {active === "data" && (
                <Row label="Data retention" desc={`Keep readings for ${s.retentionDays} days`}>
                  <div className="flex items-center gap-3">
                    <input type="range" min="30" max="365" step="30" value={s.retentionDays}
                      onChange={e => update("retentionDays", parseInt(e.target.value))}
                      className="w-28 accent-indigo-600" />
                    <span className="text-sm font-mono font-medium text-indigo-600 w-16">{s.retentionDays}d</span>
                  </div>
                </Row>
              )}

              {active === "security" && (
                <>
                  <Row label="Groq API" desc="AI assistant backend">
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">gsk_••••••••••••</span>
                  </Row>
                  <Row label="Supabase URL" desc="Database connection">
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">eotsrnws••••</span>
                  </Row>
                  <Row label="Device API key" desc="ESP32 authentication">
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">••••••••</span>
                  </Row>
                </>
              )}

            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={save}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                saved ? "bg-green-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white")}>
              {saved ? <><CheckCircle className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}