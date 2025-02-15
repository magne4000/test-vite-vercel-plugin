import fs from "node:fs/promises";
import path from "node:path";
import glob from "fast-glob";
import { beforeAll, describe, expect, it } from "vitest";
import type { ZodSchema } from "zod";
import { getTmpDir } from "./utils";

export interface TestContext {
  file: unknown;
}

export function testFs(dirname: string, filesOrCallback: Iterable<string> | ((entries: string[]) => void)) {
  it("should generate the right files", async () => {
    const tmpdir = getTmpDir(dirname);
    const entries = await glob(`${tmpdir}/**`, { dot: true });
    let mappedEntries = entries.map((e) => e.replace(tmpdir, "")).filter((e) => !e.startsWith("/_ignore"));

    mappedEntries = Array.from(new Set(mappedEntries));

    if (typeof filesOrCallback === "function") {
      filesOrCallback(mappedEntries);
    } else {
      expect(mappedEntries.sort()).toMatchObject(Array.from(filesOrCallback).sort());
    }
  });
}

export function testSchema<T>(context: TestContext, schema: ZodSchema<T>) {
  it("should respect schema", () => {
    expect(schema.safeParse(context.file)).not.toHaveProperty("error");
  });
}

export function prepareTestJsonFilesContent<T extends TestContext>(
  dirname: string,
  files: string[],
  callback: (context: T) => void,
) {
  for (const f of files) {
    prepareTestJsonFileContent(dirname, f, callback);
  }
}

export function prepareTestJsonFileContent<T extends TestContext>(
  dirname: string,
  file: string,
  callback: (context: T) => void,
) {
  const context = {
    file: undefined,
  } as T;

  beforeAll(async () => {
    const dest = path.join(getTmpDir(dirname), file);
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
