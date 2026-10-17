import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { countDirty, parseLog, readCommits } from "./git.ts";
import { findRepos } from "./repos.ts";

const R = "\x1e";
const F = "\x1f";

describe("parseLog", () => {
  it("lee cabecera y numstat, incluidos binarios", () => {
    const out =
      `${R}abc123${F}Yo@Mail.com${F}Yo${F}2026-10-13T09:15:00-05:00${F}refs/heads/main${F}feat(api): crear ruta\n\n` +
      `10\t2\tsrc/a.ts\n-\t-\tlogo.png\n` +
      `${R}def456${F}yo@mail.com${F}Yo${F}2026-10-13T11:00:00-05:00${F}${F}fix: corregir: dos puntos\n`;
    const commits = parseLog(out, "corto");
    expect(commits).toHaveLength(2);
    expect(commits[0]).toMatchObject({
      repo: "corto", hash: "abc123", email: "yo@mail.com", branch: "main",
      subject: "feat(api): crear ruta", added: 10, deleted: 2, files: 2,
    });
    expect(commits[1]).toMatchObject({ branch: null, subject: "fix: corregir: dos puntos", files: 0 });
  });

  it("quita el prefijo de ramas remotas", () => {
    const out = `${R}a1${F}x@y.z${F}X${F}2026-10-13T09:00:00Z${F}refs/remotes/origin/dev${F}chore: algo\n`;
    expect(parseLog(out, "r")[0].branch).toBe("origin/dev");
  });
});

describe("con repositorios reales", () => {
  let root: string;

  function git(cwd: string, args: string[], date?: string) {
    execFileSync("git", args, {
      cwd,
      env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date, GIT_CONFIG_GLOBAL: "/dev/null" },
      stdio: "pipe",
    });
  }

  function makeRepo(rel: string) {
    const dir = path.join(root, rel);
    mkdirSync(dir, { recursive: true });
    git(dir, ["init", "-q", "-b", "main"]);
    git(dir, ["config", "user.email", "yo@mail.com"]);
    git(dir, ["config", "user.name", "Yo"]);
    return dir;
  }

  function commit(dir: string, file: string, msg: string, date: string) {
    writeFileSync(path.join(dir, file), msg);
    git(dir, ["add", file]);
    git(dir, ["commit", "-q", "-m", msg], date);
  }

  beforeAll(() => {
    root = mkdtempSync(path.join(os.tmpdir(), "bitacora-"));
    const a = makeRepo("alfa");
    commit(a, "a.txt", "feat: antes del rango", "2026-10-11T10:00:00-05:00");
    commit(a, "b.txt", "feat: dentro del rango", "2026-10-13T10:00:00-05:00");
    commit(a, "c.txt", "fix: también dentro", "2026-10-14T18:30:00-05:00");
    writeFileSync(path.join(a, "sucio.txt"), "sin commitear");
    makeRepo("grupo/beta");
    makeRepo("otros/node_modules/paquete");
    makeRepo("uno/dos/tres/cuatro/hondo");
  });

  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("encuentra repos anidados, salta node_modules y respeta la profundidad", async () => {
    const repos = await findRepos([root]);
    expect(repos.map((r) => r.name)).toEqual(["alfa", path.join("grupo", "beta")]);
  });

  it("devuelve solo los commits cuya fecha de autor cae en el rango", async () => {
    const from = new Date("2026-10-12T05:00:00Z");
    const to = new Date("2026-10-19T05:00:00Z");
    const commits = await readCommits({ name: "alfa", path: path.join(root, "alfa") }, from, to);
    expect(commits.map((c) => c.subject)).toEqual(["fix: también dentro", "feat: dentro del rango"]);
    expect(commits[0]).toMatchObject({ branch: "main", files: 1, added: 1 });
  });

  it("cuenta archivos sin commitear", async () => {
    expect(await countDirty(path.join(root, "alfa"))).toBe(1);
    expect(await countDirty(path.join(root, "grupo", "beta"))).toBe(0);
  });
});
