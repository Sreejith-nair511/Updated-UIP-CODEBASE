"use client";

/** Shared tooltip wrapper for all Recharts charts — dark mode aware */
export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (entry: any) => React.ReactNode;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg shadow-lg border text-xs p-3 min-w-[120px]"
      style={{
        backgroundColor: "rgb(var(--card-bg))",
        borderColor: "rgb(var(--border))",
        color: "rgb(var(--text-primary))",
      }}
    >
      {label && (
        <p className="font-medium mb-1.5" style={{ color: "rgb(var(--text-secondary))" }}>
          {label}
        </p>
      )}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-0.5 last:mb-0">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color ?? entry.fill }}
          />
          {formatter ? (
            formatter(entry)
          ) : (
            <>
              <span style={{ color: "rgb(var(--text-muted))" }}>{entry.name}:</span>
              <span className="font-semibold ml-auto pl-2">{entry.value}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
