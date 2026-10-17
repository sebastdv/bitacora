import type { IncomingMessage, ServerResponse } from "node:http";
import type { ActivityResponse, Commit, PendingResponse, RepoInfo } from "../src/shared/types.ts";
import { displayPath } from "./config.ts";
import { configuredEmail, countDirty, readCommits } from "./git.ts";
import { findRepos, type FoundRepo } from "./repos.ts";

const MAX_RANGE_DAYS = 400;
const REPO_CACHE_MS = 30_000;
const CONCURRENCY = 8;

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Solo responde a peticiones dirigidas a localhost. Evita que una página
 * externa lea tu historial con DNS rebinding apuntando a este puerto.
 */
export function isLocalHost(host: string | undefined): boolean {
  if (!host) return false;
  const name = host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0];
  return name === "localhost" || name === "127.0.0.1" || name === "[::1]" || name.endsWith(".localhost");
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

export function parseRange(params: URLSearchParams): { from: Date; to: Date } | string {
  const from = new Date(params.get("from") ?? "");
  const to = new Date(params.get("to") ?? "");
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "Faltan las fechas from y to en formato ISO.";
  if (to <= from) return "La fecha final debe ser posterior a la inicial.";
  if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * 86_400_000) return `El rango no puede pasar de ${MAX_RANGE_DAYS} días.`;
  return { from, to };
}

export function createApi(config: { roots: string[] }) {
  let cache: { at: number; repos: Promise<FoundRepo[]> } | null = null;

  function repos(): Promise<FoundRepo[]> {
    if (!cache || Date.now() - cache.at > REPO_CACHE_MS) {
      cache = { at: Date.now(), repos: findRepos(config.roots) };
    }
    return cache.repos;
  }

  async function activity(from: Date, to: Date): Promise<ActivityResponse> {
    const found = await repos();
    const me = new Set<string>();
    const globalEmail = await configuredEmail();
    if (globalEmail) me.add(globalEmail);

    const results = await mapLimit(found, CONCURRENCY, async (repo) => {
      const info: RepoInfo = { name: repo.name };
      let commits: Commit[] = [];
      try {
        commits = await readCommits(repo, from, to);
        const local = await configuredEmail(repo.path);
        if (local) me.add(local);
      } catch (err) {
        info.error = err instanceof Error ? err.message.split("\n")[0] : String(err);
      }
      return { info, commits };
    });

    return {
      roots: config.roots.map(displayPath),
      me: [...me],
      repos: results.map((r) => r.info),
      commits: results.flatMap((r) => r.commits).sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
    };
  }

  // git status es lo más lento (cientos de ms en repos grandes) y no depende
  // del rango, así que va en su propia ruta y la interfaz lo pide aparte.
  async function pending(): Promise<PendingResponse> {
    const found = await repos();
    const counts = await mapLimit(found, CONCURRENCY, (repo) => countDirty(repo.path).catch(() => 0));
    return { repos: found.map((r, i) => ({ name: r.name, dirty: counts[i] })).filter((r) => r.dirty > 0) };
  }

  /** Devuelve false si la ruta no es de la API, para que otro la atienda. */
  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (!url.pathname.startsWith("/api/")) return false;
    if (!isLocalHost(req.headers.host)) {
      send(res, 403, { error: "bitácora solo responde en localhost." });
      return true;
    }
    if (req.method !== "GET") {
      send(res, 405, { error: "Método no permitido." });
      return true;
    }
    if (url.searchParams.has("refresh")) cache = null;
    if (url.pathname === "/api/pending") {
      send(res, 200, await pending());
      return true;
    }
    if (url.pathname !== "/api/activity") {
      send(res, 404, { error: "Ruta no encontrada." });
      return true;
    }
    const range = parseRange(url.searchParams);
    if (typeof range === "string") {
      send(res, 400, { error: range });
      return true;
    }
    try {
      send(res, 200, await activity(range.from, range.to));
    } catch (err) {
      send(res, 500, { error: err instanceof Error ? err.message : "Error leyendo los repositorios." });
    }
    return true;
  };
}
