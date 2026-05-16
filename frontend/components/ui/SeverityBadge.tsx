import { cn, getSeverityLevel } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: number;
  showValue?: boolean;
  className?: string;
}

const CONFIG = {
  none:     { label: "Normal",   bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
  minor:    { label: "Minor",    bg: "bg-amber-50 dark:bg-amber-950/40",     text: "text-amber-700 dark:text-amber-300",     border: "border-amber-200 dark:border-amber-800",   dot: "bg-amber-500"   },
  major:    { label: "Major",    bg: "bg-orange-50 dark:bg-orange-950/40",   text: "text-orange-700 dark:text-orange-300",   border: "border-orange-200 dark:border-orange-800", dot: "bg-orange-500"  },
  critical: { label: "Critical", bg: "bg-red-50 dark:bg-red-950/40",         text: "text-red-700 dark:text-red-300",         border: "border-red-200 dark:border-red-800",       dot: "bg-red-500"     },
};

export function SeverityBadge({ severity, showValue = true, className }: SeverityBadgeProps) {
  const level = getSeverityLevel(severity);
  const c = CONFIG[level];

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
      c.bg, c.text, c.border, className
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", c.dot)} />
      {c.label}
      {showValue && severity > 0 && <span className="opacity-70">· {severity}%</span>}
    </span>
  );
}
