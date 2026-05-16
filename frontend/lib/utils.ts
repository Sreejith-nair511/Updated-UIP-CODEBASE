import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, timeStr?: string): string {
  const date = new Date(timeStr ? `${dateStr}T${timeStr}` : dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string, timeStr: string): string {
  const date = new Date(`${dateStr}T${timeStr}`);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function getSeverityLevel(severity: number): "none" | "minor" | "major" | "critical" {
  if (severity === 0) return "none";
  if (severity < 30) return "minor";
  if (severity < 70) return "major";
  return "critical";
}

export function getSeverityColor(severity: number): string {
  const level = getSeverityLevel(severity);
  switch (level) {
    case "none":
      return "text-success-600 bg-success-50";
    case "minor":
      return "text-warning-600 bg-warning-50";
    case "major":
      return "text-orange-600 bg-orange-50";
    case "critical":
      return "text-danger-600 bg-danger-50";
  }
}

export function getSeverityBadgeColor(severity: number): string {
  const level = getSeverityLevel(severity);
  switch (level) {
    case "none":
      return "bg-success-100 text-success-700 border-success-200";
    case "minor":
      return "bg-warning-100 text-warning-700 border-warning-200";
    case "major":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "critical":
      return "bg-danger-100 text-danger-700 border-danger-200";
  }
}

export function getAnomalyColor(score: number): string {
  if (score < 0.3) return "#22c55e";
  if (score < 0.6) return "#f59e0b";
  if (score < 0.85) return "#f97316";
  return "#ef4444";
}

export function getLeakClassLabel(leakClass: string): string {
  switch (leakClass) {
    case "no_leak":
      return "No Leak";
    case "minor_leak":
      return "Minor Leak";
    case "major_leak":
      return "Major Leak";
    default:
      return leakClass;
  }
}

export function classifyLeak(severity: number): "no_leak" | "minor_leak" | "major_leak" {
  if (severity === 0) return "no_leak";
  if (severity < 50) return "minor_leak";
  return "major_leak";
}

export function formatFrequency(hz: number): string {
  return `${hz.toFixed(1)} Hz`;
}

export function formatPressure(bar: number): string {
  return `${bar.toFixed(1)} bar`;
}

export function formatFlow(lpm: number): string {
  return `${lpm.toFixed(0)} L/min`;
}
