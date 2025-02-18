import path from "node:path";
import type { PluginContext } from "rollup";
import type { BuildEnvironment, Plugin, ViteBuilder, ViteDevServer } from "vite";
import { assert } from "./assert";
import type { VercelOutputConfig, ViteVercelConfig, ViteVercelEntry } from "./types";

export function createAPI(
  entries: ViteVercelEntry[],
  outfiles: ViteVercelOutFile[],
  pluginConfig: ViteVercelConfig,
  pluginContext?: PluginContext,
) {
  return {
    addVercelEntry(entry: ViteVercelEntry) {
      entries.push(entry);
      if (pluginContext?.environment.mode === "build") {
        return pluginContext.emitFile({
          type: "chunk",
          fileName: `${path.posix.join("functions/", entry.destination)}.func/index.${entry.edge ? "js" : "mjs"}`,
          id: `virtual:vite-plugin-vercel:entry:${entry.input}`,
          importer: undefined,
        });
      }
    },
    getOutFiles(): ViteVercelOutFile[] {
      assert(outfiles.length > 0, "getOutFiles() must be called after all outputs have been generated");

      return outfiles;
    },
    get config(): Partial<Omit<VercelOutputConfig, "version">> {
      pluginConfig.config ??= {};
      return pluginConfig.config;
    },
  };
}

export function getVercelAPI(pluginContextOrServer: PluginContext | ViteDevServer) {
  const config =
    "environment" in pluginContextOrServer ? pluginContextOrServer.environment.config : pluginContextOrServer.config;
  const vpv: Plugin<(pluginContext?: PluginContext) => ViteVercelApi> | undefined = config.plugins.find(
    (p) => p.name === "vite-plugin-vercel",
  );
  assert(vpv, "Could not find vite-plugin-vercel plugin");
  assert(vpv.api, "Missing `api`. Make sure vite-plugin-vercel is up-to-date");

  return vpv.api("environment" in pluginContextOrServer ? pluginContextOrServer : undefined);
}

export async function vercelBuildApp(builder: ViteBuilder, otherEnvsOrder?: Record<string, "pre" | "post" | number>) {
  const priority: Record<string, number> = {
    vercel_client: 10,
    vercel_edge: 20,
    vercel_node: 30,
  }; // Higher priority values should be at the end

  const envs = Object.values(builder.environments);
  envs.sort((a, b) => {
    const aPriority = priority[a.name] ?? prePostToOrder(otherEnvsOrder?.[a.name]) ?? 0;
    const bPriority = priority[b.name] ?? prePostToOrder(otherEnvsOrder?.[b.name]) ?? 0;

    return aPriority - bPriority;
  });

  // console.log(
  //   "buildApp",
  //   envs.map((e) => e.name),
  // );

  let i = 0;
  for (const environment of envs) {
    environment.logger.info(`[vite-plugin-vercel] Build step ${++i}/${envs.length}: ${environment.name}`);
    await builder.build(environment);
  }
}

function prePostToOrder(s?: string | number) {
  if (!s) return 0;
  if (typeof s === "number") return s;
  if (s === "pre") return -1;
  if (s === "post") return 50;
  throw new Error(`Unsupported order ${s}`);
}

export type ViteVercelApi = ReturnType<typeof createAPI>;

export type ViteVercelOutFile = ViteVercelOutFileChunk | ViteVercelOutFileAsset;

interface ViteVercelOutFileCommon {
  filepath: string;
  root: string;
  outdir: string;
}

export interface ViteVercelOutFileChunk extends ViteVercelOutFileCommon {
  type: "chunk";
  relatedEntry: ViteVercelEntry;
}

export interface ViteVercelOutFileAsset extends ViteVercelOutFileCommon {
  type: "asset";
}

export interface BuildEnvironmentWithOrder {
  env: BuildEnvironment;
  order?: "pre" | "post";
}
