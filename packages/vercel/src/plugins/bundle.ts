import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { copyFile, rm } from "node:fs/promises";
import path from "node:path";
import { findRoot } from "@manypkg/find-root";
import { nodeFileTrace } from "@vercel/nft";
import { build, type Plugin as ESBuildPlugin } from "esbuild";
import type { Environment, Plugin } from "vite";
import { getVercelAPI, type ViteVercelOutFile, type ViteVercelOutFileChunk } from "../api";
import { joinAbsolute, joinAbsolutePosix } from "../helpers";
import type { ViteVercelConfig } from "../types";

const edgeWasmPlugin: ESBuildPlugin = {
  name: "edge-wasm-vercel",
  setup(build) {
    build.onResolve({ filter: /\.wasm/ }, (args) => {
      return {
        path: args.path.replace(/\.wasm\?module$/i, ".wasm"),
        external: true,
      };
    });
  },
};

interface BundleAsset {
  env: string;
  root: string;
  outDir: string;
  fileName: string;
  outFile: string;
}

// We cannot disable code-splitting with Vite/Rollup,
// so we use esbuild when all files are written on the filesystem to bundle each functions.
export function bundlePlugin(pluginConfig: ViteVercelConfig): Plugin {
  const bundledAssets = new Map<string, BundleAsset>();

  return {
    name: "vite-plugin-vercel:bundle",
    enforce: "post",
    apply: "build",

    generateBundle(_opts, bundle) {
      for (const b of Object.values(bundle)) {
        if (b.type === "asset") {
          const originalFileNames = b.originalFileNames.map((relativePath) =>
            path.resolve(this.environment.config.root, relativePath),
          );

          const asset: BundleAsset = {
            env: this.environment.name,
            root: this.environment.config.root,
            outDir: this.environment.config.build.outDir,
            outFile: joinAbsolute(this.environment, this.environment.config.build.outDir, b.fileName),
            fileName: b.fileName,
          };

          for (const originalFileName of originalFileNames) {
            bundledAssets.set(originalFileName, asset);
          }
        }
      }
    },

    closeBundle: {
      order: "post",
      async handler() {
        // We assume that vercel_node always runs last
        if (this.environment.name !== "vercel_node") return;

        const api = getVercelAPI(this);
        const outfiles = api.getOutFiles();

        for (const outfile of outfiles) {
          if (outfile.type === "asset") {
            const { source, destination } = getAbsoluteOutFileWithout_tmp(outfile);
            await copyFile(source, destination);
          } else {
            await bundle(this.environment, bundledAssets, outfile);
          }
        }

        const tmpDir = pluginConfig.outDir ? path.posix.join(pluginConfig.outDir, "_tmp") : ".vercel/output/_tmp";

        await rm(tmpDir, { recursive: true });
      },
    },

    sharedDuringBuild: true,
  };
}

function getAbsoluteOutFileWithout_tmp(outfile: ViteVercelOutFile) {
  const source = joinAbsolutePosix(outfile.root, outfile.outdir, outfile.filepath);
  // effectively removes appended _tmp folder
  const destination = source.replace(outfile.outdir, path.dirname(outfile.outdir));
  return {
    source,
    destination,
  };
}

async function bundle(
  environment: Environment,
  bundledAssets: Map<string, BundleAsset>,
  outfile: ViteVercelOutFileChunk,
) {
  const { source, destination } = getAbsoluteOutFileWithout_tmp(outfile);

  await build({
    platform: outfile.relatedEntry.edge ? "browser" : "node",
    format: "esm",
    target: "es2022",

    bundle: true,
    // external: configResolvedVike.server.external,
    entryPoints: [source],
    outExtension: outfile.relatedEntry.edge ? {} : { ".js": ".mjs" },
    outfile: destination,
    // allowOverwrite: true,
    // metafile: true,
    logOverride: { "ignored-bare-import": "silent" },
    plugins: [edgeWasmPlugin],
  });

  let base = environment.config.root;
  try {
    const dir = await findRoot(environment.config.root);
    base = dir.rootDir;
  } catch (e) {
    // ignore error
  }

  if (!existsSync(outfile.relatedEntry.input)) {
    // TODO virtual imports? modules from node_modules?
    return;
  }

  const { fileList, reasons } = await nodeFileTrace([outfile.relatedEntry.input], {
    base,
    processCwd: environment.config.root,
    mixedModules: true,
    ignore: [
      "**/node_modules/react{,-dom,-dom-server-turbopack}/**/*.development.js",
      "**/*.d.ts",
      "**/*.map",
      "**/node_modules/webpack5/**/*",
    ],
    async readFile(filepath) {
      if (filepath.endsWith(".ts") || filepath.endsWith(".tsx")) {
        const result = await build({
          target: "es2022",
          format: "esm",
          platform: "node",
          logLevel: "info",
          logOverride: {
            "ignored-bare-import": "verbose",
            "require-resolve-not-external": "verbose",
          },
          minify: false,
          plugins: [],
          define: {
            "process.env.NODE_ENV": '"production"',
            "import.meta.env.NODE_ENV": '"production"',
          },
          entryPoints: [outfile.relatedEntry.input],
          bundle: false,
          write: false,
        });

        return result.outputFiles[0].text;
      }

      return readFileSync(filepath, "utf-8");
    },
  });

  for (const file of fileList) {
    if (
      reasons.has(file) &&
      reasons.get(file)?.type.includes("asset") &&
      !file.endsWith(".js") &&
      !file.endsWith(".cjs") &&
      !file.endsWith(".mjs") &&
      !file.endsWith("package.json")
    ) {
      const absolutePath = path.join(base, file);

      // @vercel/nft needs to scan the original entries in order to find missing assets.
      // But Vite already did a pass, and assets imports can have qlready been rewritten.
      // If so, instead of using the original filename found by @vercel/nft,
      // we use the one generated by Vite.
      const assetRenamedByVite = bundledAssets.get(absolutePath);

      const basename = path.basename(assetRenamedByVite ? assetRenamedByVite.fileName : absolutePath);

      if (assetRenamedByVite) {
        // Edit imports in-place to make them relative
        writeFileSync(
          destination,
          readFileSync(destination, "utf-8").replaceAll(
            `/${assetRenamedByVite.fileName}`,
            `./${path.basename(assetRenamedByVite.fileName)}`,
          ),
        );
      }

      await copyFile(absolutePath, path.join(path.dirname(destination), basename));
    }
  }
}
