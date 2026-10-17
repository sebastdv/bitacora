import { assignColors } from "./group.ts";

export type ColorOf = (repo: string) => string;

export function colorScale(repos: string[]): ColorOf {
  const map = assignColors(repos);
  return (repo) => `var(--p${map.get(repo) ?? 0})`;
}
