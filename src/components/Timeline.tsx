import type { Commit } from "../shared/types.ts";
import type { ColorOf } from "../lib/colors.ts";
import { dayKey, minuteOfDay, parseDay, timeOf, weekdayShort } from "../lib/range.ts";

/**
 * Una fila por día y un punto por commit, ubicado a la hora en que lo hiciste.
 * El eje se ajusta a tus horas reales, con un mínimo de 8:00 a 19:00.
 */
export function Timeline({
  days,
  commits,
  onSelect,
  colorOf,
}: {
  days: string[];
  commits: Commit[];
  onSelect(hash: string): void;
  colorOf: ColorOf;
}) {
  const compact = days.length > 7;
  const today = dayKey(new Date());
  const byDay = new Map<string, Commit[]>();
  for (const c of commits) {
    const key = dayKey(new Date(c.date));
    byDay.set(key, [...(byDay.get(key) ?? []), c]);
  }

  const minutes = commits.map((c) => minuteOfDay(c.date));
  const startH = Math.min(8, ...minutes.map((m) => Math.floor(m / 60)));
  const endH = Math.min(24, Math.max(19, ...minutes.map((m) => Math.floor(m / 60) + 1)));
  const span = (endH - startH) * 60;
  const at = (minute: number) => `${((minute - startH * 60) / span) * 100}%`;
  const ticks: number[] = [];
  for (let h = startH + (startH % 2); h <= endH; h += 2) ticks.push(h);

  return (
    <figure aria-label="Commits por día y hora" className="rounded-lg border border-line bg-panel px-3 pb-3 pt-4 sm:px-5">
      <div className="grid grid-cols-[3.25rem_1fr_1.75rem] items-center gap-x-3">
        {days.map((day) => {
          const list = byDay.get(day) ?? [];
          const weekend = [0, 6].includes(parseDay(day).getDay());
          const isToday = day === today;
          return (
            <div key={day} className="contents">
              <div
                className={`mono text-right ${isToday ? "font-bold text-accent" : weekend ? "text-muted/70" : "text-muted"} ${compact ? "text-[0.62rem]" : ""}`}
              >
                {compact ? parseDay(day).getDate() : `${weekdayShort(day)} ${parseDay(day).getDate()}`}
              </div>
              <div className={`relative ${compact ? "h-5" : "h-9"}`}>
                <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
                {ticks.map((h) => (
                  <div key={h} className="absolute top-1/4 h-1/2 w-px bg-track" style={{ left: at(h * 60) }} />
                ))}
                {list.map((c) => (
                  <button
                    key={c.hash}
                    type="button"
                    onClick={() => onSelect(c.hash)}
                    aria-label={`${c.repo}, ${timeOf(c.date)}: ${c.subject}`}
                    title={`${c.repo} · ${timeOf(c.date)}\n${c.subject}`}
                    className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-panel transition-transform hover:scale-150 focus-visible:scale-150 ${compact ? "size-2.5" : "size-3.5"}`}
                    style={{ left: at(minuteOfDay(c.date)), background: colorOf(c.repo) }}
                  />
                ))}
              </div>
              <div className="mono text-muted">{list.length || ""}</div>
            </div>
          );
        })}
        <div />
        <div className="relative mt-1 h-4" aria-hidden>
          {ticks.map((h, i) => (
            <span
              key={h}
              className={`mono absolute -translate-x-1/2 text-[0.62rem] text-muted ${i % 2 ? "max-sm:hidden" : ""}`}
              style={{ left: at(h * 60) }}
            >
              {h}h
            </span>
          ))}
        </div>
        <div />
      </div>
    </figure>
  );
}
