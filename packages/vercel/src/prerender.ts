import fs from "node:fs/promises";
import path from "node:path";
import type { Rewrite } from "@vercel/routing-utils";
import type { ResolvedConfig } from "vite";
import { copyDir, getOutput } from "./helpers";
import { type VercelOutputPrerenderConfig, vercelOutputPrerenderConfigSchema } from "./schemas/config/prerender-config";
import type { VercelOutputIsr, ViteVercelPrerenderRoute } from "./types";

export function execPrerender(
  resolvedConfig: ResolvedConfig,
): ViteVercelPrerenderRoute | Promise<ViteVercelPrerenderRoute> {
  const prerender = resolvedConfig.vercel?.prerender;

  if (prerender === false) {
    return;
  }

  return prerender?.(resolvedConfig);
}

// FIXME { group } will be made optional https://github.com/orgs/vercel/discussions/577#discussioncomment-2759412
let group = 1;

export async function writePrerenderConfig(
  resolvedConfig: ResolvedConfig,
  destination: string,
  isr: VercelOutputPrerenderConfig,
): Promise<void> {
  const parsed = path.parse(destination);

  const outfile = path.join(getOutput(resolvedConfig, "functions"), parsed.dir, `${parsed.name}.prerender-config.json`);

  await fs.mkdir(path.join(getOutput(resolvedConfig, "functions"), parsed.dir), { recursive: true });

  await fs.writeFile(
    outfile,
    JSON.stringify(
      vercelOutputPrerenderConfigSchema.parse({
        group: group++,
        ...isr,
      }),
      undefined,
      2,
    ),
    "utf-8",
  );
}

export function getPrerenderSymlinkInfo(resolvedConfig: ResolvedConfig, destination: string, target: string) {
  const parsed = path.parse(destination);
  const targetParsed = path.parse(target);

  return {
    target: path.join(getOutput(resolvedConfig, "functions"), targetParsed.dir, `${targetParsed.name}.func`),
    link: path.join(getOutput(resolvedConfig, "functions"), parsed.dir, `${parsed.name}.func`),
  };
}

export async function buildPrerenderConfigs(
  resolvedConfig: ResolvedConfig,
  extractedIsr: Record<string, VercelOutputIsr>,
): Promise<NonNullable<Rewrite[]>> {
  const isr = Object.assign({}, extractedIsr, await getIsrConfig(resolvedConfig));

  const entries = Object.entries(isr);
  const rewrites: Rewrite[] = [];

  for (const [destination, { symlink, route, ...isr }] of entries) {
    await writePrerenderConfig(resolvedConfig, destination, isr);
    if (symlink) {
      const info = getPrerenderSymlinkInfo(resolvedConfig, destination, symlink);
      // FIXME symlinks are currently broken https://github.com/orgs/vercel/discussions/577#discussioncomment-2767120
      // await fs.symlink(
      //   path.relative(path.dirname(info.link), info.target),
      //   info.link,
      // );
      await copyDir(info.target, info.link);
    }
    if (route) {
      rewrites.push({
        source: `(${route})`,
        destination: `${destination}/?__original_path=$1`,
      });
    }
  }

  return rewrites;
}

async function getIsrConfig(resolvedConfig: ResolvedConfig): Promise<Record<string, VercelOutputIsr>> {
  const isr = resolvedConfig.vercel?.isr ?? {};
  if (typeof isr === "function") {
    return await isr();
  }
  return isr;
}
