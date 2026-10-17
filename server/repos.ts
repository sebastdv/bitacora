import { readdir } from "node:fs/promises";
import path from "node:path";

// Carpetas que nunca contienen repositorios propios y cuestan mucho recorrer.
const SKIP = new Set([
  "node_modules", "vendor", "dist", "build", "target", "coverage",
  "storage", "venv", "__pycache__",
]);

export interface FoundRepo {
  name: string;
  path: string;
}

/**
 * Busca repositorios git bajo cada raíz hasta `maxDepth` niveles. Reconoce
 * `.git` como carpeta o como archivo (worktrees y submódulos). No sigue
 * enlaces simbólicos ni entra a carpetas ocultas.
 */
export async function findRepos(roots: string[], maxDepth = 3): Promise<FoundRepo[]> {
  const found = new Map<string, FoundRepo>();

  async function walk(root: string, dir: string, depth: number): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    if (entries.some((e) => e.name === ".git")) {
      const rel = path.relative(root, dir);
      found.set(dir, { name: rel || path.basename(dir), path: dir });
    }
    if (depth >= maxDepth) return;
    const subdirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith(".") && !SKIP.has(e.name));
    await Promise.all(subdirs.map((e) => walk(root, path.join(dir, e.name), depth + 1)));
  }

  for (const root of roots) await walk(root, root, 0);
  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
}
