import fs from "node:fs/promises";
import path from "node:path";
import glob from "fast-glob";
import { beforeAll, describe } from "vitest";
import type { TestContext } from "../common/helpers";

export function prepareTestJsonFileContent<T extends TestContext>(file: string, callback: (context: T) => void) {
  const context = {
    file: undefined,
  } as T;

  beforeAll(async () => {
    const dest = path.join(__dirname, "../../.vercel/output", file);
    const entries = await glob(dest);

    if (entries.length !== 1) {
      throw new Error(`Multiple or no file matches ${dest}`);
    }

    const fileContent = await fs.readFile(entries[0], {
      encoding: "utf-8",
    });

    context.file = JSON.parse(fileContent);
  });

  describe(file, () => {
    callback(context);
  });
}

export function prepareTestJsonFilesContent<T extends TestContext>(files: string[], callback: (context: T) => void) {
  for (const f of files) {
    prepareTestJsonFileContent(f, callback);
  }
}
