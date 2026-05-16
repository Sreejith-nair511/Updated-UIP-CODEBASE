import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary — Indigo
        brand: {
          50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe",
          300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1",
          600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81",
        },
        // Accent — Cyan
        accent: {
          50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc",
          300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4",
          600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63",
        },
        // Warning — Orange
        warning: {
          50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa",
          300: "#fdba74", 400: "#fb923c", 500: "#f97316",
          600: "#ea580c", 700: "#c2410c",
        },
        // Critical — Red
        danger: {
          50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca",
          300: "#fca5a5", 400: "#f87171", 500: "#ef4444",
          600: "#dc2626", 700: "#b91c1c",
        },
        // Success — Emerald
        success: {
          50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0",
          300: "#6ee7b7", 400: "#34d399", 500: "#10b981",
          600: "#059669", 700: "#047857",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "glow": "glow 2s ease-in-out infinite alternate",
        "flow": "flow 2s linear infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(10px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        slideInRight: { "0%": { transform: "translateX(20px)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        glow: { "0%": { boxShadow: "0 0 5px rgba(99,102,241,0.3)" }, "100%": { boxShadow: "0 0 20px rgba(99,102,241,0.8), 0 0 40px rgba(99,102,241,0.4)" } },
        flow: { "0%": { strokeDashoffset: "100" }, "100%": { strokeDashoffset: "0" } },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "grid-pattern": "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid": "20px 20px",
      },
    },
  },
  plugins: [],
};

export default config;
