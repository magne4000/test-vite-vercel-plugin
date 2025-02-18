import { defineConfig } from "tsup";

const entry = {
  index: "./src/index.ts",
  plugins: "./src/plugins/index.ts",
  config: "./src/config.ts",
};

export default defineConfig([
  {
    clean: true,
    entry,
    external: ["esbuild", "vike"],
    format: ["esm", "cjs"],
    platform: "node",
    target: "node18",
    dts: {
      entry,
      compilerOptions: {
        paths: {},
      },
    },
  },
]);
