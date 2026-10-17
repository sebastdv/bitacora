import type { Commit } from "../shared/types.ts";
import { usePersistentState } from "../lib/storage.ts";
import { buildSummary } from "../lib/summary.ts";
import { CopyButton, Segmented, Toggle } from "./controls.tsx";

export function SummaryPanel({ commits, title }: { commits: Commit[]; title: string }) {
  const [groupBy, setGroupBy] = usePersistentState<"proyecto" | "dia">("bitacora:agrupar", "proyecto");
  const [clean, setClean] = usePersistentState("bitacora:limpiar", true);
  const text = buildSummary(commits, { title, groupBy, clean });

  return (
    <section aria-labelledby="resumen" className="rounded-lg border border-line bg-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="resumen" className="text-lg font-bold">
          Resumen para pegar
        </h2>
        <CopyButton text={text} label="Copiar" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Segmented
          label="Agrupar el resumen"
          value={groupBy}
          onChange={setGroupBy}
          options={[
            { value: "proyecto", label: "Por proyecto" },
            { value: "dia", label: "Por día" },
          ]}
        />
        <Toggle label="Quitar prefijos feat:, fix:…" checked={clean} onChange={setClean} />
      </div>
      <pre
        tabIndex={0}
        aria-label="Resumen en Markdown"
        className="mono mt-3 max-h-[26rem] overflow-auto whitespace-pre-wrap rounded-md border border-line bg-bg p-3 leading-relaxed"
      >
        {text}
      </pre>
      <p className="mt-2 text-xs text-muted">En Markdown: se ve bien en Slack, Teams, GitHub y la mayoría de correos.</p>
    </section>
  );
}
