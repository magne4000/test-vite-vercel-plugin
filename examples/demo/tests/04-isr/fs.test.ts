import { testFs } from "../common/helpers";
import { describe } from "vitest";
import path from "node:path";

describe("fs", () => {
  testFs(path.basename(__dirname), [
    "/config.json",
    "/functions/api/name/[name].func/.vc-config.json",
    "/functions/api/name/[name].func/index.mjs",
    "/functions/api/page.func/index.mjs",
    "/functions/api/page.func/.vc-config.json",
    "/functions/api/post.func/index.mjs",
    "/functions/api/post.func/.vc-config.json",
    "/functions/edge.func/index.js",
    "/functions/edge.func/.vc-config.json",
    "/functions/page1.func/index.mjs",
    "/functions/page1.func/.vc-config.json",
    "/functions/page1.prerender-config.json",
  ]);
});
