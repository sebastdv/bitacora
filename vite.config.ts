import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createApi } from "./server/api.ts";
import { resolveRoots } from "./server/config.ts";

// En desarrollo la API vive dentro del servidor de Vite: un solo proceso.
function bitacoraApi(): Plugin {
  return {
    name: "bitacora-api",
    configureServer(server) {
      const api = createApi({ roots: resolveRoots([], process.env) });
      server.middlewares.use((req, res, next) => {
        api(req, res).then((handled) => {
          if (!handled) next();
        }, next);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), bitacoraApi()],
  test: {
    include: ["src/**/*.test.ts", "server/**/*.test.ts"],
  },
});
