# bitácora: diseño

Herramienta local para responder "¿qué hice esta semana?" a partir de los commits de todos los
repositorios de una carpeta.

## Decisiones

| Tema | Decisión | Por qué |
|---|---|---|
| Arquitectura | Servidor Node local + interfaz React | El navegador no puede ejecutar git ni leer carpetas; un servidor en `127.0.0.1` sí, sin subir nada. |
| Servidor | `node:http` sin framework, TypeScript ejecutado directo por Node 22.18+ | Son dos rutas GET; un framework no aporta y así no hay paso de compilación para el servidor. |
| Desarrollo | La API como plugin de Vite (`configureServer`) | Un solo proceso y un solo puerto en desarrollo. |
| Lectura de git | `execFile("git", ...)` con `--numstat`, separadores `\x1e`/`\x1f` | Sin shell no hay inyección por nombres de carpeta; los separadores de control no aparecen en mensajes de commit. |
| Fecha | Fecha de autor, rango semiabierto `[from, to)` | Refleja cuándo se hizo el trabajo. `--since` (fecha de committer) sirve de poda porque nunca es anterior a la de autor. |
| Ramas | `--branches --remotes --tags`, sin `--all` | `--all` incluye el stash, que no es trabajo hecho. Duplicados por hash se eliminan. |
| Autoría | Por defecto, los correos de `git config user.email` (global y locales) | Muchos usan un correo distinto en el trabajo; el filtro es editable y se recuerda. |
| Zona horaria | La del navegador; semanas de lunes a domingo | Es la del usuario. Los tests fijan `America/Bogota`. |
| Rendimiento | `git status` en una ruta aparte; repos en caché 30 s; 8 repos en paralelo | Con 22 repos, una semana pasó de 1,6 s a 0,6 s. |
| Seguridad | Solo `127.0.0.1`, solo GET, `Host` debe ser localhost, rutas estáticas confinadas a `dist/` | Es una API que lee tu disco: no debe ser alcanzable desde otra máquina ni desde otra página. |
| Colores | Cada proyecto prefiere el tono de su hash y, si está ocupado, toma el siguiente libre | Distintos entre sí hasta 8 proyectos y casi siempre el mismo entre semanas. |
| Demo | Si `/api/activity` no responde JSON, se usan datos de ejemplo | La misma build sirve como demo estática para el portafolio. |

## Fuera de alcance

Leer GitHub o GitLab por API, horas trabajadas o facturación, resúmenes con IA.
