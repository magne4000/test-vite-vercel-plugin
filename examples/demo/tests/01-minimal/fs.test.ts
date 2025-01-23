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
    "/functions/og-edge.func/.vc-config.json",
    "/functions/og-edge.func/index.js",
    "/functions/og-node.func/.vc-config.json",
    "/functions/og-node.func/index.mjs",
    "/static/index.html",
    "/static/test.html",
  ]);
});
