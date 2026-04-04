// Simple in-memory cache for C2 API responses.
// Module-level — persists for the browser session without external deps.
// Data is shown instantly on revisit; background refresh after TTL.

const CACHE: Record<string, { data: unknown; ts: number }> = {};
const TTL_MS = 60_000; // 60 seconds

export function getCached<T>(key: string): T | null {
  const entry = CACHE[key];
  if (entry && Date.now() - entry.ts < TTL_MS) return entry.data as T;
  return null;
}

export function setCached(key: string, data: unknown): void {
  CACHE[key] = { data, ts: Date.now() };
}

export function invalidate(key: string): void {
  delete CACHE[key];
}
