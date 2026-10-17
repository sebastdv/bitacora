import { describe, expect, it } from "vitest";
import { daysOf, minuteOfDay, rangeDetail, rangeFor, rangeTitle, shift, timeOf } from "./range.ts";

// Los tests corren con TZ=America/Bogota (UTC-5, sin horario de verano).
const today = new Date(2026, 9, 17, 11, 30); // sábado 17 de octubre de 2026

describe("rangeFor", () => {
  it("la semana va de lunes a lunes, en hora local", () => {
    const { from, to } = rangeFor("semana", "2026-10-17");
    expect(from.toISOString()).toBe("2026-10-12T05:00:00.000Z");
    expect(to.toISOString()).toBe("2026-10-19T05:00:00.000Z");
  });

  it("un domingo pertenece a la semana que empezó el lunes anterior", () => {
    expect(daysOf("semana", "2026-10-18")[0]).toBe("2026-10-12");
  });

  it("el mes cubre todos sus días", () => {
    const days = daysOf("mes", "2026-02-10");
    expect(days[0]).toBe("2026-02-01");
    expect(days.at(-1)).toBe("2026-02-28");
  });
});

describe("shift", () => {
  it("avanza y retrocede por unidad", () => {
    expect(shift("dia", "2026-10-17", -1)).toBe("2026-10-16");
    expect(shift("semana", "2026-10-17", -1)).toBe("2026-10-05");
    expect(shift("mes", "2026-01-31", 1)).toBe("2026-02-01");
  });
});

describe("títulos", () => {
  it("usa nombres relativos cerca de hoy", () => {
    expect(rangeTitle("dia", "2026-10-17", today)).toBe("Hoy");
    expect(rangeTitle("dia", "2026-10-16", today)).toBe("Ayer");
    expect(rangeTitle("semana", "2026-10-13", today)).toBe("Esta semana");
    expect(rangeTitle("semana", "2026-10-08", today)).toBe("La semana pasada");
    expect(rangeTitle("mes", "2026-09-02", today)).toBe("El mes pasado");
  });

  it("nombra fechas lejanas", () => {
    expect(rangeTitle("dia", "2026-10-07", today)).toBe("Miércoles 7 de octubre");
    expect(rangeTitle("dia", "2025-10-07", today)).toBe("Martes 7 de octubre de 2025");
    expect(rangeTitle("semana", "2026-09-30", today)).toBe("Semana del 28 de septiembre");
    expect(rangeTitle("mes", "2026-03-15", today)).toBe("Marzo de 2026");
  });

  it("detalla el rango, también cuando cruza de mes", () => {
    expect(rangeDetail("semana", "2026-10-17")).toBe("Del lunes 12 al domingo 18 de octubre de 2026");
    expect(rangeDetail("semana", "2026-10-01")).toBe("Del lunes 28 de septiembre al domingo 4 de octubre de 2026");
    expect(rangeDetail("mes", "2026-10-01")).toBe("Del 1 al 31 de octubre de 2026");
    expect(rangeDetail("dia", "2026-10-17")).toBe("Sábado 17 de octubre de 2026");
  });
});

describe("horas", () => {
  it("convierte la fecha del commit a hora local", () => {
    expect(timeOf("2026-10-13T14:05:00Z")).toBe("09:05");
    expect(minuteOfDay("2026-10-13T14:05:00Z")).toBe(9 * 60 + 5);
  });
});
