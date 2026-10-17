// Rangos de fechas en la zona horaria del navegador. Las semanas empiezan el lunes.

export type Unit = "dia" | "semana" | "mes";

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const pad = (n: number) => String(n).padStart(2, "0");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDay(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function start(unit: Unit, d: Date): Date {
  if (unit === "mes") return new Date(d.getFullYear(), d.getMonth(), 1);
  if (unit === "semana") return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function advance(unit: Unit, d: Date, n: number): Date {
  if (unit === "mes") return new Date(d.getFullYear(), d.getMonth() + n, 1);
  return addDays(d, unit === "semana" ? 7 * n : n);
}

/** Rango semiabierto [from, to) que contiene el día `anchor`. */
export function rangeFor(unit: Unit, anchor: string): { from: Date; to: Date } {
  const from = start(unit, parseDay(anchor));
  return { from, to: advance(unit, from, 1) };
}

export function shift(unit: Unit, anchor: string, n: number): string {
  return dayKey(advance(unit, start(unit, parseDay(anchor)), n));
}

export function daysOf(unit: Unit, anchor: string): string[] {
  const { from, to } = rangeFor(unit, anchor);
  const days: string[] = [];
  for (let d = from; d < to; d = addDays(d, 1)) days.push(dayKey(d));
  return days;
}

/** "lunes 13 de octubre" */
export function dayName(key: string, withYear = false): string {
  const d = parseDay(key);
  const base = `${WEEKDAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
  return withYear ? `${base} de ${d.getFullYear()}` : base;
}

export function weekdayShort(key: string): string {
  return cap(WEEKDAYS[parseDay(key).getDay()].slice(0, 3));
}

/** Nombre corto del rango, relativo a hoy cuando se puede. */
export function rangeTitle(unit: Unit, anchor: string, today = new Date()): string {
  const now = dayKey(start(unit, today));
  const here = dayKey(start(unit, parseDay(anchor)));
  if (here === now) return { dia: "Hoy", semana: "Esta semana", mes: "Este mes" }[unit];
  if (here === dayKey(advance(unit, start(unit, today), -1))) {
    return { dia: "Ayer", semana: "La semana pasada", mes: "El mes pasado" }[unit];
  }
  const d = parseDay(here);
  if (unit === "dia") return cap(dayName(here, d.getFullYear() !== today.getFullYear()));
  if (unit === "mes") return `${cap(MONTHS[d.getMonth()])} de ${d.getFullYear()}`;
  return `Semana del ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

/** Descripción exacta del rango: "Del lunes 12 al domingo 18 de octubre". */
export function rangeDetail(unit: Unit, anchor: string): string {
  const { from, to } = rangeFor(unit, anchor);
  const last = addDays(to, -1);
  if (unit === "dia") return cap(dayName(dayKey(from), true));
  const sameMonth = from.getMonth() === last.getMonth();
  const first = unit === "semana" ? `${WEEKDAYS[from.getDay()]} ${from.getDate()}` : String(from.getDate());
  const end = unit === "semana" ? `${WEEKDAYS[last.getDay()]} ${last.getDate()}` : String(last.getDate());
  return sameMonth
    ? `Del ${first} al ${end} de ${MONTHS[last.getMonth()]} de ${last.getFullYear()}`
    : `Del ${first} de ${MONTHS[from.getMonth()]} al ${end} de ${MONTHS[last.getMonth()]} de ${last.getFullYear()}`;
}

/** Hora local en 24 h: "09:05". */
export function timeOf(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Minutos desde la medianoche local. */
export function minuteOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}
