import type { Commit } from "../shared/types.ts";
import { dayKey } from "./range.ts";

export interface RepoGroup {
  repo: string;
  commits: Commit[];
}

export interface DayGroup {
  day: string;
  repos: RepoGroup[];
}

function byRepo(commits: Commit[]): RepoGroup[] {
  const map = new Map<string, Commit[]>();
  for (const c of commits) {
    const list = map.get(c.repo) ?? [];
    list.push(c);
    map.set(c.repo, list);
  }
  return [...map].map(([repo, list]) => ({ repo, commits: list }));
}

/** Días en orden y, dentro de cada día, proyectos en el orden de su primer commit. */
export function groupByDay(commits: Commit[]): DayGroup[] {
  const sorted = [...commits].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const days = new Map<string, Commit[]>();
  for (const c of sorted) {
    const key = dayKey(new Date(c.date));
    days.set(key, [...(days.get(key) ?? []), c]);
  }
  return [...days].map(([day, list]) => ({ day, repos: byRepo(list) }));
}

/** Proyectos de mayor a menor actividad; commits en orden cronológico. */
export function groupByRepo(commits: Commit[]): RepoGroup[] {
  const sorted = [...commits].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  return byRepo(sorted).sort((a, b) => b.commits.length - a.commits.length || a.repo.localeCompare(b.repo));
}

export function stats(commits: Commit[]) {
  return {
    commits: commits.length,
    repos: new Set(commits.map((c) => c.repo)).size,
    days: new Set(commits.map((c) => dayKey(new Date(c.date)))).size,
    added: commits.reduce((n, c) => n + c.added, 0),
    deleted: commits.reduce((n, c) => n + c.deleted, 0),
  };
}

export const PALETTE_SIZE = 8;

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Tono por proyecto: cada uno prefiere el de su hash (así casi siempre
 * conserva el color entre semanas) y, si está ocupado, toma el siguiente
 * libre. Hasta 8 proyectos nunca se repite un color.
 */
export function assignColors(repos: string[]): Map<string, number> {
  const result = new Map<string, number>();
  let used = new Set<number>();
  for (const repo of [...new Set(repos)].sort()) {
    if (used.size === PALETTE_SIZE) used = new Set();
    let i = hash(repo) % PALETTE_SIZE;
    while (used.has(i)) i = (i + 1) % PALETTE_SIZE;
    used.add(i);
    result.set(repo, i);
  }
  return result;
}
