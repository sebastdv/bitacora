import os from "node:os";
import path from "node:path";

function expandHome(p: string): string {
  return p === "~" || p.startsWith("~/") ? path.join(os.homedir(), p.slice(1)) : p;
}

/**
 * Carpetas a recorrer, en orden de prioridad: argumentos, BITACORA_ROOTS
 * (separadas por ":") y, si no hay nada, la carpeta que contiene a bitácora.
 */
export function resolveRoots(args: string[], env: NodeJS.ProcessEnv, cwd = process.cwd()): string[] {
  const fromArgs = args.filter((a) => !a.startsWith("-"));
  const fromEnv = env.BITACORA_ROOTS?.split(path.delimiter).filter(Boolean) ?? [];
  const roots = fromArgs.length ? fromArgs : fromEnv.length ? fromEnv : [path.dirname(cwd)];
  return [...new Set(roots.map((r) => path.resolve(cwd, expandHome(r))))];
}

export function displayPath(p: string): string {
  const home = os.homedir();
  return p === home || p.startsWith(home + path.sep) ? "~" + p.slice(home.length) : p;
}
