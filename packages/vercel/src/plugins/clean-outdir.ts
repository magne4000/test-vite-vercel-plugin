import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import type { ViteVercelConfig } from "../types";

export function vercelCleanupPlugin(pluginConfig?: ViteVercelConfig): Plugin {
  let alreadyRun = false;

  return {
    apply: "build",
    name: "vite-plugin-vercel:cleanup",
    enforce: "pre",

    applyToEnvironment(env) {
      return env.name === "client";
    },

    buildStart: {
      order: "pre",
      sequential: true,
      handler() {
        if (alreadyRun) return;
        alreadyRun = true;
        const absoluteOutdir =
          pluginConfig?.outDir && path.isAbsolute(pluginConfig.outDir)
            ? pluginConfig.outDir
            : path.join(this.environment.config.root, pluginConfig?.outDir ?? ".vercel/output");
        cleanOutputDirectory(absoluteOutdir);
      },
    },

    sharedDuringBuild: true,
  };
}

function cleanOutputDirectory(outdir: string) {
  fs.rmSync(outdir, {
    recursive: true,
    force: true,
  });

  fs.mkdirSync(outdir, { recursive: true });
}
