import fs from "node:fs/promises";
import type { InlineConfig } from "vite";
import { callBuild, getTmpDir } from "./utils";

export function setup(displayName: string, inlineConfig: InlineConfig) {
  return async () => {
    const tmpdir = getTmpDir(displayName);

    await fs.rm(tmpdir, {
      recursive: true,
      force: true,
    });
    await fs.mkdir(tmpdir, {
      recursive: true,
    });

    await callBuild(inlineConfig);
  };
}
