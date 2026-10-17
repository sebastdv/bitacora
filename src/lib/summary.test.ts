import { describe, expect, it } from "vitest";
import type { Commit } from "../shared/types.ts";
import { cleanSubject, parseSubject } from "./conventional.ts";
import { assignColors, groupByDay, groupByRepo, stats } from "./group.ts";
import { buildSummary } from "./summary.ts";

let n = 0;
function commit(repo: string, date: string, subject: string, added = 1, deleted = 0): Commit {
  return { repo, hash: `h${n++}`, email: "yo@mail.com", author: "Yo", date, branch: "main", subject, added, deleted, files: 1 };
}

const commits = [
  commit("nitido", "2026-10-13T10:00:00-05:00", "feat(json): parsear números grandes", 120, 4),
  commit("corto", "2026-10-13T09:00:00-05:00", "build(corto): crear proyecto", 300),
  commit("corto", "2026-10-14T16:20:00-05:00", "fix: redirección con mayúsculas", 3, 2),
  commit("corto", "2026-10-14T17:00:00-05:00", "wip"),
  commit("corto", "2026-10-14T17:30:00-05:00", "wip"),
];

describe("parseSubject", () => {
  it("separa tipo, alcance y ruptura", () => {
    expect(parseSubject("feat(api)!: cambiar respuesta")).toEqual({ type: "feat", scope: "api", breaking: true, text: "cambiar respuesta" });
    expect(parseSubject("fix: algo")).toMatchObject({ type: "fix", scope: null });
  });

  it("deja intactos los mensajes sin formato o con tipos desconocidos", () => {
    expect(parseSubject("Arreglo rápido: login")).toMatchObject({ type: null, text: "Arreglo rápido: login" });
    expect(parseSubject("wip")).toMatchObject({ type: null, text: "wip" });
  });

  it("cleanSubject quita el prefijo y pone mayúscula inicial", () => {
    expect(cleanSubject("feat(json): parsear números")).toBe("Parsear números");
    expect(cleanSubject("wip")).toBe("Wip");
  });
});

describe("agrupación", () => {
  it("agrupa por día en orden y por proyecto según su primer commit", () => {
    const days = groupByDay(commits);
    expect(days.map((d) => d.day)).toEqual(["2026-10-13", "2026-10-14"]);
    expect(days[0].repos.map((r) => r.repo)).toEqual(["corto", "nitido"]);
  });

  it("ordena proyectos por actividad", () => {
    expect(groupByRepo(commits).map((r) => [r.repo, r.commits.length])).toEqual([["corto", 4], ["nitido", 1]]);
  });

  it("calcula totales", () => {
    expect(stats(commits)).toEqual({ commits: 5, repos: 2, days: 2, added: 425, deleted: 6 });
  });

  it("no repite colores hasta agotar la paleta", () => {
    const names = ["citara", "Fintegra", "FianzaCredito-Frontend", "Suite", "nitido", "f16", "corto", "lockline"];
    expect(new Set(assignColors(names).values()).size).toBe(8);
    expect(assignColors([...names, "noveno"]).size).toBe(9);
  });

  it("un proyecto conserva su color aunque cambie el orden de entrada", () => {
    expect(assignColors(["b", "a", "c"])).toEqual(assignColors(["c", "b", "a"]));
  });
});

describe("buildSummary", () => {
  it("por proyecto, sin prefijos y juntando mensajes repetidos", () => {
    expect(buildSummary(commits, { title: "Esta semana", groupBy: "proyecto", clean: true })).toBe(
      [
        "**Esta semana**",
        "",
        "**corto**",
        "- Crear proyecto",
        "- Redirección con mayúsculas",
        "- Wip (×2)",
        "",
        "**nitido**",
        "- Parsear números grandes",
      ].join("\n"),
    );
  });

  it("por día, con el proyecto en cada línea y los mensajes originales", () => {
    const text = buildSummary(commits.slice(0, 3), { title: "Semana", groupBy: "dia", clean: false });
    expect(text).toBe(
      [
        "**Semana**",
        "",
        "**Martes 13 de octubre**",
        "- corto: build(corto): crear proyecto",
        "- nitido: feat(json): parsear números grandes",
        "",
        "**Miércoles 14 de octubre**",
        "- corto: fix: redirección con mayúsculas",
      ].join("\n"),
    );
  });

  it("dice que no hubo commits en vez de quedar vacío", () => {
    expect(buildSummary([], { title: "Hoy", groupBy: "dia", clean: true })).toBe("**Hoy**\n\nSin commits en este rango.");
  });
});
