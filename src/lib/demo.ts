import type { ActivityResponse, Commit, PendingResponse } from "../shared/types.ts";

// Datos de ejemplo con proyectos públicos, fechados relativo a la semana actual
// para que la demo siempre muestre "Esta semana" con actividad.
const ME = "tu@correo.dev";
const OTHER = "colega@correo.dev";

// [semanas atrás, día (0 = lunes), hora, proyecto, mensaje, +, −, autor]
type Row = [number, number, string, string, string, number, number, string?];

const ROWS: Row[] = [
  [1, 0, "09:12", "corto", "build(corto): crear proyecto next con drizzle y pglite", 412, 0],
  [1, 0, "15:40", "corto", "feat(enlaces): crear enlaces cortos con código propio", 286, 12],
  [1, 2, "10:05", "corto", "feat(enlaces): contar visitas sin guardar ips", 154, 20],
  [1, 3, "18:22", "corto", "feat(interfaz): agregar estadísticas por día", 233, 41],
  [1, 4, "11:30", "portafolio", "feat(portafolio): agregar sección de proyectos", 98, 6],
  [0, 0, "08:47", "nitido", "build(nitido): crear proyecto vite con react, tailwind y vitest", 389, 0],
  [0, 0, "10:20", "nitido", "feat(json): parsear con errores en español y posición exacta", 512, 0],
  [0, 0, "16:55", "nitido", "test(json): cubrir comas sobrantes y comentarios", 140, 3],
  [0, 1, "09:30", "nitido", "feat(json): comparar dos json por ruta", 268, 14],
  [0, 1, "11:02", "corto", "fix(enlaces): aceptar mayúsculas en el código", 6, 2],
  [0, 1, "14:15", "nitido", "feat(interfaz): vista lado a lado con diff por líneas", 331, 27],
  [0, 1, "14:50", "corto", "docs(corto): explicar el despliegue en vercel", 44, 3, OTHER],
  [0, 2, "10:40", "portafolio", "feat(portafolio): agregar nitido a los proyectos", 18, 1],
  [0, 2, "11:25", "nitido", "fix(interfaz): plural de cambios en el resumen", 9, 4],
  [0, 2, "19:05", "lockline", "docs(lockline): aclarar el estado del proyecto", 12, 5],
  [0, 3, "08:58", "bitacora", "build(bitacora): crear proyecto vite con api local", 205, 0],
  [0, 3, "13:12", "bitacora", "feat(git): leer commits de todos los repositorios", 246, 8],
  [0, 3, "17:44", "bitacora", "feat(resumen): armar el resumen en markdown", 133, 2],
  [0, 4, "09:20", "bitacora", "feat(interfaz): línea de tiempo por hora", 298, 31],
  [0, 4, "12:03", "bitacora", "fix(interfaz): semanas que cruzan de mes", 11, 6],
  [0, 4, "21:36", "portafolio", "docs(portafolio): actualizar el readme", 22, 9],
];

function mondayOf(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
}

function fakeHash(i: number): string {
  let h = (i + 1) * 2654435761;
  let out = "";
  for (let k = 0; k < 5; k++) {
    h = (h ^ (h >>> 13)) * 1274126177;
    out += (h >>> 0).toString(16).padStart(8, "0");
  }
  return out.slice(0, 40);
}

export function demoActivity(from: Date, to: Date, today = new Date()): ActivityResponse {
  const monday = mondayOf(today);
  const commits: Commit[] = ROWS.map(([weeksAgo, day, time, repo, subject, added, deleted, email], i) => {
    const [h, m] = time.split(":").map(Number);
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 7 * weeksAgo + day, h, m);
    return {
      repo, hash: fakeHash(i), email: email ?? ME, author: email ? "Colega" : "Tú",
      date: date.toISOString(), branch: "main", subject, added, deleted, files: Math.max(1, Math.round(added / 60)),
    };
  }).filter((c) => {
    const t = new Date(c.date);
    return t >= from && t < to && t <= today;
  });

  return {
    roots: ["~/proyectos"],
    me: [ME],
    repos: ["bitacora", "corto", "lockline", "nitido", "portafolio"].map((name) => ({ name })),
    commits,
  };
}

export const demoPending: PendingResponse = { repos: [{ name: "bitacora", dirty: 3 }] };
