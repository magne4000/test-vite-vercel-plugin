import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

export function teardown(displayName: string) {
  return async () => {
    const tmpdir = path.join(os.tmpdir(), `vpv-demo-${displayName}`);

    await fs.rm(tmpdir, {
      recursive: true,
      force: true,
    });
  };
}
