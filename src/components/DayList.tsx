import type { Commit } from "../shared/types.ts";
import type { ColorOf } from "../lib/colors.ts";
import { TYPE_LABEL, parseSubject } from "../lib/conventional.ts";
import { groupByDay } from "../lib/group.ts";
import { dayName, timeOf } from "../lib/range.ts";

const num = new Intl.NumberFormat("es-CO");

function CommitRow({ commit, selected }: { commit: Commit; selected: boolean }) {
  const s = parseSubject(commit.subject);
  return (
    <li
      id={`c-${commit.hash}`}
      className={`grid scroll-mt-24 grid-cols-[3rem_1fr] gap-x-3 rounded px-2 py-1.5 sm:grid-cols-[3rem_1fr_auto] ${selected ? "highlight" : ""}`}
    >
      <span className="mono pt-0.5 text-muted">{timeOf(commit.date)}</span>
      <span className="min-w-0 text-[0.95rem] leading-snug">
        {s.type && (
          <span className="mr-2 inline-block rounded border border-line px-1.5 text-xs font-medium text-muted">
            {TYPE_LABEL[s.type]}
            {s.breaking && " · rompe compatibilidad"}
          </span>
        )}
        {s.scope && <span className="text-muted">{s.scope}: </span>}
        <span className="break-words">{s.text}</span>
      </span>
      <span className="mono col-start-2 pt-0.5 text-muted sm:col-start-3" title={`${commit.hash}${commit.branch ? ` · ${commit.branch}` : ""}`}>
        <span className="text-added">+{num.format(commit.added)}</span> <span className="text-deleted">−{num.format(commit.deleted)}</span>{" "}
        <span className="opacity-70">{commit.hash.slice(0, 7)}</span>
      </span>
    </li>
  );
}

export function DayList({ commits, selected, colorOf }: { commits: Commit[]; selected: string | null; colorOf: ColorOf }) {
  return (
    <div className="space-y-8">
      {groupByDay(commits).map((d) => {
        const count = d.repos.reduce((n, r) => n + r.commits.length, 0);
        return (
          <section key={d.day} aria-labelledby={`d-${d.day}`}>
            <h3 id={`d-${d.day}`} className="flex items-baseline justify-between border-b border-line pb-1.5 text-lg font-bold first-letter:uppercase">
              {dayName(d.day)}
              <span className="mono font-normal text-muted">{count} {count === 1 ? "commit" : "commits"}</span>
            </h3>
            {d.repos.map((r) => (
              <div key={r.repo} className="mt-3">
                <p className="flex items-center gap-2 px-2 text-sm font-semibold">
                  <span aria-hidden className="size-2.5 rounded-full" style={{ background: colorOf(r.repo) }} />
                  {r.repo}
                </p>
                <ul className="mt-1">
                  {r.commits.map((c) => (
                    <CommitRow key={c.hash} commit={c} selected={selected === c.hash} />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
