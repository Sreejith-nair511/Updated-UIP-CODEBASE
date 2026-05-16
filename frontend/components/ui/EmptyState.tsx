import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("card p-16 flex flex-col items-center justify-center text-center", className)}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgb(var(--bg-tertiary))" }}>
        <Icon className="w-7 h-7" style={{ color: "rgb(var(--text-muted))" }} />
      </div>
      <p className="text-base font-semibold" style={{ color: "rgb(var(--text-primary))" }}>{title}</p>
      {description && (
        <p className="text-sm mt-1 max-w-xs" style={{ color: "rgb(var(--text-muted))" }}>{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
