import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      // Route TanStack Start's server entry through src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
    }),
    viteReact(),
    // Wraps the SSR fetch handler into a real Node server (node_server preset,
    // default) that listens on PORT — without it, `vite build` only emits a
    // portable fetch-handler bundle with nothing to run it.
    nitro(),
  ],
});
