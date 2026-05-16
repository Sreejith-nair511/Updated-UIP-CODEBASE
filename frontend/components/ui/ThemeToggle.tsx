"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = [
  { value: "light",  label: "Light",  icon: Sun     },
  { value: "dark",   label: "Dark",   icon: Moon    },
  { value: "system", label: "System", icon: Monitor },
] as const;

interface ThemeToggleProps {
  /** "icon" = single cycling button, "segmented" = 3-way pill */
  variant?: "icon" | "segmented";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render after mount
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;

  if (variant === "segmented") {
    return (
      <div
        className={cn(
          "flex items-center gap-0.5 p-1 rounded-lg border",
          "bg-[rgb(var(--bg-tertiary))] border-[rgb(var(--border))]",
          className
        )}
      >
        {themes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
              theme === value
                ? "bg-brand-600 text-white shadow-sm"
                : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-primary))]"
            )}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    );
  }

  // Icon variant — cycles light → dark → system
  const cycle = () => {
    if (theme === "light")  setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const Icon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <button
      onClick={cycle}
      title={`Theme: ${theme}`}
      className={cn(
        "p-2 rounded-lg transition-colors",
        "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]",
        "hover:bg-[rgb(var(--bg-tertiary))]",
        className
      )}
    >
      <Icon size={18} />
    </button>
  );
}
