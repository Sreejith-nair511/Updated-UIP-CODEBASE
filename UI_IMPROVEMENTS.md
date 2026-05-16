# UI Improvements — Digital Stethoscope

> **Complete guide to the enhanced user interface and user experience**

---

## 🎨 Overview

The Digital Stethoscope UI has been completely redesigned with a focus on:
- **Modern aesthetics** — Gradient accents, smooth animations, glassmorphism
- **Improved usability** — Intuitive navigation, clear information hierarchy
- **Accessibility** — WCAG 2.1 AA compliant, keyboard navigation, screen reader support
- **Responsiveness** — Mobile-first design, works on all screen sizes
- **Performance** — Optimized rendering, lazy loading, efficient state management

---

## 🚀 New Features

### 1. Landing Page (`/landing`)

**Purpose:** Public-facing page to showcase the platform and drive sign-ups

**Key Features:**
- **Hero section** with animated gradient text and live dashboard preview
- **Stats showcase** — 93.6% accuracy, <200ms inference, real-time monitoring
- **Tabbed content** — Features, Hardware, Architecture sections
- **Interactive elements** — Hover effects, smooth transitions
- **Call-to-action** — Prominent sign-up buttons, GitHub link
- **Responsive footer** — Links to documentation, resources, legal

**Design Highlights:**
```tsx
// Gradient text effect
<span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
  Listen to Your Pipes
</span>

// Glassmorphism card
<div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
  {/* Content */}
</div>
```

**Screenshots:**
- Hero with animated gradient background
- Stats grid with icon badges
- Tabbed content with smooth transitions
- CTA section with dual buttons

---

### 2. Hardware Setup Wizard (`/hardware-setup`)

**Purpose:** Step-by-step guide to deploy ESP32 sensors

**Key Features:**
- **5-step wizard** — Hardware → Assembly → Firmware → Configure → Deploy
- **Progress indicator** — Visual stepper with completion states
- **Interactive forms** — Auto-generated API keys, firmware config
- **Circuit diagrams** — ASCII art wiring guides
- **Copy-to-clipboard** — One-click config copying
- **Checklist** — Deployment verification tasks

**Steps:**

1. **Gather Hardware**
   - Component list with costs
   - Required vs. optional indicators
   - Total cost calculator

2. **Assemble Circuit**
   - ASCII circuit diagram
   - Step-by-step connection guide
   - Safety warnings

3. **Flash Firmware**
   - Prerequisites checklist
   - Arduino IDE setup instructions
   - Upload procedure with screenshots

4. **Configure Device**
   - Pipe ID / Zone ID inputs
   - Auto-generated API key
   - Firmware config code block with syntax highlighting

5. **Deploy & Test**
   - Deployment checklist with checkboxes
   - Links to dashboard and documentation
   - Success indicators

**Design Highlights:**
```tsx
// Progress stepper
<div className="flex items-center justify-between">
  {STEPS.map((step, index) => (
    <div className={cn(
      "w-10 h-10 rounded-full",
      index < currentStep ? "bg-green-500" : "bg-gray-200"
    )}>
      {index < currentStep ? <CheckCircle /> : index + 1}
    </div>
  ))}
</div>

// Auto-generated config
const generateFirmwareConfig = () => {
  return `#define WIFI_SSID "${wifiSsid}"
#define DEVICE_API_KEY "${apiKey}"
#define PIPE_ID "${pipeId}"`;
};
```

---

### 3. Enhanced Dashboard (`/dashboard`)

**Improvements:**
- **Live status indicators** — ML model version, active alerts
- **Trend arrows** — Up/down/stable indicators for KPIs
- **Zone leak rates** — Bar chart showing leak distribution
- **Recent readings table** — Sortable, filterable, with severity badges
- **Responsive grid** — Adapts to screen size (1-4 columns)

**New Components:**
- `Trend` — Shows percentage change with colored arrows
- `SeverityBadge` — Color-coded severity indicator
- `StatCard` — Reusable KPI card with icon and trend

**Design Highlights:**
```tsx
// KPI card with gradient icon
<div className="rounded-xl border bg-white dark:bg-gray-900 p-4">
  <div className="flex items-center justify-between mb-2">
    <p className="text-xs text-gray-500">Leak Rate</p>
    <Droplets className="w-4 h-4" style={{ color: "#ef4444" }} />
  </div>
  <p className="text-xl font-semibold" style={{ color: "#ef4444" }}>
    12%
  </p>
  <Trend current={12} prev={15} />
</div>
```

---

### 4. AI Monitor Enhancements (`/ai-monitor`)

**Improvements:**
- **Tabbed interface** — Signal, Pipeline, History tabs
- **Live waveform** — Real-time acoustic signal visualization
- **FFT spectrum** — Bar chart showing frequency distribution
- **Inference pipeline** — Animated step-by-step visualization
- **Confidence breakdown** — Per-class probability bars
- **System metrics** — CPU, memory, throughput gauges

**New Visualizations:**
- **Waveform chart** — Line chart with amplitude over time
- **FFT spectrum** — Bar chart with frequency bins
- **Pipeline animation** — Sequential stage highlighting
- **Confidence bars** — Horizontal progress bars with percentages

**Design Highlights:**
```tsx
// Animated pipeline stage
<div className={cn(
  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
  active && "bg-indigo-50 dark:bg-indigo-950"
)}>
  <div className={cn(
    "w-2 h-2 rounded-full",
    active && "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
  )} />
  <span>{stage.label}</span>
  {active && <span className="animate-pulse">···</span>}
</div>
```

---

### 5. Alerts Page Redesign (`/alerts`)

**Improvements:**
- **Summary cards** — Active, Acknowledged, Resolved counts
- **Filter tabs** — Quick filtering by status
- **Alert cards** — Color-coded borders, severity badges
- **Probability bars** — Visual leak probability indicator
- **Action buttons** — Acknowledge, Resolve with icons
- **Empty state** — Friendly message when no alerts

**Design Highlights:**
```tsx
// Alert card with colored border
<div className={cn(
  "card border-l-4 p-4",
  alert.alert_type === "major_leak" && "border-l-red-500 bg-red-50/40"
)}>
  <div className="flex items-start gap-3">
    <AlertTriangle className="w-4 h-4 text-red-600" />
    <div className="flex-1">
      <p className="text-sm font-semibold">{alert.message}</p>
      <div className="mt-2">
        <div className="h-1.5 bg-gray-200 rounded-full">
          <div
            className="h-full bg-red-500 rounded-full"
            style={{ width: `${alert.leak_probability * 100}%` }}
          />
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 🎨 Design System

### Color Palette

```css
/* Primary — Indigo */
--brand-50: #eef2ff;
--brand-500: #6366f1;
--brand-600: #4f46e5;
--brand-700: #4338ca;

/* Accent — Cyan */
--accent-500: #06b6d4;
--accent-600: #0891b2;

/* Semantic Colors */
--success-500: #10b981;  /* Green */
--warning-500: #f97316;  /* Orange */
--danger-500: #ef4444;   /* Red */
```

### Typography

```css
/* Font Families */
font-family: 'Inter', system-ui, sans-serif;  /* Body text */
font-family: 'JetBrains Mono', monospace;     /* Code, numbers */

/* Font Sizes */
text-xs: 0.75rem;    /* 12px */
text-sm: 0.875rem;   /* 14px */
text-base: 1rem;     /* 16px */
text-lg: 1.125rem;   /* 18px */
text-xl: 1.25rem;    /* 20px */
text-2xl: 1.5rem;    /* 24px */
text-4xl: 2.25rem;   /* 36px */
```

### Spacing

```css
/* Consistent spacing scale */
gap-1: 0.25rem;   /* 4px */
gap-2: 0.5rem;    /* 8px */
gap-3: 0.75rem;   /* 12px */
gap-4: 1rem;      /* 16px */
gap-6: 1.5rem;    /* 24px */
gap-8: 2rem;      /* 32px */
```

### Border Radius

```css
rounded-lg: 0.5rem;   /* 8px — Cards, buttons */
rounded-xl: 0.75rem;  /* 12px — Panels, modals */
rounded-2xl: 1rem;    /* 16px — Hero sections */
rounded-full: 9999px; /* Pills, avatars */
```

### Shadows

```css
/* Elevation system */
shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
shadow: 0 1px 3px rgba(0,0,0,0.1);
shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
shadow-xl: 0 20px 25px rgba(0,0,0,0.1);
shadow-2xl: 0 25px 50px rgba(0,0,0,0.25);
```

---

## 🎭 Animations

### Fade In

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
```

### Slide Up

```css
@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}
```

### Pulse (Live Indicator)

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Glow (Active Elements)

```css
@keyframes glow {
  from { box-shadow: 0 0 5px rgba(99,102,241,0.3); }
  to { box-shadow: 0 0 20px rgba(99,102,241,0.8); }
}

.animate-glow {
  animation: glow 2s ease-in-out infinite alternate;
}
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile first approach */
sm: 640px;   /* Small tablets */
md: 768px;   /* Tablets */
lg: 1024px;  /* Laptops */
xl: 1280px;  /* Desktops */
2xl: 1536px; /* Large desktops */
```

### Grid Layouts

```tsx
// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards */}
</div>

// Responsive flex
<div className="flex flex-col lg:flex-row gap-4">
  {/* Content */}
</div>
```

### Mobile Navigation

```tsx
// Hamburger menu for mobile
<button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
  <Menu className="w-5 h-5" />
</button>

// Overlay for mobile sidebar
{sidebarOpen && (
  <div
    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
    onClick={() => setSidebarOpen(false)}
  />
)}
```

---

## ♿ Accessibility

### Keyboard Navigation

```tsx
// Focus styles
<button className="focus:ring-2 focus:ring-indigo-500 focus:outline-none">
  Click me
</button>

// Tab order
<div tabIndex={0} role="button" onKeyDown={handleKeyDown}>
  Interactive element
</div>
```

### Screen Reader Support

```tsx
// ARIA labels
<button aria-label="Close modal">
  <X className="w-5 h-5" />
</button>

// ARIA live regions
<div aria-live="polite" aria-atomic="true">
  {alertCount} active alerts
</div>

// Semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>
```

### Color Contrast

All text meets WCAG 2.1 AA standards:
- **Normal text:** 4.5:1 contrast ratio
- **Large text:** 3:1 contrast ratio
- **Interactive elements:** 3:1 contrast ratio

---

## 🌙 Dark Mode

### Implementation

```tsx
// Theme provider
<ThemeProvider attribute="class" defaultTheme="system">
  {children}
</ThemeProvider>

// Theme toggle
<ThemeToggle variant="segmented" />

// Dark mode styles
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  {/* Content */}
</div>
```

### Color Adjustments

```css
/* Light mode */
--bg-primary: 255, 255, 255;      /* White */
--text-primary: 17, 24, 39;       /* Gray-900 */

/* Dark mode */
--bg-primary: 17, 24, 39;         /* Gray-900 */
--text-primary: 243, 244, 246;    /* Gray-100 */
```

---

## 📊 Data Visualization

### Chart Library

**Recharts** — Composable charting library for React

**Chart Types:**
- **Line Chart** — Waveform, frequency trends
- **Area Chart** — Severity trends with gradient fill
- **Bar Chart** — Zone leak rates, FFT spectrum
- **Radial Bar Chart** — Confidence gauges (future)

### Chart Styling

```tsx
// Consistent chart margins
margin={{ top: 4, right: 4, left: -28, bottom: 0 }}

// Grid styling
<CartesianGrid strokeDasharray="2 4" stroke="rgba(0,0,0,0.04)" />

// Axis styling
<XAxis
  tick={{ fontSize: 9, fill: "#9ca3af" }}
  tickLine={false}
  axisLine={false}
/>

// Tooltip styling
<Tooltip
  contentStyle={{
    fontSize: 11,
    borderRadius: 8,
    border: "1px solid #e5e7eb"
  }}
/>
```

---

## 🧩 Reusable Components

### StatCard

```tsx
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentType;
  color: string;
  trend?: { current: number; prev: number };
}

<StatCard
  label="Leak Rate"
  value="12%"
  icon={Droplets}
  color="#ef4444"
  trend={{ current: 12, prev: 15 }}
/>
```

### SeverityBadge

```tsx
interface SeverityBadgeProps {
  severity: number; // 0-100
}

<SeverityBadge severity={85} />
// Renders: <span className="bg-red-100 text-red-700">Critical</span>
```

### EmptyState

```tsx
interface EmptyStateProps {
  icon: React.ComponentType;
  title: string;
  description: string;
  action?: React.ReactNode;
}

<EmptyState
  icon={CheckCircle}
  title="No alerts"
  description="All clear — no active leaks detected."
/>
```

---

## 🚀 Performance Optimizations

### Code Splitting

```tsx
// Lazy load heavy components
const AIMonitor = lazy(() => import("./ai-monitor/page"));

<Suspense fallback={<PageLoader />}>
  <AIMonitor />
</Suspense>
```

### Memoization

```tsx
// Memoize expensive calculations
const stats = useMemo(() => {
  const leaks = readings.filter(r => r.leak);
  return {
    leakRate: (leaks.length / readings.length) * 100,
    avgPressure: avg(readings.map(r => r.pressure_bar)),
  };
}, [readings]);
```

### Debouncing

```tsx
// Debounce search input
const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  // Fetch results with debouncedSearch
}, [debouncedSearch]);
```

---

## 📦 Component Library

### Buttons

```tsx
// Primary button
<button className="btn-primary">
  Save Changes
</button>

// Secondary button
<button className="btn-secondary">
  Cancel
</button>

// Icon button
<button className="btn-icon">
  <Settings className="w-5 h-5" />
</button>
```

### Inputs

```tsx
// Text input
<input
  type="text"
  className="input"
  placeholder="Enter pipe ID"
/>

// Select
<select className="select">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### Cards

```tsx
// Basic card
<div className="card">
  <h3 className="card-title">Title</h3>
  <p className="card-description">Description</p>
</div>

// Card with border accent
<div className="card border-l-4 border-l-indigo-500">
  {/* Content */}
</div>
```

---

## 🎯 User Flows

### 1. First-Time User

1. **Landing page** → Learn about platform
2. **Sign up** → Create account (Clerk)
3. **Dashboard** → See empty state
4. **Hardware setup** → Follow wizard
5. **Deploy sensor** → Start receiving data
6. **Dashboard** → View live readings

### 2. Returning User

1. **Sign in** → Authenticate (Clerk)
2. **Dashboard** → View latest readings
3. **Alerts** → Check active alerts
4. **AI Monitor** → Inspect ML predictions
5. **Analytics** → Review historical trends

### 3. Alert Response

1. **Push notification** → Receive alert
2. **Dashboard** → See alert banner
3. **Alerts page** → View details
4. **Acknowledge** → Mark as seen
5. **Investigate** → Check pipe on-site
6. **Resolve** → Mark as fixed

---

## 📝 Best Practices

### Component Structure

```tsx
// 1. Imports
import { useState } from "react";
import { Icon } from "lucide-react";

// 2. Types
interface Props {
  title: string;
}

// 3. Component
export default function Component({ title }: Props) {
  // 4. State
  const [count, setCount] = useState(0);

  // 5. Effects
  useEffect(() => {
    // ...
  }, []);

  // 6. Handlers
  const handleClick = () => {
    setCount(count + 1);
  };

  // 7. Render
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>{count}</button>
    </div>
  );
}
```

### Styling Conventions

```tsx
// Use Tailwind utility classes
<div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white">

// Use cn() for conditional classes
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "disabled-classes"
)}>

// Use inline styles for dynamic values
<div style={{ color: dynamicColor, width: `${percentage}%` }}>
```

---

## 🔮 Future Enhancements

### v1.1
- [ ] **Mobile app** — React Native version
- [ ] **Drag-and-drop dashboard** — Customizable widget layout
- [ ] **Advanced filters** — Multi-select, date ranges
- [ ] **Export data** — CSV, PDF reports

### v1.2
- [ ] **3D pipe visualization** — Three.js interactive model
- [ ] **Voice commands** — "Show me active alerts"
- [ ] **AR overlay** — View sensor data via phone camera
- [ ] **Collaborative features** — Comments, annotations

---

## 📚 Resources

- **Tailwind CSS:** https://tailwindcss.com/docs
- **Recharts:** https://recharts.org/en-US/
- **Lucide Icons:** https://lucide.dev/
- **Next.js:** https://nextjs.org/docs
- **Clerk:** https://clerk.com/docs

---

**Last updated:** May 12, 2026  
**UI Version:** 2.0.0  
**Design System:** Tailwind CSS 3.4+
