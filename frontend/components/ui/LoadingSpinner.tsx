import { cn } from "@/lib/utils";
import { Droplets } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizes = { sm: "w-4 h-4 border-2", md: "w-6 h-6 border-2", lg: "w-8 h-8 border-[3px]" };
  return (
    <div className={cn(
      "rounded-full border-indigo-100 dark:border-indigo-900 border-t-indigo-600 animate-spin",
      sizes[size], className
    )} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Droplets className="w-7 h-7 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 border-t-indigo-600 animate-spin"
            style={{ borderTopColor: "#6366f1" }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: "rgb(var(--text-primary))" }}>Loading</p>
          <p className="text-xs mt-0.5" style={{ color: "rgb(var(--text-muted))" }}>Fetching live data…</p>
        </div>
      </div>
    </div>
  );
}
