import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Commit } from "../src/shared/types.ts";

const run = promisify(execFile);

const RECORD = "\x1e";
const FIELD = "\x1f";
const FORMAT = `${RECORD}%H${FIELD}%ae${FIELD}%an${FIELD}%aI${FIELD}%S${FIELD}%s`;

async function git(repo: string, args: string[]): Promise<string> {
  const { stdout } = await run("git", ["-C", repo, ...args], {
    maxBuffer: 64 * 1024 * 1024,
    // Solo lectura: que git no tome el lock del índice mientras trabajas.
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0", LC_ALL: "C" },
  });
  return stdout;
}

function branchName(source: string): string | null {
  const ref = source.trim();
  if (!ref) return null;
  return ref.replace(/^refs\/(heads|remotes|tags)\//, "");
}

/** Convierte la salida de `git log --format=FORMAT --numstat` en commits. */
export function parseLog(output: string, repo: string): Commit[] {
  const commits: Commit[] = [];
  for (const chunk of output.split(RECORD)) {
    if (!chunk.trim()) continue;
    const [header, ...rest] = chunk.split("\n");
    const [hash, email, author, date, source, subject = ""] = header.split(FIELD);
    if (!hash || !date) continue;
    let added = 0;
    let deleted = 0;
    let files = 0;
    for (const line of rest) {
      const m = /^(\d+|-)\t(\d+|-)\t/.exec(line);
      if (!m) continue;
      files++;
      if (m[1] !== "-") added += Number(m[1]);
      if (m[2] !== "-") deleted += Number(m[2]);
    }
    commits.push({
      repo, hash, email: email.toLowerCase(), author, date,
      branch: branchName(source), subject, added, deleted, files,
    });
  }
  return commits;
}

/**
 * Commits con fecha de autor dentro de [from, to). `--since` filtra por fecha
 * del committer, que nunca es anterior a la de autor, así que sirve de poda
 * y el rango exacto se aplica aquí. No incluye el stash.
 */
export async function readCommits(repo: { name: string; path: string }, from: Date, to: Date): Promise<Commit[]> {
  const out = await git(repo.path, [
    "log", "--branches", "--remotes", "--tags", "--source", "--no-merges", "--no-renames",
    `--since=${from.toISOString()}`, `--format=${FORMAT}`, "--numstat",
  ]);
  const seen = new Set<string>();
  return parseLog(out, repo.name).filter((c) => {
    const t = Date.parse(c.date);
    if (t < from.getTime() || t >= to.getTime() || seen.has(c.hash)) return false;
    seen.add(c.hash);
    return true;
  });
}

export async function countDirty(repoPath: string): Promise<number> {
  const out = await git(repoPath, ["status", "--porcelain=v1"]);
  return out.split("\n").filter(Boolean).length;
}

export async function configuredEmail(repoPath?: string): Promise<string | null> {
  try {
    const args = repoPath ? ["config", "user.email"] : ["config", "--global", "user.email"];
    const out = repoPath ? await git(repoPath, args) : (await run("git", args)).stdout;
    return out.trim().toLowerCase() || null;
  } catch {
    return null; // git config sale con código 1 cuando la clave no existe
  }
}
