// Lectura de mensajes con formato Conventional Commits: tipo(alcance)!: texto

const TYPES = new Set(["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"]);
const RE = /^([a-zA-Z]+)(?:\(([^)]*)\))?(!)?:\s+(.+)$/;

export const TYPE_LABEL: Record<string, string> = {
  feat: "Función",
  fix: "Corrección",
  docs: "Docs",
  style: "Estilo",
  refactor: "Refactor",
  perf: "Rendimiento",
  test: "Tests",
  build: "Build",
  ci: "CI",
  chore: "Mantenimiento",
  revert: "Reversión",
};

export interface ParsedSubject {
  type: string | null;
  scope: string | null;
  breaking: boolean;
  text: string;
}

export function parseSubject(subject: string): ParsedSubject {
  const m = RE.exec(subject.trim());
  if (!m || !TYPES.has(m[1].toLowerCase())) {
    return { type: null, scope: null, breaking: false, text: subject.trim() };
  }
  return { type: m[1].toLowerCase(), scope: m[2] || null, breaking: Boolean(m[3]), text: m[4].trim() };
}

/** "feat(api): crear ruta" → "Crear ruta" */
export function cleanSubject(subject: string): string {
  const { text } = parseSubject(subject);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
