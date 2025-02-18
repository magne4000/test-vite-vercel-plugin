import type { Plugin } from "vite";

export function wasmPlugin(): Plugin {
  return {
    name: "vite-plugin-vercel:fix-wasm-module",
    enforce: "pre",

    resolveId: {
      order: "pre",
      async handler(id) {
        if (!id.endsWith(".wasm?module")) return;
        if (this.environment.name !== "vercel_edge") return;

        return {
          id,
          external: true,
        };
      },
    },
  };
}
