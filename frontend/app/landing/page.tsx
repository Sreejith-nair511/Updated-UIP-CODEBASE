"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Droplets,
  Zap,
  Shield,
  TrendingUp,
  Wifi,
  Activity,
  CheckCircle,
  ArrowRight,
  Play,
  Github,
  BookOpen,
  Cpu,
  Radio,
  BarChart3,
  Bell,
  Lock,
  Globe,
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"features" | "hardware" | "architecture">("features");

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                Digital Stethoscope
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/sign-in"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-lg hover:from-indigo-700 hover:to-cyan-700 transition-all shadow-lg shadow-indigo-500/30"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  IoT + ML for Water Conservation
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  Listen to Your Pipes
                </span>
                <br />
                <span className="text-gray-900 dark:text-gray-100">
                  Before They Leak
                </span>
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                Acoustic AI system that detects water pipe leaks in real-time using ESP32 sensors,
                FFT signal processing, and machine learning. Save water, prevent damage, reduce costs.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-xl hover:from-indigo-700 hover:to-cyan-700 transition-all shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="https://github.com/tejaswinisa1/water_leakage-unisys-"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-all shadow-lg"
                >
                  <Github className="w-5 h-5" />
                  View on GitHub
                </a>
              </div>

              <div className="flex items-center gap-8 pt-4">
                {[
                  { label: "93.6% Accuracy", icon: TrendingUp },
                  { label: "Real-time ML", icon: Zap },
                  { label: "Open Source", icon: Github },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <stat.icon className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl blur-3xl opacity-20" />
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-white/30" />
                    <div className="w-3 h-3 rounded-full bg-white/30" />
                    <div className="w-3 h-3 rounded-full bg-white/30" />
                  </div>
                  <span className="text-sm font-medium text-white ml-2">Live Dashboard</span>
                </div>
                <div className="p-6 space-y-4">
                  {/* Mock dashboard preview */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Leak Rate", value: "12%", color: "text-red-500" },
                      { label: "Avg Pressure", value: "3.5 bar", color: "text-indigo-500" },
                      { label: "Avg Flow", value: "45 LPM", color: "text-cyan-500" },
                      { label: "Peak Freq", value: "72 Hz", color: "text-purple-500" },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                        <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-32 bg-gradient-to-r from-indigo-100 to-cyan-100 dark:from-indigo-950 dark:to-cyan-950 rounded-lg flex items-center justify-center">
                    <Activity className="w-12 h-12 text-indigo-400 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live monitoring · 3 active sensors
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "93.6%", label: "ML Accuracy", icon: TrendingUp },
              { value: "<200ms", label: "Inference Time", icon: Zap },
              { value: "4-Class", label: "Leak Detection", icon: Activity },
              { value: "Real-time", label: "Monitoring", icon: Radio },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 mb-3">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabbed Content Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Complete IoT Solution
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              From hardware to cloud, everything you need to detect leaks
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            {[
              { id: "features", label: "Features", icon: Zap },
              { id: "hardware", label: "Hardware", icon: Cpu },
              { id: "architecture", label: "Architecture", icon: Globe },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
            {activeTab === "features" && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: Activity,
                    title: "Acoustic Leak Detection",
                    description: "4-class ML model: Normal → Pre-Leak → Minor → Major",
                  },
                  {
                    icon: Zap,
                    title: "Real-time Inference",
                    description: "LightGBM model with <200ms latency, 94-feature vector",
                  },
                  {
                    icon: Radio,
                    title: "Live Dashboard",
                    description: "Supabase Realtime for instant updates, no polling",
                  },
                  {
                    icon: Bell,
                    title: "Smart Alerts",
                    description: "Web Push notifications when leaks detected",
                  },
                  {
                    icon: Shield,
                    title: "Circuit Breaker",
                    description: "Automatic fallback to heuristics when ML unavailable",
                  },
                  {
                    icon: BarChart3,
                    title: "Analytics",
                    description: "Severity trends, zone heatmaps, historical analysis",
                  },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="p-6 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-850 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "hardware" && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                      ESP32 Sensor Node
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "ESP32 DevKit with WiFi",
                        "Piezo/MEMS microphone (4kHz sampling)",
                        "4-20mA pressure sensor",
                        "Hall-effect flow sensor",
                        "Temperature & humidity sensors",
                        "IP65 waterproof enclosure",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-gray-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-950 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                        💰 Total cost per unit: ~$75
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Cpu className="w-24 h-24 text-indigo-500 mx-auto" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ready-to-flash Arduino firmware
                      </p>
                      <Link
                        href="/HARDWARE_SETUP.md"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                      >
                        <BookOpen className="w-4 h-4" />
                        View Setup Guide
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "architecture" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Edge Layer",
                      items: ["ESP32 sensors", "FFT processing", "HTTP POST"],
                      color: "from-green-500 to-emerald-500",
                    },
                    {
                      title: "Backend Layer",
                      items: ["Node.js API", "ML inference", "Supabase DB"],
                      color: "from-indigo-500 to-purple-500",
                    },
                    {
                      title: "Frontend Layer",
                      items: ["Next.js 14", "Real-time UI", "Push alerts"],
                      color: "from-cyan-500 to-blue-500",
                    },
                  ].map((layer) => (
                    <div
                      key={layer.title}
                      className="p-6 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-850 border border-gray-200 dark:border-gray-700"
                    >
                      <div
                        className={`w-full h-2 rounded-full bg-gradient-to-r ${layer.color} mb-4`}
                      />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        {layer.title}
                      </h4>
                      <ul className="space-y-2">
                        {layer.items.map((item) => (
                          <li
                            key={item}
                            className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-950 dark:to-cyan-950 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <p className="text-center text-gray-700 dark:text-gray-300">
                    <strong>Full-stack TypeScript</strong> · Docker Compose · PostgreSQL · Redis ·
                    Nginx
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-cyan-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Stop Water Waste?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Deploy your first sensor in under 30 minutes. Open source, self-hosted, no vendor lock-in.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-indigo-600 bg-white rounded-xl hover:bg-gray-50 transition-all shadow-xl"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://github.com/tejaswinisa1/water_leakage-unisys-"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white border-2 border-white rounded-xl hover:bg-white/10 transition-all"
            >
              <Github className="w-5 h-5" />
              View Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Digital Stethoscope</span>
              </div>
              <p className="text-sm">
                Acoustic AI for urban water conservation. Built for Unisys Innovation Program 2026.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/sign-up" className="hover:text-white transition-colors">Get Started</Link></li>
                <li><a href="https://github.com/tejaswinisa1/water_leakage-unisys-" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/HARDWARE_SETUP.md" className="hover:text-white transition-colors">Hardware Guide</a></li>
                <li><a href="https://github.com/tejaswinisa1/water_leakage-unisys-" className="hover:text-white transition-colors">GitHub</a></li>
                <li><a href="https://github.com/tejaswinisa1/water_leakage-unisys-/blob/main/README.md" className="hover:text-white transition-colors">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">MIT License</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>© 2026 Digital Stethoscope. Open source under MIT License.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
