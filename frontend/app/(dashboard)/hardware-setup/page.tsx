"use client";

import { useState } from "react";
import {
  Cpu,
  Wifi,
  Radio,
  CheckCircle,
  AlertCircle,
  Copy,
  Download,
  ExternalLink,
  ChevronRight,
  Zap,
  Settings,
  Play,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "hardware",
    title: "Gather Hardware",
    description: "Collect all required components",
  },
  {
    id: "assembly",
    title: "Assemble Circuit",
    description: "Connect sensors to ESP32",
  },
  {
    id: "firmware",
    title: "Flash Firmware",
    description: "Upload Arduino code",
  },
  {
    id: "configure",
    title: "Configure Device",
    description: "Set WiFi and API credentials",
  },
  {
    id: "deploy",
    title: "Deploy Sensor",
    description: "Install on pipe and test",
  },
];

export default function HardwareSetupPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [deviceConfig, setDeviceConfig] = useState({
    pipeId: "P101",
    zoneId: "Z1",
    apiKey: "sk_live_" + Math.random().toString(36).substring(2, 15),
  });
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateFirmwareConfig = () => {
    return `// ── WiFi credentials ──────────────────────────────────────────
#define WIFI_SSID        "YOUR_WIFI_SSID"
#define WIFI_PASSWORD    "YOUR_WIFI_PASSWORD"

// ── Backend API ───────────────────────────────────────────────
#define BACKEND_URL      "${window.location.origin.replace("3000", "4000")}/ingest"
#define DEVICE_API_KEY   "${deviceConfig.apiKey}"

// ── Device identity ───────────────────────────────────────────
#define PIPE_ID          "${deviceConfig.pipeId}"
#define ZONE_ID          "${deviceConfig.zoneId}"`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Hardware Setup Wizard
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Step-by-step guide to deploy your first ESP32 sensor
        </p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <button
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                    index < currentStep
                      ? "bg-green-500 text-white"
                      : index === currentStep
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                  )}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </button>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-xs font-medium",
                      index <= currentStep
                        ? "text-gray-900 dark:text-gray-100"
                        : "text-gray-500"
                    )}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 transition-all",
                    index < currentStep
                      ? "bg-green-500"
                      : "bg-gray-200 dark:bg-gray-800"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Required Components
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: "ESP32 DevKit v1",        cost: "₹350",  required: true,  where: "Robu.in / Amazon" },
                  { name: "Piezo Sensor (27mm)",     cost: "₹80",   required: true,  where: "Robu.in / local" },
                  { name: "Pressure Sensor (4-20mA)",cost: "₹450",  required: false, where: "Amazon / Indiamart" },
                  { name: "Flow Sensor (YF-S201)",   cost: "₹180",  required: false, where: "Robu.in / Amazon" },
                  { name: "DS18B20 Temperature",     cost: "₹90",   required: false, where: "Robu.in" },
                  { name: "DHT22 Humidity",          cost: "₹150",  required: false, where: "Robu.in / Amazon" },
                  { name: "IP65 Enclosure",          cost: "₹220",  required: true,  where: "Amazon / local" },
                  { name: "5V 2A Power Supply",      cost: "₹120",  required: true,  where: "Amazon / local" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      {item.required ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>
                          {item.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "rgb(var(--text-muted))" }}>
                          {item.required ? "Required" : "Optional"} · {(item as any).where}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular flex-shrink-0">
                      {item.cost}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl border"
                style={{ background: "rgb(var(--bg-tertiary))", borderColor: "rgb(var(--border))" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "rgb(var(--text-primary))" }}>
                      💰 Required components only
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgb(var(--text-muted))" }}>
                      ESP32 + Piezo + Enclosure + Power Supply
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">₹770</p>
                    <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>total cost</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgb(var(--border))" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>
                      All components (full kit)
                    </p>
                    <p className="text-sm font-bold" style={{ color: "rgb(var(--text-secondary))" }}>₹1,440</p>
                  </div>
                  <p className="text-xs mt-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Under ₹1,500 — available on Amazon India / Robu.in
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Circuit Assembly
              </h3>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
                <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
{`                    ESP32 DevKit
                   ┌─────────────┐
                   │             │
    Piezo Sensor   │   GPIO34    │ ← ADC1_CH6 (input only)
    ┌────┐         │   (ADC)     │
    │ +  ├─────────┤             │
    │    │         │             │
    │ -  ├─────────┤   GND       │
    └────┘         │             │
                   │   GPIO2     │ → LED (status)
                   │             │
                   │   3.3V      │ → Power rail
                   │   GND       │ → Ground rail
                   └─────────────┘`}
                </pre>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Connection Steps:
                </h4>
                {[
                  "Solder 20cm wires to piezo sensor (red = +, black = -)",
                  "Connect piezo positive to ESP32 GPIO34",
                  "Connect piezo negative to ESP32 GND",
                  "Add 100nF capacitor across piezo leads (noise filtering)",
                  "Connect LED: Anode → GPIO2, Cathode → GND via 220Ω resistor",
                  "Secure all connections with heat shrink tubing",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Flash Firmware
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Prerequisites
                      </p>
                      <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1">
                        <li>• Arduino IDE 2.0+ installed</li>
                        <li>• ESP32 board support added</li>
                        <li>• ArduinoJson & arduinoFFT libraries installed</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Installation Steps:
                  </h4>
                  <div className="space-y-3">
                    {[
                      {
                        title: "Download firmware",
                        action: (
                          <a
                            href="https://github.com/tejaswinisa1/water_leakage-unisys-/tree/main/firmware"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download from GitHub
                          </a>
                        ),
                      },
                      {
                        title: "Open in Arduino IDE",
                        action: (
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            esp32_stethoscope.ino
                          </code>
                        ),
                      },
                      {
                        title: "Select board",
                        action: (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Tools → Board → ESP32 Dev Module
                          </span>
                        ),
                      },
                      {
                        title: "Connect ESP32 via USB",
                        action: (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Select correct COM port in Tools → Port
                          </span>
                        ),
                      },
                      {
                        title: "Upload firmware",
                        action: (
                          <button className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                            <Play className="w-4 h-4" />
                            Click Upload (→)
                          </button>
                        ),
                      },
                    ].map((step, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-semibold">
                            {i + 1}
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {step.title}
                          </span>
                        </div>
                        {step.action}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Device Configuration
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pipe ID
                  </label>
                  <input
                    type="text"
                    value={deviceConfig.pipeId}
                    onChange={(e) =>
                      setDeviceConfig({ ...deviceConfig, pipeId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="P101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zone ID
                  </label>
                  <input
                    type="text"
                    value={deviceConfig.zoneId}
                    onChange={(e) =>
                      setDeviceConfig({ ...deviceConfig, zoneId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Z1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Generated API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deviceConfig.apiKey}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(deviceConfig.apiKey)}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Firmware Configuration
                  </label>
                  <button
                    onClick={() => copyToClipboard(generateFirmwareConfig())}
                    className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Config
                  </button>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs font-mono text-green-400">
                    {generateFirmwareConfig()}
                  </pre>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Copy this configuration and paste it into the firmware file, replacing the
                  existing configuration block.
                </p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Deploy & Test
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Configuration Complete!
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Your device is ready for deployment. Follow the steps below to install
                        and test.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Deployment Checklist:
                  </h4>
                  <div className="space-y-2">
                    {[
                      "Clean pipe surface (remove dirt, rust, paint)",
                      "Apply ultrasound gel or petroleum jelly to piezo sensor",
                      "Attach sensor to pipe using hose clamp or epoxy",
                      "Mount enclosure within 2m of sensor",
                      "Connect power supply",
                      "Wait for LED to blink 3 times (success indicator)",
                      "Check dashboard for first reading (within 60 seconds)",
                      "Tap pipe gently to verify acoustic detection",
                    ].map((item, i) => (
                      <label
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <a
                    href="/dashboard"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
                  >
                    <Zap className="w-5 h-5" />
                    View Dashboard
                  </a>
                  <a
                    href="https://github.com/tejaswinisa1/water_leakage-unisys-/blob/main/HARDWARE_SETUP.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Full Documentation
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {STEPS.length}
          </div>
          <button
            onClick={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
            disabled={currentStep === STEPS.length - 1}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
