import type { ColorOf } from "../lib/colors.ts";

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick(): void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm ${
        pressed ? "border-line bg-panel" : "border-dashed border-line text-muted line-through decoration-muted/60"
      }`}
    >
      {children}
    </button>
  );
}

export function Filters({
  repos,
  hidden,
  onToggleRepo,
  authors,
  selectedAuthors,
  onToggleAuthor,
  colorOf,
}: {
  repos: { name: string; count: number }[];
  hidden: string[];
  onToggleRepo(name: string): void;
  authors: { email: string; count: number }[];
  selectedAuthors: string[];
  onToggleAuthor(email: string): void;
  colorOf: ColorOf;
}) {
  return (
    <div className="space-y-2">
      {repos.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Proyectos">
          <span className="mr-1 text-sm text-muted">Proyectos</span>
          {repos.map((r) => (
            <Chip key={r.name} pressed={!hidden.includes(r.name)} onClick={() => onToggleRepo(r.name)}>
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: colorOf(r.name) }} />
              {r.name}
              <span className="mono text-muted">{r.count}</span>
            </Chip>
          ))}
        </div>
      )}
      {authors.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Autores">
          <span className="mr-1 text-sm text-muted">Autores</span>
          {authors.map((a) => (
            <Chip key={a.email} pressed={selectedAuthors.includes(a.email)} onClick={() => onToggleAuthor(a.email)}>
              {a.email}
              <span className="mono text-muted">{a.count}</span>
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
