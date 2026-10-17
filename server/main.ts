// Servidor de producción: sirve dist/ y la API, solo en 127.0.0.1.
// Uso: npm start -- ~/proyectos ~/otra/carpeta
import { createServer, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApi } from "./api.ts";
import { displayPath, resolveRoots } from "./config.ts";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const PORT = Number(process.env.PORT ?? 4747);
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

const roots = resolveRoots(process.argv.slice(2), process.env);
const api = createApi({ roots });

type StaticResult = { body: Buffer; type: string } | "no-encontrado" | "sin-build";

async function serveStatic(pathname: string): Promise<StaticResult> {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return "no-encontrado"; // secuencia % mal formada
  }
  const file = path.normalize(path.join(DIST, decoded));
  if (!file.startsWith(DIST)) return "no-encontrado";
  for (const candidate of [file, path.join(DIST, "index.html")]) {
    try {
      const body = await readFile(candidate);
      return { body, type: TYPES[path.extname(candidate)] ?? "application/octet-stream" };
    } catch {
      // probar con el siguiente
    }
  }
  return "sin-build";
}

function text(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(body);
}

createServer(async (req, res) => {
  try {
    if (await api(req, res)) return;
    const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
    const file = await serveStatic(pathname === "/" ? "/index.html" : pathname);
    if (file === "no-encontrado") return text(res, 404, "No encontrado.");
    if (file === "sin-build") return text(res, 500, "No existe dist/. Corre npm run build primero.");
    res.writeHead(200, { "content-type": file.type });
    res.end(file.body);
  } catch (err) {
    // Un error en una petición no debe tumbar el servidor.
    console.error(err);
    if (!res.headersSent) text(res, 500, "Error interno.");
    else res.end();
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`bitácora en http://localhost:${PORT}`);
  console.log(`Leyendo: ${roots.map(displayPath).join(", ")}`);
});
