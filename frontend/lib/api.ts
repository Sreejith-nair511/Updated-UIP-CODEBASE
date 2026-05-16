/**
 * Centralised API endpoint config.
 * All service URLs come from env vars — never hardcoded.
 * Frontend should route ML calls through backend for better security and monitoring.
 */

export const ML_SERVICE_URL =
  process.env.NEXT_PUBLIC_ML_SERVICE_URL ?? "http://localhost:8000";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

// ── Backend service helpers (preferred) ───────────────────────────────────────

export async function backendFetch<T>(
  path: string,
  init?: RequestInit,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
    signal: init?.signal ?? AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`Backend ${path} → ${res.status}: ${errorText}`);
  }
  return res.json() as Promise<T>;
}

// ── ML service helpers (direct access - use sparingly) ────────────────────────

export async function mlFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${ML_SERVICE_URL}${path}`, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`ML service ${path} → ${res.status}: ${errorText}`);
  }
  return res.json() as Promise<T>;
}

// ── Health check helpers ──────────────────────────────────────────────────────

export async function checkBackendHealth(): Promise<{
  status: string;
  checks: Record<string, "ok" | "error">;
}> {
  return backendFetch("/health");
}

export async function checkMLHealth(): Promise<{
  status: string;
  ml_service?: any;
}> {
  return backendFetch("/health/ml");
}
