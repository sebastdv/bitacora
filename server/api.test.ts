import path from "node:path";
import { describe, expect, it } from "vitest";
import { isLocalHost, parseRange } from "./api.ts";
import { resolveRoots } from "./config.ts";

describe("isLocalHost", () => {
  it("acepta localhost con o sin puerto", () => {
    for (const h of ["localhost", "localhost:5173", "127.0.0.1:4747", "[::1]:4747", "bitacora.localhost:80"]) {
      expect(isLocalHost(h)).toBe(true);
    }
  });

  it("rechaza cualquier otro host", () => {
    for (const h of [undefined, "", "evil.com", "localhost.evil.com", "127.0.0.2:4747", "192.168.1.5"]) {
      expect(isLocalHost(h)).toBe(false);
    }
  });
});

describe("parseRange", () => {
  const p = (q: string) => parseRange(new URLSearchParams(q));

  it("acepta un rango ISO válido", () => {
    expect(p("from=2026-10-12T05:00:00Z&to=2026-10-19T05:00:00Z")).toEqual({
      from: new Date("2026-10-12T05:00:00Z"),
      to: new Date("2026-10-19T05:00:00Z"),
    });
  });

  it("rechaza fechas faltantes, invertidas o un rango demasiado largo", () => {
    expect(p("from=2026-10-12")).toMatch(/Faltan/);
    expect(p("from=2026-10-19&to=2026-10-12")).toMatch(/posterior/);
    expect(p("from=2020-01-01&to=2026-01-01")).toMatch(/400 días/);
  });
});

describe("resolveRoots", () => {
  const cwd = "/home/yo/Projects/bitacora";

  it("usa la carpeta padre si no se indica nada", () => {
    expect(resolveRoots([], {}, cwd)).toEqual(["/home/yo/Projects"]);
  });

  it("prefiere argumentos sobre BITACORA_ROOTS y quita duplicados", () => {
    expect(resolveRoots(["../a", "../a", "--flag"], { BITACORA_ROOTS: "/x" }, cwd)).toEqual(["/home/yo/Projects/a"]);
    expect(resolveRoots([], { BITACORA_ROOTS: `/x${path.delimiter}/y` }, cwd)).toEqual(["/x", "/y"]);
  });
});
