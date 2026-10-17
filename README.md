# bitácora

Junta tus commits de todos los repositorios de tu equipo y arma el resumen de tu semana, listo
para pegar en la daily, un reporte o un correo. Corre en tu computador: lee tus repos con git y
no envía nada a internet.

- **Línea de tiempo:** una fila por día y un punto por commit, ubicado a la hora en que lo
  hiciste y con el color del proyecto. Al hacer clic en un punto, la lista baja hasta ese commit.
- **Día, semana o mes:** con flechas (o ← → en el teclado) para moverte entre rangos.
- **Resumen en Markdown:** agrupado por proyecto o por día, con o sin los prefijos de
  Conventional Commits (`feat(api): crear ruta` pasa a `Crear ruta`). Los mensajes repetidos
  se juntan con `(×n)`.
- **Solo lo tuyo:** toma por defecto los correos configurados en git (global y por repositorio).
  Los commits de otras personas en los mismos repos quedan desmarcados y se pueden activar.
- **Filtros por proyecto:** para sacar del reporte lo que no corresponde (por ejemplo, proyectos
  personales en un reporte del trabajo).
- **Sin commitear:** avisa qué repos tienen cambios pendientes.

## Cómo usarla

Necesitas Node 22.18 o más reciente, que ejecuta TypeScript sin compilar.

```bash
git clone https://github.com/sebastdv/bitacora
cd bitacora
npm install
npm run build
npm start -- ~/proyectos     # http://localhost:4747
```

Si no pasas carpetas, bitácora lee la carpeta donde la clonaste (la que contiene a `bitacora/`).
También acepta varias carpetas (`npm start -- ~/trabajo ~/personal`) o la variable
`BITACORA_ROOTS` separada por `:`. Busca repositorios hasta tres niveles de profundidad y salta
`node_modules`, `vendor` y carpetas parecidas.

La versión publicada como sitio estático no tiene acceso a ningún repositorio y muestra datos de
ejemplo.

## Cómo funciona

- `server/repos.ts` recorre las carpetas y encuentra repos (reconoce `.git` como carpeta o como
  archivo, para worktrees y submódulos).
- `server/git.ts` ejecuta `git log --branches --remotes --tags --numstat` en cada uno con
  `execFile` (sin shell) y filtra por **fecha de autor**: un commit rebasado cuenta el día en que
  lo escribiste. No incluye el stash.
- `server/api.ts` expone `GET /api/activity?from&to` y `GET /api/pending`. Los cambios sin
  commitear van en su propia ruta porque `git status` es lo más lento (cientos de milisegundos en
  repos grandes) y no depende del rango; así moverse entre semanas tarda lo que tarda `git log`.
- La API solo responde si el encabezado `Host` es localhost, para que una página externa no
  pueda leer tu historial con DNS rebinding, y el servidor escucha solo en `127.0.0.1`.
- En desarrollo, la misma API corre dentro del servidor de Vite como plugin: un solo proceso.

## Desarrollo

```bash
npm run dev        # http://localhost:5173, con la API incluida
npm test           # 30 tests: lectura de git con repos reales, rangos, agrupación y resumen
npm run typecheck
```

Los tests de fechas corren con `TZ=America/Bogota`.

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, Vitest y Node sin frameworks para el servidor. Las
fuentes (Schibsted Grotesk y Martian Mono) van incluidas.

Las decisiones de diseño están en [DESIGN.md](DESIGN.md).
