# Visual Guide — Digital Stethoscope

> **Visual reference for UI components, layouts, and hardware setup**

---

## 🎨 UI Components

### Landing Page

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] Digital Stethoscope              [Sign In] [Get Started]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔵 IoT + ML for Water Conservation                            │
│                                                                 │
│  Listen to Your Pipes                                          │
│  Before They Leak                                              │
│                                                                 │
│  Acoustic AI system that detects water pipe leaks in           │
│  real-time using ESP32 sensors, FFT signal processing,         │
│  and machine learning.                                         │
│                                                                 │
│  [Start Free Trial →]  [View on GitHub]                        │
│                                                                 │
│  ✓ 93.6% Accuracy  ⚡ Real-time ML  📖 Open Source            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  93.6%        <200ms       4-Class      Real-time              │
│  ML Accuracy  Inference    Detection    Monitoring             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Features] [Hardware] [Architecture]                          │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│  │ 🎵 Acoustic │ │ ⚡ Real-time│ │ 📡 Live     │             │
│  │ Detection   │ │ Inference   │ │ Dashboard   │             │
│  └─────────────┘ └─────────────┘ └─────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰ Dashboard                                    🔔 👤            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dashboard                                                      │
│  50 readings · 2 active alerts                                 │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ 💧 12%   │ │ 📊 3.5bar│ │ 🌊 45LPM │ │ ⚡ 72Hz  │         │
│  │ Leak Rate│ │ Pressure │ │ Flow     │ │ Peak Freq│         │
│  │ ↓ -3%    │ │ ↑ +2%    │ │ → stable │ │ ↑ +5%    │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                 │
│  ⚠️ Major leak detected on Pipe P101 · Zone Z1 · 85%          │
│     [View Alert]                                               │
│                                                                 │
│  ┌─────────────────────────┐ ┌─────────────────────────┐      │
│  │ Severity Trend          │ │ FFT Frequency           │      │
│  │                         │ │                         │      │
│  │     ╱╲                  │ │         ╱╲              │      │
│  │    ╱  ╲    ╱╲           │ │        ╱  ╲             │      │
│  │   ╱    ╲  ╱  ╲          │ │       ╱    ╲            │      │
│  │  ╱      ╲╱    ╲         │ │      ╱      ╲           │      │
│  │ ╱              ╲        │ │     ╱        ╲          │      │
│  └─────────────────────────┘ └─────────────────────────┘      │
│                                                                 │
│  Recent Readings                                               │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬────────┐        │
│  │ Time │ Pipe │ Zone │ Freq │ Pres │ Anom │ Status │        │
│  ├──────┼──────┼──────┼──────┼──────┼──────┼────────┤        │
│  │14:32 │ P101 │  Z1  │ 72Hz │ 3.5  │ 0.85 │ 🔴 85% │        │
│  │14:31 │ P102 │  Z1  │ 15Hz │ 3.4  │ 0.12 │ 🟢 12% │        │
│  └──────┴──────┴──────┴──────┴──────┴──────┴────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Hardware Setup Wizard

```
┌─────────────────────────────────────────────────────────────────┐
│  Hardware Setup Wizard                                          │
│  Step-by-step guide to deploy your first ESP32 sensor          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ① ━━━━ ② ━━━━ ③ ━━━━ ④ ━━━━ ⑤                               │
│  Hardware  Assembly  Firmware  Configure  Deploy               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Gather Hardware                                       │
│                                                                 │
│  Required Components                                           │
│                                                                 │
│  ✓ ESP32 DevKit                                    $10         │
│  ✓ Piezo Sensor (27mm)                             $3          │
│  ✓ IP65 Enclosure                                  $8          │
│  ✓ 5V Power Supply                                 $5          │
│                                                                 │
│  Optional Components                                           │
│                                                                 │
│  ○ Pressure Sensor (4-20mA)                        $25         │
│  ○ Flow Sensor (YF-S201)                           $7          │
│  ○ DS18B20 Temperature                             $4          │
│  ○ DHT22 Humidity                                  $6          │
│                                                                 │
│  💰 Total cost: ~$75 per sensor (required only)                │
│                                                                 │
│  [Previous]                    Step 1 of 5           [Next →]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### AI Monitor

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Monitor                                    🟢 Live  ⚠️ 2   │
│  Hybrid CNN + FFT + Random Forest · v1.0.0                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Normal   │ │ 184ms    │ │ 72.3 Hz  │ │ 2 alerts │         │
│  │ 92% conf │ │ Inference│ │ FFT Peak │ │ Active   │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                 │
│  [Signal] [Pipeline] [History]                                │
│                                                                 │
│  ┌─────────────────────────┐ ┌─────────────────────────┐      │
│  │ Waveform                │ │ Confidence              │      │
│  │                         │ │                         │      │
│  │  ╱╲    ╱╲    ╱╲         │ │ Normal     ████████ 92% │      │
│  │ ╱  ╲  ╱  ╲  ╱  ╲        │ │ Pre-Leak   █ 5%        │      │
│  │╱    ╲╱    ╲╱    ╲       │ │ Minor Leak █ 2%        │      │
│  │              ╲  ╱╲      │ │ Major Leak █ 1%        │      │
│  │               ╲╱  ╲     │ │                         │      │
│  └─────────────────────────┘ └─────────────────────────┘      │
│                                                                 │
│  ┌─────────────────────────┐ ┌─────────────────────────┐      │
│  │ FFT Spectrum            │ │ System                  │      │
│  │                         │ │                         │      │
│  │     █                   │ │ Latency    184ms        │      │
│  │    ███                  │ │ CPU        12%          │      │
│  │   █████                 │ │ Memory     38%          │      │
│  │  ███████                │ │ Throughput 5.2/s        │      │
│  │ █████████               │ │                         │      │
│  └─────────────────────────┘ └─────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Hardware Diagrams

### Minimal Setup (Piezo Only)

```
                    ESP32 DevKit
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
                   └─────────────┘
```

### Full Configuration

```
                         ESP32 DevKit
                        ┌──────────────┐
                        │              │
    Piezo Sensor        │   GPIO34     │ ← Acoustic signal
    ───────────────────→│   (ADC)      │
                        │              │
    Pressure Sensor     │   GPIO35     │ ← 4-20mA via 250Ω shunt
    (4-20mA) ──[250Ω]──→│   (ADC)      │
                        │              │
    Flow Sensor         │   GPIO25     │ ← Pulse counter
    (Hall Effect) ─────→│              │
                        │              │
    DS18B20 Temp        │   GPIO4      │ ← OneWire data
    (OneWire) ─────────→│              │
                        │              │
    DHT22 Humidity      │   GPIO5      │ ← Digital data
    ─────────────────→│              │
                        │              │
    Status LED ────────→│   GPIO2      │ → Built-in LED
                        │              │
    External LED ──────→│   GPIO23     │ → External indicator
                        │              │
                        │   3.3V       │ → Sensor power
                        │   GND        │ → Common ground
                        │   VIN (5V)   │ ← USB or external 5V
                        └──────────────┘
```

### Pressure Sensor Wiring (4-20mA)

```
    Pressure Sensor (4-20mA output)
    ┌─────────────┐
    │  +24V       │ ← External 24V supply
    │  GND        │ ← Supply ground
    │  OUT (4-20mA)│
    └──────┬──────┘
           │
           ├─────[250Ω shunt]─────┐
           │                      │
           │                      ├──→ ESP32 GPIO35 (ADC)
           │                      │
           └──────────────────────┴──→ GND

    Voltage across shunt: 4mA × 250Ω = 1V (min)
                         20mA × 250Ω = 5V (max)
```

---

## 📊 Data Flow

### ESP32 → Backend → ML → Database → Frontend

```
┌─────────────┐
│   ESP32     │
│  Sensor     │
│             │
│ • Sample    │
│ • FFT       │
│ • POST      │
└──────┬──────┘
       │ HTTP POST /ingest
       │ X-API-Key: sk_live_...
       │
       ▼
┌─────────────┐
│  Backend    │
│  API :4000  │
│             │
│ • Validate  │
│ • Auth      │
│ • Route     │
└──────┬──────┘
       │
       ├──────────────────────┐
       │                      │
       ▼                      ▼
┌─────────────┐      ┌─────────────┐
│ ML Service  │      │  Supabase   │
│  :8000      │      │  PostgreSQL │
│             │      │             │
│ • Predict   │      │ • Store     │
│ • Classify  │      │ • Realtime  │
└──────┬──────┘      └──────┬──────┘
       │                    │
       │                    │
       └──────────┬─────────┘
                  │
                  ▼
           ┌─────────────┐
           │  Frontend   │
           │  :3000      │
           │             │
           │ • Display   │
           │ • Alert     │
           │ • Visualize │
           └─────────────┘
```

---

## 🎨 Color Palette

### Primary Colors

```
Indigo (Brand)
┌────┬────┬────┬────┬────┐
│ 50 │100 │200 │300 │400 │
│#eef│#e0e│#c7d│#a5b│#818│
└────┴────┴────┴────┴────┘
┌────┬────┬────┬────┬────┐
│500 │600 │700 │800 │900 │
│#636│#4f4│#433│#373│#312│
└────┴────┴────┴────┴────┘

Cyan (Accent)
┌────┬────┬────┬────┬────┐
│ 50 │100 │200 │300 │400 │
│#ecf│#cff│#a5f│#67e│#22d│
└────┴────┴────┴────┴────┘
┌────┬────┬────┬────┬────┐
│500 │600 │700 │800 │900 │
│#06b│#089│#0e7│#155│#164│
└────┴────┴────┴────┴────┘
```

### Semantic Colors

```
Success (Green)     Warning (Orange)    Danger (Red)
┌────┬────┬────┐   ┌────┬────┬────┐   ┌────┬────┬────┐
│ 50 │500 │700 │   │ 50 │500 │700 │   │ 50 │500 │700 │
│#ecf│#10b│#047│   │#fff│#f97│#c24│   │#fef│#ef4│#b91│
└────┴────┴────┘   └────┴────┴────┘   └────┴────┴────┘
```

---

## 📐 Layout Grid

### Desktop (1280px+)

```
┌─────────────────────────────────────────────────────────────────┐
│ Sidebar (256px)  │  Main Content (1024px)                       │
│                  │                                               │
│ • Logo           │  ┌─────────────────────────────────────────┐ │
│ • Navigation     │  │ Header (64px)                           │ │
│ • User           │  └─────────────────────────────────────────┘ │
│                  │                                               │
│                  │  ┌─────────────────────────────────────────┐ │
│                  │  │                                         │ │
│                  │  │                                         │ │
│                  │  │  Content Area                           │ │
│                  │  │                                         │ │
│                  │  │                                         │ │
│                  │  └─────────────────────────────────────────┘ │
│                  │                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1024px)

```
┌─────────────────────────────────────────────────────────────────┐
│ Sidebar (256px)  │  Main Content (512px - 768px)                │
│ (Collapsible)    │                                               │
│                  │  ┌─────────────────────────────────────────┐ │
│                  │  │ Header (64px)                           │ │
│                  │  └─────────────────────────────────────────┘ │
│                  │                                               │
│                  │  ┌─────────────────────────────────────────┐ │
│                  │  │  Content Area                           │ │
│                  │  │  (2-column grid)                        │ │
│                  │  └─────────────────────────────────────────┘ │
│                  │                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)

```
┌─────────────────────────────────────┐
│ ☰ Header (64px)                 🔔👤│
├─────────────────────────────────────┤
│                                     │
│  Content Area                       │
│  (1-column stack)                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Card 1                      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Card 2                      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Card 3                      │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎭 Component States

### Button States

```
Default          Hover            Active           Disabled
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Click   │    │  Click   │    │  Click   │    │  Click   │
│   Me     │    │   Me     │    │   Me     │    │   Me     │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
 #6366f1         #4f46e5         #4338ca         #9ca3af
 shadow-md       shadow-lg       shadow-sm       opacity-50
```

### Input States

```
Default          Focus            Error            Success
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│          │    │ |        │    │          │    │ ✓        │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
 border-gray     ring-indigo     border-red      border-green
```

### Alert States

```
Info             Warning          Error            Success
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ ℹ️ Info  │    │ ⚠️ Warn  │    │ ❌ Error │    │ ✅ Done  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
 bg-blue-50      bg-orange-50    bg-red-50       bg-green-50
```

---

## 📱 Responsive Breakpoints

```
Mobile          Tablet          Laptop          Desktop
0px             640px           1024px          1280px
│               │               │               │
├───────────────┤               │               │
│ 1 column      │               │               │
│               ├───────────────┤               │
│               │ 2 columns     │               │
│               │               ├───────────────┤
│               │               │ 3-4 columns   │
│               │               │               │
```

---

## 🎯 Icon System

### Navigation Icons

```
Dashboard    Alerts       Pipes        Analytics    Settings
   ▣           ⚠️           ╪            📊           ⚙️
```

### Status Icons

```
Success      Warning      Error        Info         Loading
   ✓           ⚠️           ✗            ℹ️           ⟳
```

### Action Icons

```
Edit         Delete       Copy         Download     Upload
   ✎           🗑️           📋           ⬇️           ⬆️
```

---

## 🔔 Notification Types

### Toast Notifications

```
┌─────────────────────────────────────┐
│ ✅ Success!                         │
│ Sensor deployed successfully        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ⚠️ Warning                          │
│ High anomaly score detected         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ❌ Error                            │
│ Failed to connect to backend        │
└─────────────────────────────────────┘
```

### Push Notifications

```
┌─────────────────────────────────────┐
│ 🚨 Digital Stethoscope              │
│                                     │
│ Major leak detected!                │
│ Pipe P101 · Zone Z1 · 85% severity │
│                                     │
│ [View] [Dismiss]                    │
└─────────────────────────────────────┘
```

---

## 📊 Chart Types

### Line Chart (Waveform)

```
  1.0 ┤     ╱╲    ╱╲
  0.5 ┤    ╱  ╲  ╱  ╲
  0.0 ┼───╱────╲╱────╲───
 -0.5 ┤              ╲  ╱
 -1.0 ┤               ╲╱
      └─────────────────────→ time
```

### Bar Chart (FFT Spectrum)

```
 1.0 ┤     █
 0.8 ┤    ███
 0.6 ┤   █████
 0.4 ┤  ███████
 0.2 ┤ █████████
 0.0 ┼───────────────────→ frequency
```

### Area Chart (Severity Trend)

```
100% ┤       ╱╲
 75% ┤      ╱  ╲
 50% ┤     ╱    ╲
 25% ┤    ╱      ╲
  0% ┼───╱────────╲───────→ time
     └─────────────────────
```

---

## 🎨 Animation Examples

### Fade In

```
Frame 1    Frame 2    Frame 3    Frame 4
opacity:0  opacity:25 opacity:50 opacity:100
┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
│      │  │░░░░░░│  │▒▒▒▒▒▒│  │██████│
└──────┘  └──────┘  └──────┘  └──────┘
```

### Slide Up

```
Frame 1    Frame 2    Frame 3    Frame 4
y: +20px   y: +10px   y: +5px    y: 0px
           ┌──────┐
           │      │
           └──────┘
┌──────┐            ┌──────┐
│      │            │      │
└──────┘            └──────┘
         ┌──────┐
         │      │
         └──────┘
```

### Pulse (Live Indicator)

```
Frame 1    Frame 2    Frame 3    Frame 4
opacity:100 opacity:75 opacity:50 opacity:100
   ●          ◉          ○          ●
```

---

## 📝 Typography Scale

```
text-xs     12px   Small labels, captions
text-sm     14px   Body text, descriptions
text-base   16px   Default body text
text-lg     18px   Subheadings
text-xl     20px   Card titles
text-2xl    24px   Section headings
text-3xl    30px   Page titles
text-4xl    36px   Hero headings
text-5xl    48px   Landing page hero
text-6xl    60px   Extra large display
```

---

## 🎯 Spacing Scale

```
gap-0    0px     No spacing
gap-1    4px     Tight spacing
gap-2    8px     Compact spacing
gap-3    12px    Default spacing
gap-4    16px    Comfortable spacing
gap-6    24px    Loose spacing
gap-8    32px    Section spacing
gap-12   48px    Large section spacing
gap-16   64px    Extra large spacing
```

---

**Last updated:** May 12, 2026  
**Version:** 2.0.0  
**Design System:** Tailwind CSS 3.4+
