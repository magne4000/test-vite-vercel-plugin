import os from "node:os";
import path from "node:path";
import { createBuilder, type InlineConfig } from "vite";

export function getTmpDir(displayName: string) {
  return path.join(os.tmpdir(), `vpv-demo-${displayName}`);
}

export async function callBuild(config: InlineConfig) {
  const builder = await createBuilder(config, null);
  await builder.buildApp();
}
