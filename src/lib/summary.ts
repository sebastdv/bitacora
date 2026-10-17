import type { Commit } from "../shared/types.ts";
import { cleanSubject } from "./conventional.ts";
import { groupByDay, groupByRepo } from "./group.ts";
import { dayName } from "./range.ts";

export interface SummaryOptions {
  title: string;
  groupBy: "proyecto" | "dia";
  /** Quita los prefijos tipo "feat(api):" para que lo lea alguien que no programa. */
  clean: boolean;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Una viñeta por mensaje; los repetidos se juntan con "(×n)". */
function bullets(lines: string[]): string[] {
  const counts = new Map<string, number>();
  for (const l of lines) counts.set(l, (counts.get(l) ?? 0) + 1);
  return [...counts].map(([l, n]) => `- ${l}${n > 1 ? ` (×${n})` : ""}`);
}

/** Texto en Markdown listo para pegar en Slack, Teams, un correo o un issue. */
export function buildSummary(commits: Commit[], opts: SummaryOptions): string {
  const text = (c: Commit) => (opts.clean ? cleanSubject(c.subject) : c.subject);
  const out = [`**${opts.title}**`];

  if (commits.length === 0) {
    out.push("", "Sin commits en este rango.");
    return out.join("\n");
  }

  if (opts.groupBy === "proyecto") {
    for (const g of groupByRepo(commits)) {
      out.push("", `**${g.repo}**`, ...bullets(g.commits.map(text)));
    }
  } else {
    for (const d of groupByDay(commits)) {
      const lines = d.repos.flatMap((r) => r.commits.map((c) => `${r.repo}: ${text(c)}`));
      out.push("", `**${cap(dayName(d.day))}**`, ...bullets(lines));
    }
  }
  return out.join("\n");
}
