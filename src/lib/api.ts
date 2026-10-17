import type { ActivityResponse, PendingResponse } from "../shared/types.ts";
import { demoActivity, demoPending } from "./demo.ts";

export type Source = "local" | "demo";

/** GET a la API local; null si no hay servidor (sitio estático o sin red). */
async function getJson<T>(path: string, params: URLSearchParams): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${path}?${params}`);
  } catch {
    return null;
  }
  if (!res.headers.get("content-type")?.includes("application/json")) return null;
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `El servidor respondió ${res.status}.`);
  return body as T;
}

/**
 * Pide la actividad al servidor local. Si no hay servidor (la versión
 * publicada como sitio estático), usa datos de ejemplo.
 */
export async function loadActivity(from: Date, to: Date, refresh = false): Promise<{ data: ActivityResponse; source: Source }> {
  const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
  if (refresh) params.set("refresh", "1");
  const data = await getJson<ActivityResponse>("/api/activity", params);
  return data ? { data, source: "local" } : { data: demoActivity(from, to), source: "demo" };
}

export async function loadPending(refresh = false): Promise<PendingResponse> {
  const data = await getJson<PendingResponse>("/api/pending", new URLSearchParams(refresh ? { refresh: "1" } : {}));
  return data ?? demoPending;
}
