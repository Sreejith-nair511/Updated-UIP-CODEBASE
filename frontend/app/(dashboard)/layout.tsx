"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  LayoutDashboard, AlertTriangle, GitBranch, BarChart3,
  Settings, Menu, X, Droplets, Bell, Brain, Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealTimeAlerts } from "@/hooks/useRealTimeAlerts";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV = [
  { href: "/dashboard",      label: "Dashboard",    icon: LayoutDashboard, section: "main" },
  { href: "/ai-monitor",     label: "AI Monitor",   icon: Brain,           section: "main" },
  { href: "/alerts",         label: "Alerts",       icon: AlertTriangle,   section: "main", badge: true },
  { href: "/pipes",          label: "Pipe Monitor", icon: GitBranch,       section: "monitor" },
  { href: "/analytics",      label: "Analytics",    icon: BarChart3,       section: "monitor" },
  { href: "/hardware-setup", label: "Hardware",     icon: Cpu,             section: "config" },
  { href: "/settings",       label: "Settings",     icon: Settings,        section: "config" },
];

const SECTIONS: Record<string, string> = {
  main:    "Core",
  monitor: "Monitor",
  config:  "Configure",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const { activeCount } = useRealTimeAlerts(true);

  const grouped = Object.entries(SECTIONS).map(([key, label]) => ({
    key, label, items: NAV.filter(n => n.section === key),
  }));

  const currentPage = NAV.find(n =>
    pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href))
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "rgb(var(--bg-secondary))" }}>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-60 flex flex-col border-r transition-transform duration-300 ease-out",
        "lg:translate-x-0 lg:static lg:z-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )} style={{ backgroundColor: "rgb(var(--sidebar-bg))", borderColor: "rgb(var(--border))" }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-14 border-b flex-shrink-0"
          style={{ borderColor: "rgb(var(--border-subtle))" }}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold tracking-tight truncate" style={{ color: "rgb(var(--text-primary))" }}>
              Stethoscope
            </p>
            <p className="text-[10px] font-medium" style={{ color: "rgb(var(--text-muted))" }}>
              Leak Detection AI
            </p>
          </div>
          <button className="lg:hidden p-1 rounded-md transition-colors hover:bg-[rgb(var(--bg-tertiary))]"
            onClick={() => setOpen(false)}>
            <X className="w-4 h-4" style={{ color: "rgb(var(--text-muted))" }} />
          </button>
        </div>

        {/* Status */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ backgroundColor: "rgb(var(--bg-tertiary))" }}>
            <span className="live-dot" />
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">System Online</span>
            {activeCount > 0 && (
              <span className="ml-auto text-xs font-bold text-red-500">
                {activeCount} alert{activeCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-thin space-y-4">
          {grouped.map(({ key, label, items }) => (
            <div key={key}>
              <p className="section-title px-3 mb-1.5">{label}</p>
              <div className="space-y-0.5">
                {items.map(item => {
                  const active = pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-100",
                        active
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                          : "hover:bg-[rgb(var(--bg-tertiary))]"
                      )}
                      style={!active ? { color: "rgb(var(--text-secondary))" } : undefined}>
                      <item.icon size={16} className={cn(
                        "flex-shrink-0",
                        active ? "text-indigo-600 dark:text-indigo-400" : "opacity-60"
                      )} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {(item as any).badge && activeCount > 0 && (
                        <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {activeCount > 9 ? "9+" : activeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t space-y-3 flex-shrink-0"
          style={{ borderColor: "rgb(var(--border-subtle))" }}>
          <ThemeToggle variant="segmented" className="w-full" />
          <div className="flex items-center gap-2.5 px-1">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{ elements: { avatarBox: "w-7 h-7" } }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: "rgb(var(--text-primary))" }}>
                {user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress ?? "Guest"}
              </p>
              <p className="text-[10px] truncate" style={{ color: "rgb(var(--text-muted))" }}>
                {user?.emailAddresses?.[0]?.emailAddress ?? "Not signed in"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="sticky top-0 z-30 h-14 px-4 flex items-center gap-3 border-b backdrop-blur-md"
          style={{ backgroundColor: "rgb(var(--header-bg))", borderColor: "rgb(var(--border))" }}>
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
            onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" style={{ color: "rgb(var(--text-muted))" }} />
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Droplets className="w-4 h-4 text-indigo-500 flex-shrink-0 hidden sm:block" />
            <span className="text-xs hidden sm:block" style={{ color: "rgb(var(--text-muted))" }}>Stethoscope</span>
            <span className="text-xs hidden sm:block" style={{ color: "rgb(var(--text-muted))" }}>/</span>
            <span className="text-sm font-semibold truncate" style={{ color: "rgb(var(--text-primary))" }}>
              {currentPage?.label ?? "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle variant="icon" />
            <Link href="/alerts"
              className="relative p-2 rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
              style={{ color: "rgb(var(--text-muted))" }}>
              <Bell style={{ width: 18, height: 18 }} />
              {activeCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activeCount > 9 ? "9+" : activeCount}
                </span>
              )}
            </Link>
            <div className="hidden lg:block ml-1">
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{ elements: { avatarBox: "w-7 h-7" } }}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
