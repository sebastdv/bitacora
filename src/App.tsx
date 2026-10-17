import { useEffect, useMemo, useState } from "react";
import type { ActivityResponse, Commit, PendingResponse } from "./shared/types.ts";
import { loadActivity, loadPending, type Source } from "./lib/api.ts";
import { colorScale } from "./lib/colors.ts";
import { stats } from "./lib/group.ts";
import { dayKey, daysOf, rangeDetail, rangeFor, rangeTitle, shift, type Unit } from "./lib/range.ts";
import { usePersistentState } from "./lib/storage.ts";
import { Button, Segmented } from "./components/controls.tsx";
import { DayList } from "./components/DayList.tsx";
import { Filters } from "./components/Filters.tsx";
import { SummaryPanel } from "./components/SummaryPanel.tsx";
import { Timeline } from "./components/Timeline.tsx";

const num = new Intl.NumberFormat("es-CO");
const REPO_URL = "https://github.com/sebastdv/bitacora";

type State =
  | { status: "loading"; previous?: { data: ActivityResponse; source: Source } }
  | { status: "ready"; data: ActivityResponse; source: Source }
  | { status: "error"; message: string };

function countBy<T>(items: T[], key: (item: T) => string): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const i of items) map.set(key(i), (map.get(key(i)) ?? 0) + 1);
  return [...map].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="text-2xl font-bold tabular-nums">{value}</dd>
      <dd aria-hidden className="text-sm text-muted">
        {label}
      </dd>
    </div>
  );
}

export function App() {
  const [unit, setUnit] = usePersistentState<Unit>("bitacora:unidad", "semana");
  const [anchor, setAnchor] = useState(() => dayKey(new Date()));
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<State>({ status: "loading" });
  const [hidden, setHidden] = usePersistentState<string[]>("bitacora:ocultos", []);
  const [authorChoice, setAuthorChoice] = usePersistentState<string[] | null>("bitacora:autores", null);
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingResponse>({ repos: [] });

  const isCurrent = rangeFor(unit, anchor).from.getTime() === rangeFor(unit, dayKey(new Date())).from.getTime();

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ status: "loading", previous: s.status === "ready" ? s : s.status === "loading" ? s.previous : undefined }));
    const { from, to } = rangeFor(unit, anchor);
    loadActivity(from, to, reload > 0).then(
      (r) => !cancelled && setState({ status: "ready", ...r }),
      (e: Error) => !cancelled && setState({ status: "error", message: e.message }),
    );
    return () => {
      cancelled = true;
    };
  }, [unit, anchor, reload]);

  useEffect(() => {
    let cancelled = false;
    loadPending(reload > 0).then(
      (p) => !cancelled && setPending(p),
      () => {}, // es informativo: si falla, simplemente no se muestra
    );
    return () => {
      cancelled = true;
    };
  }, [reload]);

  // Flechas del teclado para moverse entre rangos, cuando no estás en un control.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target !== document.body || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") setAnchor((a) => shift(unit, a, -1));
      if (e.key === "ArrowRight") setAnchor((a) => shift(unit, a, 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [unit]);

  const busy = state.status === "loading";
  const shown = state.status === "ready" ? state : state.status === "loading" ? state.previous : undefined;
  const data = shown?.data;

  const allCommits = data?.commits ?? [];
  const authors = useMemo(() => countBy(allCommits, (c) => c.email), [allCommits]);
  const selectedAuthors = useMemo(() => {
    if (authorChoice) return authorChoice;
    const mine = authors.map((a) => a.key).filter((e) => data?.me.includes(e));
    return mine.length ? mine : authors.map((a) => a.key);
  }, [authorChoice, authors, data]);

  const byAuthor = allCommits.filter((c) => selectedAuthors.includes(c.email));
  const repos = countBy(byAuthor, (c) => c.repo);
  const repoNames = repos.map((r) => r.key).join("\n");
  const colorOf = useMemo(() => colorScale(repoNames.split("\n")), [repoNames]);
  const commits: Commit[] = byAuthor.filter((c) => !hidden.includes(c.repo));
  const others = allCommits.length - byAuthor.length;
  const s = stats(commits);
  const title = rangeTitle(unit, anchor);
  const detail = rangeDetail(unit, anchor);
  const dirty = pending.repos;
  const failed = (data?.repos ?? []).filter((r) => r.error);

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  function select(hash: string) {
    setSelected(null);
    requestAnimationFrame(() => {
      setSelected(hash);
      document.getElementById(`c-${hash}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
        <p className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <img src="/icon.svg" alt="" className="size-6" />
          bitácora
        </p>
        <div className="flex items-center gap-3 text-sm text-muted">
          {data && shown?.source === "local" && (
            <span>
              {data.roots.join(", ")} · {data.repos.length} {data.repos.length === 1 ? "repositorio" : "repositorios"}
            </span>
          )}
          <Button onClick={() => setReload((n) => n + 1)} disabled={state.status === "loading"}>
            {state.status === "loading" ? "Leyendo…" : "Actualizar"}
          </Button>
        </div>
      </header>

      {shown?.source === "demo" && (
        <p className="mt-4 rounded-md border border-line bg-accent-soft px-4 py-3 text-sm">
          Estás viendo datos de ejemplo. bitácora lee tus repositorios desde tu equipo, así que esta página publicada no tiene acceso a
          ellos. Para ver los tuyos,{" "}
          <a href={REPO_URL} className="font-medium text-accent underline underline-offset-2">
            clónala y corre npm start
          </a>
          .
        </p>
      )}

      <section aria-labelledby="titulo" className="pt-8">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Unidad de tiempo"
            value={unit}
            onChange={setUnit}
            options={[
              { value: "dia", label: "Día" },
              { value: "semana", label: "Semana" },
              { value: "mes", label: "Mes" },
            ]}
          />
          <Button label="Anterior" onClick={() => setAnchor(shift(unit, anchor, -1))}>
            ‹
          </Button>
          <Button label="Siguiente" onClick={() => setAnchor(shift(unit, anchor, 1))}>
            ›
          </Button>
          {!isCurrent && <Button onClick={() => setAnchor(dayKey(new Date()))}>Volver a hoy</Button>}
        </div>

        <h1 id="titulo" className="mt-6 text-5xl font-extrabold leading-none tracking-[-0.035em] sm:text-7xl">
          {title}
        </h1>
        <p className="mt-3 text-lg text-muted">{detail}</p>

        <dl className={`mt-6 flex flex-wrap gap-x-10 gap-y-4 transition-opacity ${busy ? "opacity-40" : ""}`}>
          <Stat value={num.format(s.commits)} label={s.commits === 1 ? "commit" : "commits"} />
          <Stat value={num.format(s.repos)} label={s.repos === 1 ? "proyecto" : "proyectos"} />
          <Stat value={num.format(s.days)} label={s.days === 1 ? "día con commits" : "días con commits"} />
          <Stat
            value={
              <>
                <span className="text-added">+{num.format(s.added)}</span> <span className="text-deleted">−{num.format(s.deleted)}</span>
              </>
            }
            label="líneas"
          />
        </dl>
      </section>

      {state.status === "error" && (
        <p role="alert" className="mt-8 rounded-md border border-deleted px-4 py-3 text-deleted">
          No se pudo leer la actividad: {state.message}
        </p>
      )}

      {data && (
        <div aria-busy={busy} className={`transition-opacity ${busy ? "opacity-40" : ""}`}>
          <div className="mt-8 space-y-4">
            <Timeline days={daysOf(unit, anchor)} commits={commits} onSelect={select} colorOf={colorOf} />
            <Filters
              repos={repos.map((r) => ({ name: r.key, count: r.count }))}
              hidden={hidden}
              onToggleRepo={(name) => setHidden(toggle(hidden, name))}
              authors={authors.map((a) => ({ email: a.key, count: a.count }))}
              selectedAuthors={selectedAuthors}
              onToggleAuthor={(email) => setAuthorChoice(toggle(selectedAuthors, email))}
              colorOf={colorOf}
            />
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_24rem]">
            <div>
              {commits.length > 0 ? (
                <DayList commits={commits} selected={selected} colorOf={colorOf} />
              ) : (
                <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
                  <p className="text-lg font-semibold">Sin commits tuyos en este rango.</p>
                  <p className="mt-1 text-muted">
                    {others > 0
                      ? `Hay ${others} de otros autores: actívalos en Autores si quieres verlos.`
                      : "Prueba con el rango anterior o revisa qué carpetas está leyendo bitácora."}
                  </p>
                  <div className="mt-4">
                    <Button onClick={() => setAnchor(shift(unit, anchor, -1))}>Ver el rango anterior</Button>
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
              <SummaryPanel commits={commits} title={`${title} (${detail.charAt(0).toLowerCase()}${detail.slice(1)})`} />
              {dirty.length > 0 && (
                <section aria-labelledby="sucios" className="rounded-lg border border-line p-4">
                  <h2 id="sucios" className="font-bold">
                    Sin commitear
                  </h2>
                  <ul className="mt-2 space-y-1 text-sm">
                    {dirty.map((r) => (
                      <li key={r.name} className="flex justify-between gap-3">
                        <span>{r.name}</span>
                        <span className="mono text-muted">
                          {r.dirty} {r.dirty === 1 ? "archivo" : "archivos"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {failed.length > 0 && (
                <section aria-labelledby="fallidos" className="rounded-lg border border-deleted/50 p-4 text-sm">
                  <h2 id="fallidos" className="font-bold text-deleted">
                    No se pudieron leer
                  </h2>
                  <ul className="mt-2 space-y-1">
                    {failed.map((r) => (
                      <li key={r.name}>
                        <span className="font-medium">{r.name}</span>: <span className="text-muted">{r.error}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          </div>
        </div>
      )}

      <footer className="mt-16 border-t border-line pt-4 text-sm text-muted">
        bitácora corre en tu equipo: lee tus repositorios con git y no envía nada a internet. Hecha por{" "}
        <a href="https://sebastdv.vercel.app" className="underline underline-offset-2 hover:text-ink">
          Sebastián Ardila
        </a>{" "}
        ·{" "}
        <a href={REPO_URL} className="underline underline-offset-2 hover:text-ink">
          código en GitHub
        </a>
      </footer>
    </div>
  );
}
